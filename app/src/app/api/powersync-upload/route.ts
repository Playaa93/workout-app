import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

async function getUserIdFromRequest(request: Request): Promise<string | null> {
  // Try cookie-based session first (web)
  const session = await getSession();
  if (session) return session.userId;

  // Try bearer token (native)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    try {
      const { payload } = await jwtVerify(
        authHeader.slice(7),
        new TextEncoder().encode(secret)
      );
      return (payload.userId as string) || null;
    } catch {
      return null;
    }
  }

  return null;
}

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
      throw new Error(`Invalid column name: ${key}`);
    }
  }
}

async function verifyParentOwnership(table: string, data: Record<string, unknown>, userId: string): Promise<void> {
  const config = CHILD_TABLE_CONFIG[table];
  if (!config) return;
  const parentId = data[config.foreignKey] as string | undefined;
  if (!parentId) throw new Error(`Missing foreign key ${config.foreignKey}`);
  const result = await db.execute(
    sql`SELECT id FROM ${sql.raw(`"${config.parentTable}"`)} WHERE id = ${parentId} AND user_id = ${userId}`
  );
  if (!result.rows?.length) throw new Error('Parent resource not owned by user');
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

// Build a drizzle sql tagged template with dynamic columns and values
function buildUpsertSql(table: string, id: string, data: Record<string, unknown>) {
  const allData: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(data)) {
    allData[k] = convertValue(k, v);
  }

  const keys = Object.keys(allData);
  const values = keys.map(k => allData[k]);

  // Build: INSERT INTO "table" ("col1", "col2") VALUES (val1, val2) ON CONFLICT (id) DO UPDATE SET "col2" = EXCLUDED."col2"
  const colsSql = keys.map(k => sql.raw(`"${k}"`));
  const updateKeys = keys.filter(k => k !== 'id');

  // Construct the SQL using sql template
  let query = sql`INSERT INTO ${sql.raw(`"${table}"`)} (`;
  for (let i = 0; i < colsSql.length; i++) {
    if (i > 0) query = sql`${query}, `;
    query = sql`${query}${colsSql[i]}`;
  }
  query = sql`${query}) VALUES (`;
  for (let i = 0; i < values.length; i++) {
    if (i > 0) query = sql`${query}, `;
    query = sql`${query}${values[i]}`;
  }
  query = sql`${query}) ON CONFLICT (id) DO UPDATE SET `;
  for (let i = 0; i < updateKeys.length; i++) {
    if (i > 0) query = sql`${query}, `;
    query = sql`${query}${sql.raw(`"${updateKeys[i]}" = EXCLUDED."${updateKeys[i]}"`)}`;
  }

  return query;
}

function buildUpdateSql(table: string, id: string, data: Record<string, unknown>) {
  const entries = Object.entries(data);
  let query = sql`UPDATE ${sql.raw(`"${table}"`)} SET `;
  for (let i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];
    if (i > 0) query = sql`${query}, `;
    query = sql`${query}${sql.raw(`"${k}"`)} = ${convertValue(k, v)}`;
  }
  query = sql`${query} WHERE id = ${id}`;
  return query;
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const operations: CrudOperation[] = body.operations;

  if (!Array.isArray(operations)) {
    return NextResponse.json({ error: 'Invalid operations' }, { status: 400 });
  }

  try {
    for (const op of operations) {
      if (!WRITABLE_TABLES.has(op.table)) {
        console.warn(`Rejected write to non-writable table: ${op.table}`);
        continue;
      }

      // Enforce user_id ownership
      if (USER_OWNED_TABLES.has(op.table) && op.data) {
        op.data.user_id = userId;
      }

      // Enforce created_by for custom content
      if ((op.table === 'exercises' || op.table === 'foods') && op.data) {
        op.data.created_by = userId;
        if (op.table === 'exercises') op.data.is_custom = true;
      }

      switch (op.op) {
        case 'PUT': {
          if (!op.data) break;
          validateColumnNames(op.data);
          if (CHILD_TABLE_CONFIG[op.table]) {
            await verifyParentOwnership(op.table, op.data, userId);
          }
          await db.execute(buildUpsertSql(op.table, op.id, op.data));
          break;
        }
        case 'PATCH': {
          if (!op.data || Object.keys(op.data).length === 0) break;
          validateColumnNames(op.data);
          if (CHILD_TABLE_CONFIG[op.table]) {
            await verifyParentOwnership(op.table, op.data, userId);
          }
          await db.execute(buildUpdateSql(op.table, op.id, op.data));
          break;
        }
        case 'DELETE': {
          if (USER_OWNED_TABLES.has(op.table)) {
            await db.execute(sql`DELETE FROM ${sql.raw(`"${op.table}"`)} WHERE id = ${op.id} AND user_id = ${userId}`);
          } else if (CHILD_TABLE_CONFIG[op.table]) {
            const config = CHILD_TABLE_CONFIG[op.table];
            await db.execute(
              sql`DELETE FROM ${sql.raw(`"${op.table}"`)} WHERE id = ${op.id} AND ${sql.raw(`"${config.foreignKey}"`)} IN (SELECT id FROM ${sql.raw(`"${config.parentTable}"`)} WHERE user_id = ${userId})`
            );
          } else if (op.table === 'exercises' || op.table === 'foods') {
            await db.execute(sql`DELETE FROM ${sql.raw(`"${op.table}"`)} WHERE id = ${op.id} AND created_by = ${userId}`);
          } else {
            await db.execute(sql`DELETE FROM ${sql.raw(`"${op.table}"`)} WHERE id = ${op.id}`);
          }
          break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PowerSync upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
