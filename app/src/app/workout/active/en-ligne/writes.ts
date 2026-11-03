'use server';

import { randomUUID } from 'node:crypto';
import { uuidPattern } from './id';
import { transactionalDb as connection } from '@/db/transaction';
import { sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { requireUserId } from '@/lib/auth';
import { calculateLevel } from '@/lib/xp-utils';


function id(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new Error('Identifiant invalide');
  return value;
}

export async function recordOnlineSet(form: FormData) {
  const sessionId = id(form, 'session');
  const path = '/workout/active/en-ligne?id=' + sessionId + '&simple=1';
  if (!form.get('reps') || !form.get('weight')) redirect(path + '&error=values');
  const setId = id(form, 'submission');
  const result = await saveEditorSet(sessionId, id(form, 'exercise'), setId, Number(form.get('reps')),
    Number(form.get('weight')), Number(form.get('rest')), form.get('warmup') === 'on');
  redirect(path + (result ? '&saved=' + setId : '&error=values'));
}

export async function saveEditorSet(sessionId: string, exerciseId: string, setId: string,
  reps: number, weight: number, rest: number, warmup: boolean, rpe?: number, machineId?: string, notes?: string) {
  const userId = await requireUserId();
  if (![sessionId, exerciseId, setId].every(v => uuidPattern.test(v)) || !Number.isInteger(reps) || reps < 1 || reps > 100 ||
    !Number.isFinite(weight) || weight < 0 || weight > 9999.99 || !Number.isInteger(rest) || rest < 0 || rest > 600 ||
    (rpe !== undefined && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10))) return null;
  return connection.transaction(async tx => {
    const [session] = await tx.execute(sql`SELECT template_id, ended_at FROM workout_sessions
      WHERE id = ${sessionId} AND user_id = ${userId} AND session_type IS DISTINCT FROM 'cardio' FOR UPDATE`);
    if (!session || session.ended_at) return null;
    const [exercise] = await tx.execute(sql`SELECT e.id FROM exercises e WHERE e.id = ${exerciseId}
      AND (e.created_by IS NULL OR e.created_by = ${userId} OR EXISTS (
        SELECT 1 FROM workout_template_exercises te WHERE te.template_id = ${session.template_id} AND te.exercise_id = e.id
      ) OR EXISTS (SELECT 1 FROM workout_sets s WHERE s.session_id = ${sessionId} AND s.exercise_id = e.id))`);
    if (!exercise) return null;
    if (machineId) {
      const [machine] = await tx.execute(sql`SELECT id FROM user_machine_setups WHERE id = ${machineId} AND user_id = ${userId} AND exercise_id = ${exerciseId}`);
      if (!machine) return null;
    }
    const inserted = await tx.execute(sql`INSERT INTO workout_sets(id, session_id, exercise_id, set_number, reps, weight, rest_taken, is_warmup, is_pr, rpe, machine_setup_id, notes)
      SELECT ${setId}, ${sessionId}, ${exerciseId}, CASE WHEN ${warmup} THEN 0 ELSE coalesce(max(set_number), 0) + 1 END,
        ${reps}, ${weight}, ${rest}, ${warmup}, false, ${rpe ?? null}, ${machineId ?? null}, ${notes?.trim() || null} FROM workout_sets WHERE session_id = ${sessionId} AND exercise_id = ${exerciseId}
      ON CONFLICT (id) DO NOTHING RETURNING id`);
    if (!inserted.length) {
      const [previous] = await tx.execute(sql`SELECT id, is_pr FROM workout_sets WHERE id = ${setId} AND session_id = ${sessionId} AND exercise_id = ${exerciseId}`);
      return previous ? { id: setId, isPr: !!previous.is_pr } : null;
    }
    let isPr = false;
    if (!warmup && weight > 0) {
      const value = (weight * (1 + reps / 30)).toFixed(2);
      const record = await tx.execute(sql`INSERT INTO personal_records (id,user_id,exercise_id,record_type,value,workout_set_id)
        VALUES (${randomUUID()},${userId},${exerciseId},'1rm',${value},${setId})
        ON CONFLICT (user_id,exercise_id,record_type) DO UPDATE SET value = excluded.value,
          workout_set_id = excluded.workout_set_id, achieved_at = now()
        WHERE personal_records.value < excluded.value RETURNING id`);
      isPr = record.length > 0;
      if (isPr) await tx.execute(sql`UPDATE workout_sets SET is_pr = true WHERE id = ${setId}`);
    }
    return { id: setId, isPr };
  });
}

