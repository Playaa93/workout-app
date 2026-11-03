import { sql, type SQL } from 'drizzle-orm';
import { transactionalDb } from '@/db/transaction';

type CrudOperation = {
  op: 'PUT' | 'PATCH' | 'DELETE';
  table: string;
  id: string;
  data?: Record<string, unknown>;
};

const WRITABLE_TABLES = new Set([
  'measurements', 'progress_photos', 'morpho_profiles',
  'workout_sessions', 'workout_sets', 'workout_templates',
  'workout_template_exercises', 'cardio_intervals', 'personal_records', 'user_exercise_notes',
  'user_machine_setups',
  'food_entries', 'nutrition_daily_summary', 'nutrition_profiles',
  'user_gamification', 'xp_transactions', 'user_achievements',
  'boss_fights', 'activity_log', 'user_settings',
  'foods', 'exercises',
]);

const USER_OWNED_TABLES = new Set([
  'measurements', 'progress_photos', 'morpho_profiles',
  'workout_sessions', 'workout_templates', 'personal_records', 'user_exercise_notes',
  'user_machine_setups',
  'food_entries', 'nutrition_daily_summary', 'nutrition_profiles',
  'user_gamification', 'xp_transactions', 'user_achievements',
  'boss_fights', 'activity_log', 'user_settings',
]);

const BOOLEAN_COLUMNS = new Set([
  'is_active', 'notifications_enabled', 'is_custom', 'is_public',
  'is_boss_fight', 'boss_fight_completed', 'is_warmup', 'is_pr',
  'verified', 'recognized_by_ai', 'is_cheat', 'is_male', 'is_secret',
  'is_default',
]);

// Columns stored as JSON text in SQLite but as text[] in PostgreSQL
const ARRAY_COLUMNS = new Set([
  'target_muscles', 'primary_muscles', 'secondary_muscles',
  'equipment', 'equipment_alternatives', 'aliases',
  'stabilizers', 'good_for', 'bad_for', 'modifications',
  'synergies', 'antagonists', 'contraindications',
  'technique_cues', 'common_mistakes', 'instructions',
  'strengths', 'weaknesses', 'recommended_exercises', 'exercises_to_avoid',
]);

// Column name validation — prevents SQL injection via sql.raw()
const VALID_COLUMN_NAME = /^[a-z][a-z0-9_]*$/;
const FORBIDDEN_COLUMNS = new Set(['password_hash', 'gemini_api_key', 'groq_api_key']);

// Child tables → parent ownership config
const CHILD_TABLE_CONFIG: Record<string, { parentTable: string; foreignKey: string }> = {
  workout_sets: { parentTable: 'workout_sessions', foreignKey: 'session_id' },
  workout_template_exercises: { parentTable: 'workout_templates', foreignKey: 'template_id' },
  cardio_intervals: { parentTable: 'workout_sessions', foreignKey: 'session_id' },
};

function validateColumnNames(data: Record<string, unknown>): void {
  for (const key of Object.keys(data)) {
    if (!VALID_COLUMN_NAME.test(key) || FORBIDDEN_COLUMNS.has(key)) {
      throw new UploadError(`Invalid column name: ${key}`);
    }
  }
}

function convertValue(key: string, value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (BOOLEAN_COLUMNS.has(key)) return value === 1 || value === true;
  if (ARRAY_COLUMNS.has(key) && typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Convert to PostgreSQL array literal format: {"val1","val2"}
        return `{${parsed.map((v: string) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',')}}`;
      }
    } catch { /* not JSON, return as-is */ }
  }
  return value;
}

export class UploadError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

function ownedRow(table: string, userId: string): SQL {
  const name = sql.raw(`"${table}"`);
  if (USER_OWNED_TABLES.has(table)) return sql`${name}.user_id = ${userId}`;
  if (table === 'foods' || table === 'exercises') return sql`${name}.created_by = ${userId}`;
  const child = CHILD_TABLE_CONFIG[table];
  if (child) return sql`${name}.${sql.raw(`"${child.foreignKey}"`)} IN
    (SELECT id FROM ${sql.raw(`"${child.parentTable}"`)} WHERE user_id = ${userId})`;
  throw new UploadError('Unsupported resource');
}

