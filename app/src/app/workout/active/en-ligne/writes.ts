'use server';

import { randomUUID } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { requireUserId } from '@/lib/auth';
import { calculateLevel } from '@/lib/xp-utils';

// Interactive transactions keep the set, its record and the end-of-session rewards atomic.
const connection = drizzle(postgres(process.env.DATABASE_URL!, { max: 2, prepare: false, idle_timeout: 15, connect_timeout: 8 }));
const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function id(form: FormData, key: string) {
  const value = form.get(key);
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new Error('Identifiant invalide');
  return value;
}

export async function recordOnlineSet(form: FormData) {
  const userId = await requireUserId();
  const sessionId = id(form, 'session'), exerciseId = id(form, 'exercise'), setId = id(form, 'submission');
  const reps = Number(form.get('reps')), weight = Number(form.get('weight')), rest = Number(form.get('rest'));
  const path = '/workout/active/en-ligne?id=' + sessionId;
  if (!form.get('reps') || !form.get('weight') || !Number.isInteger(reps) || reps < 1 || reps > 100 ||
      !Number.isFinite(weight) || weight < 0 || weight > 9999.99 || !Number.isInteger(rest) || rest < 0 || rest > 600) {
    redirect(path + '&error=values');
  }
  const warmup = form.get('warmup') === 'on';
  const saved = await connection.transaction(async tx => {
    const [session] = await tx.execute(sql`SELECT template_id, ended_at FROM workout_sessions
      WHERE id = ${sessionId} AND user_id = ${userId} AND session_type IS DISTINCT FROM 'cardio' FOR UPDATE`);
    if (!session || session.ended_at) return false;
    const [exercise] = await tx.execute(sql`SELECT e.id FROM exercises e WHERE e.id = ${exerciseId}
      AND (e.created_by IS NULL OR e.created_by = ${userId} OR EXISTS (
        SELECT 1 FROM workout_template_exercises te WHERE te.template_id = ${session.template_id} AND te.exercise_id = e.id
      ) OR EXISTS (SELECT 1 FROM workout_sets s WHERE s.session_id = ${sessionId} AND s.exercise_id = e.id))`);
    if (!exercise) return false;
    const inserted = await tx.execute(sql`INSERT INTO workout_sets(id, session_id, exercise_id, set_number, reps, weight, rest_taken, is_warmup, is_pr)
      SELECT ${setId}, ${sessionId}, ${exerciseId}, CASE WHEN ${warmup} THEN 0 ELSE coalesce(max(set_number), 0) + 1 END,
        ${reps}, ${weight}, ${rest}, ${warmup}, false FROM workout_sets WHERE session_id = ${sessionId} AND exercise_id = ${exerciseId}
      ON CONFLICT (id) DO NOTHING RETURNING id`);
    if (!inserted.length) {
      const [previous] = await tx.execute(sql`SELECT id FROM workout_sets WHERE id = ${setId} AND session_id = ${sessionId} AND exercise_id = ${exerciseId}`);
      return !!previous;
    }
    if (!warmup && weight > 0) {
      const value = (weight * (1 + reps / 30)).toFixed(2);
      const record = await tx.execute(sql`INSERT INTO personal_records (id,user_id,exercise_id,record_type,value,workout_set_id)
        VALUES (${randomUUID()},${userId},${exerciseId},'1rm',${value},${setId})
        ON CONFLICT (user_id,exercise_id,record_type) DO UPDATE SET value = excluded.value,
          workout_set_id = excluded.workout_set_id, achieved_at = now()
        WHERE personal_records.value < excluded.value RETURNING id`);
      if (record.length) await tx.execute(sql`UPDATE workout_sets SET is_pr = true WHERE id = ${setId}`);
    }
    return true;
  });
  redirect(path + (saved ? '&saved=' + setId : '&error=closed'));
}

export async function finishOnlineWorkout(form: FormData) {
  const userId = await requireUserId();
  const sessionId = id(form, 'session');
  await connection.transaction(async tx => {
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
    if (!xp) return;
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
  });
  redirect('/workout/active/en-ligne?id=' + sessionId);
}