export async function finishOnlineWorkout(form: FormData) {
  const sessionId = id(form, 'session');
  await finishEditorSession(sessionId);
  redirect('/workout/active/en-ligne?id=' + sessionId + '&simple=1');
}

export async function finishEditorSession(sessionId: string) {
  const userId = await requireUserId();
  return connection.transaction(async tx => {
    const [session] = await tx.execute<{ started_at: string; ended_at: string | null }>(sql`SELECT started_at, ended_at FROM workout_sessions
      WHERE id = ${sessionId} AND user_id = ${userId} AND session_type IS DISTINCT FROM 'cardio' FOR UPDATE`);
    if (!session || session.ended_at) return;
    const [stats] = await tx.execute(sql`SELECT coalesce(sum(weight * reps) FILTER (WHERE is_warmup IS NOT TRUE), 0) AS volume,
      count(*) FILTER (WHERE is_pr) AS records FROM workout_sets WHERE session_id = ${sessionId}`);
    const [measurement] = await tx.execute(sql`SELECT weight FROM measurements WHERE user_id = ${userId} AND weight IS NOT NULL ORDER BY measured_at DESC LIMIT 1`);
    const minutes = Math.max(0, Math.round((Date.now() - new Date(session.started_at).getTime()) / 60000));
    const volume = Number(stats.volume);
    const calories = Math.round(4.5 * Number(measurement?.weight ?? 75) * minutes / 60 + Math.min(volume / 200, 100));
    const xp = (minutes > 0 || volume > 0 ? 50 : 0) + 10 * Math.floor(volume / 1000) + 25 * Number(stats.records);
    await tx.execute(sql`UPDATE workout_sessions SET ended_at = now(), duration_minutes = ${minutes}, total_volume = ${volume},
      calories_burned = ${calories} WHERE id = ${sessionId}`);
    const result = { duration: minutes, totalVolume: volume, xpEarned: xp, caloriesBurned: calories, prCount: Number(stats.records) };
    if (!xp) return result;
    await tx.execute(sql`INSERT INTO xp_transactions(id,user_id,amount,reason,reference_type,reference_id)
      VALUES (${randomUUID()},${userId},${xp},'workout_completed','workout_session',${sessionId})`);
    const [game] = await tx.execute(sql`INSERT INTO user_gamification(id,user_id,total_xp,current_streak,longest_streak,last_activity_date)
      VALUES (${randomUUID()},${userId},${xp},1,1,CURRENT_DATE)
      ON CONFLICT (user_id) DO UPDATE SET total_xp = coalesce(user_gamification.total_xp,0) + excluded.total_xp,
      current_streak = CASE WHEN user_gamification.last_activity_date = CURRENT_DATE THEN user_gamification.current_streak
        WHEN user_gamification.last_activity_date = CURRENT_DATE - 1 THEN coalesce(user_gamification.current_streak,0) + 1 ELSE 1 END,
      last_activity_date = CURRENT_DATE, updated_at = now() RETURNING total_xp`);
    const level = calculateLevel(Number(game.total_xp));
    await tx.execute(sql`UPDATE user_gamification SET current_level = ${level.level}, xp_to_next_level = ${level.xpToNext},
      longest_streak = greatest(current_streak,longest_streak) WHERE user_id = ${userId}`);
    return result;
  });
}

type EditorChange =
  | { kind: 'session-note'; note: string | null }
  | { kind: 'set-note'; id: string; note: string | null }
  | { kind: 'rest'; id: string; duration: number }
  | { kind: 'edit-set'; id: string; reps: number; weight: number }
  | { kind: 'remove-set' | 'remove-machine'; id: string }
  | { kind: 'swap'; exerciseId: string; previous: string }
  | { kind: 'exercise-note'; exerciseId: string; note: string | null }
  | { kind: 'save-machine'; id: string; exerciseId: string; machineLabel: string; photoBase64?: string | null;
      settings: { key: string; value: string }[]; isDefault: boolean; notes?: string | null };