function newParent(table: string, data: Record<string, unknown>, userId: string): SQL {
  const child = CHILD_TABLE_CONFIG[table];
  if (!child) return sql`true`;
  const id = data[child.foreignKey];
  if (typeof id !== 'string' || !id) throw new UploadError(`Missing foreign key ${child.foreignKey}`);
  return sql`EXISTS (SELECT 1 FROM ${sql.raw(`"${child.parentTable}"`)} WHERE id = ${id} AND user_id = ${userId})`;
}

function validateOperations(input: unknown): CrudOperation[] {
  if (!Array.isArray(input)) throw new UploadError('Invalid operations');
  return input.map(value => {
    if (!value || !['PUT', 'PATCH', 'DELETE'].includes(value.op) || !WRITABLE_TABLES.has(value.table) ||
      typeof value.id !== 'string' || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value.id)) {
      throw new UploadError('Invalid operation');
    }
    if (value.op !== 'DELETE' && (!value.data || typeof value.data !== 'object' || Array.isArray(value.data))) throw new UploadError('Invalid operation data');
    const data = { ...value.data };
    validateColumnNames(data);
    if ('id' in data && data.id !== value.id) throw new UploadError('Invalid resource ID');
    delete data.id;
    return { op: value.op, table: value.table, id: value.id, data };
  });
}

export async function applyCrudOperations(input: unknown, userId: string) {
  const operations = validateOperations(input);
  if (!operations.length) return;
  await transactionalDb.transaction(async tx => {
    for (const op of operations) {
      const table = sql.raw(`"${op.table}"`);
      const scope = ownedRow(op.table, userId);
      const data = op.data!;
      if (USER_OWNED_TABLES.has(op.table)) data.user_id = userId;
      if (op.table === 'foods' || op.table === 'exercises') {
        data.created_by = userId;
        if (op.table === 'exercises') data.is_custom = true;
      }
      if (op.op === 'DELETE') {
        await tx.execute(sql`DELETE FROM ${table} WHERE id = ${op.id} AND ${scope}`);
        continue;
      }
      const entries = Object.entries(data);
      if (op.op === 'PUT') {
        const columns = [sql.raw('id'), ...entries.map(([key]) => sql.raw(`"${key}"`))];
        const values = [sql`${op.id}`, ...entries.map(([key, value]) => sql`${convertValue(key, value)}`)];
        const updates = entries.map(([key]) => sql`${sql.raw(`"${key}"`)} = ${sql.raw(`EXCLUDED."${key}"`)}`);
        const rows = await tx.execute(sql`INSERT INTO ${table} (${sql.join(columns, sql`, `)})
          SELECT ${sql.join(values, sql`, `)} WHERE ${newParent(op.table, data, userId)}
          ON CONFLICT (id) DO UPDATE SET ${sql.join(updates, sql`, `)} WHERE ${scope} RETURNING id`);
        if (!rows.length) throw new UploadError('Resource not owned by user', 403);
      } else {
        const assignments = entries.map(([key, value]) => sql`${sql.raw(`"${key}"`)} = ${convertValue(key, value)}`);
        if (!assignments.length) continue;
        const child = CHILD_TABLE_CONFIG[op.table];
        const target = child && child.foreignKey in data ? newParent(op.table, data, userId) : sql`true`;
        const rows = await tx.execute(sql`UPDATE ${table} SET ${sql.join(assignments, sql`, `)}
          WHERE id = ${op.id} AND ${scope} AND ${target} RETURNING id`);
        if (!rows.length) {
          // A remotely deleted record is a safe no-op. An existing foreign record is rejected.
          const existing = await tx.execute(sql`SELECT id FROM ${table} WHERE id = ${op.id}`);
          if (existing.length) throw new UploadError('Resource not owned by user', 403);
        }
      }
    }
  });
}