export async function changeEditorSession(sessionId: string, change: EditorChange) {
  const userId = await requireUserId();
  await connection.transaction(async tx => {
    const [session] = await tx.execute(sql`SELECT template_id FROM workout_sessions WHERE id = ${sessionId}
      AND user_id = ${userId} AND session_type IS DISTINCT FROM 'cardio' AND ended_at IS NULL FOR UPDATE`);
    if (!session) throw new Error('Séance indisponible');
    if ('exerciseId' in change) {
      const [exercise] = await tx.execute(sql`SELECT id FROM exercises WHERE id = ${change.exerciseId} AND (created_by IS NULL OR created_by = ${userId})`);
      if (!exercise) throw new Error('Exercice indisponible');
    }
    switch (change.kind) {
      case 'session-note':
        await tx.execute(sql`UPDATE workout_sessions SET notes = ${change.note} WHERE id = ${sessionId}`);
        break;
      case 'set-note':
        await tx.execute(sql`UPDATE workout_sets SET notes = ${change.note} WHERE id = ${change.id} AND session_id = ${sessionId}`);
        break;
      case 'rest':
        if (!Number.isSafeInteger(change.duration) || change.duration < 0) throw new Error('Repos invalide');
        await tx.execute(sql`UPDATE workout_sets SET rest_taken = ${change.duration} WHERE id = ${change.id} AND session_id = ${sessionId}`);
        break;
      case 'edit-set':
        if (!Number.isInteger(change.reps) || change.reps < 1 || change.reps > 100 || !Number.isFinite(change.weight) || change.weight < 0 || change.weight > 9999.99) throw new Error('Série invalide');
        await tx.execute(sql`UPDATE workout_sets SET reps = ${change.reps}, weight = ${change.weight} WHERE id = ${change.id} AND session_id = ${sessionId}`);
        break;
      case 'remove-set':
        await tx.execute(sql`DELETE FROM personal_records WHERE user_id = ${userId} AND workout_set_id IN
          (SELECT id FROM workout_sets WHERE id = ${change.id} AND session_id = ${sessionId})`);
        await tx.execute(sql`DELETE FROM workout_sets WHERE id = ${change.id} AND session_id = ${sessionId}`);
        break;
      case 'swap':
        await tx.execute(sql`UPDATE workout_template_exercises SET exercise_id = ${change.exerciseId}
          WHERE template_id IN (SELECT id FROM workout_templates WHERE id = ${session.template_id} AND user_id = ${userId}) AND exercise_id = ${change.previous}`);
        break;
      case 'exercise-note':
        if (change.note) await tx.execute(sql`INSERT INTO user_exercise_notes(user_id,exercise_id,notes) VALUES (${userId},${change.exerciseId},${change.note})
          ON CONFLICT (user_id,exercise_id) DO UPDATE SET notes = excluded.notes, updated_at = now()`);
        else await tx.execute(sql`DELETE FROM user_exercise_notes WHERE user_id = ${userId} AND exercise_id = ${change.exerciseId}`);
        break;
      case 'save-machine': {
        if (!change.machineLabel.trim() || !Array.isArray(change.settings)) throw new Error('Réglage invalide');
        if (change.isDefault) await tx.execute(sql`UPDATE user_machine_setups SET is_default = false WHERE user_id = ${userId} AND exercise_id = ${change.exerciseId}`);
        const changed = await tx.execute(sql`INSERT INTO user_machine_setups(id,user_id,exercise_id,machine_label,photo_base64,settings,is_default,notes)
          VALUES (${change.id},${userId},${change.exerciseId},${change.machineLabel},${change.photoBase64 ?? null},${JSON.stringify(change.settings)},${change.isDefault},${change.notes ?? null})
          ON CONFLICT (id) DO UPDATE SET machine_label = excluded.machine_label, photo_base64 = excluded.photo_base64, settings = excluded.settings,
            is_default = excluded.is_default, notes = excluded.notes, updated_at = now()
          WHERE user_machine_setups.user_id = excluded.user_id AND user_machine_setups.exercise_id = excluded.exercise_id RETURNING id`);
        if (!changed.length) throw new Error('Réglage indisponible');
        break;
      }
      case 'remove-machine':
        await tx.execute(sql`DELETE FROM user_machine_setups WHERE id = ${change.id} AND user_id = ${userId}`);
        break;
      default:
        throw new Error('Modification inconnue');
    }
  });
}
