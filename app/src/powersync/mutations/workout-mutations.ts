'use client';

import { usePowerSync } from '@powersync/react';
import { useUserId } from '../auth-context';
import { uuid, nowISO, todayStr } from '../helpers';

export function useWorkoutMutations() {
  const db = usePowerSync();
  const userId = useUserId();

  async function startWorkoutSession(templateId?: string): Promise<string> {
    const id = uuid();
    const now = nowISO();

    await db.execute(
      `INSERT INTO workout_sessions (id, user_id, template_id, started_at, session_type, created_at)
       VALUES (?, ?, ?, ?, 'strength', ?)`,
      [id, userId, templateId ?? null, now, now]
    );

    return id;
  }

  async function addSet(
    sessionId: string,
    exerciseId: string,
    setNumber: number,
    reps: number,
    weight: number,
    rpe?: number,
    isWarmup = false,
    restTaken?: number
  ): Promise<{ id: string; isPr: boolean }> {
    const estimated1RM = weight * (1 + reps / 30);
    let isPr = false;

    let currentPR: { id: string; value: string } | null = null;
    if (weight > 0 && reps > 0 && !isWarmup) {
      currentPR = await db.getOptional<{ id: string; value: string }>(
        `SELECT id, value FROM personal_records WHERE user_id = ? AND exercise_id = ? AND record_type = '1rm'`,
        [userId, exerciseId]
      );
      isPr = !currentPR || estimated1RM > parseFloat(currentPR.value);
    }

    const id = uuid();
    const now = nowISO();

    await db.execute(
      `INSERT INTO workout_sets (id, session_id, exercise_id, set_number, reps, weight, rpe, is_warmup, is_pr, rest_taken, performed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sessionId, exerciseId, setNumber, reps, weight.toString(), rpe ?? null, isWarmup ? 1 : 0, isPr ? 1 : 0, restTaken ?? null, now]
    );

    if (isPr) {
      if (currentPR) {
        await db.execute(
          `UPDATE personal_records SET value = ?, workout_set_id = ?, achieved_at = ? WHERE id = ?`,
          [estimated1RM.toFixed(2), id, now, currentPR.id]
        );
      } else {
        await db.execute(
          `INSERT INTO personal_records (id, user_id, exercise_id, record_type, value, workout_set_id, achieved_at)
           VALUES (?, ?, ?, '1rm', ?, ?, ?)`,
          [uuid(), userId, exerciseId, estimated1RM.toFixed(2), id, now]
        );
      }
    }

    return { id, isPr };
  }

  async function updateSet(
    setId: string,
    reps: number,
    weight: number,
    rpe?: number,
    restTaken?: number
  ): Promise<void> {
    const sets: string[] = ['reps = ?', 'weight = ?'];
    const vals: unknown[] = [reps, weight.toString()];
    if (rpe !== undefined) { sets.push('rpe = ?'); vals.push(rpe); }
    if (restTaken !== undefined) { sets.push('rest_taken = ?'); vals.push(restTaken); }
    vals.push(setId);

    await db.execute(`UPDATE workout_sets SET ${sets.join(', ')} WHERE id = ?`, vals);
  }

  async function updateSetRestTaken(setId: string, restTaken: number): Promise<void> {
    await db.execute(`UPDATE workout_sets SET rest_taken = ? WHERE id = ?`, [restTaken, setId]);
  }

  async function updateSetNotes(setId: string, notes: string | null): Promise<void> {
    await db.execute(`UPDATE workout_sets SET notes = ? WHERE id = ?`, [notes, setId]);
  }

  async function upsertExerciseNote(exerciseId: string, notes: string | null): Promise<void> {
    if (!notes) {
      await db.execute(`DELETE FROM user_exercise_notes WHERE user_id = ? AND exercise_id = ?`, [userId, exerciseId]);
      return;
    }
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM user_exercise_notes WHERE user_id = ? AND exercise_id = ?`,
      [userId, exerciseId]
    );
    const now = nowISO();
    if (existing) {
      await db.execute(`UPDATE user_exercise_notes SET notes = ?, updated_at = ? WHERE id = ?`, [notes, now, existing.id]);
    } else {
      await db.execute(
        `INSERT INTO user_exercise_notes (id, user_id, exercise_id, notes, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [uuid(), userId, exerciseId, notes, now]
      );
    }
  }

  async function updateSessionNotes(sessionId: string, notes: string | null): Promise<void> {
    await db.execute(`UPDATE workout_sessions SET notes = ? WHERE id = ?`, [notes, sessionId]);
  }

  async function deleteSet(setId: string): Promise<void> {
    // Clean up PR reference
    await db.execute(`DELETE FROM personal_records WHERE workout_set_id = ?`, [setId]);
    await db.execute(`DELETE FROM workout_sets WHERE id = ?`, [setId]);
  }

  async function endWorkoutSession(
    sessionId: string,
    perceivedDifficulty?: number,
    notes?: string
  ): Promise<{
    xpEarned: number;
    totalVolume: number;
    duration: number;
    prCount: number;
    caloriesBurned: number;
  }> {
    const [session, stats, weightRow] = await Promise.all([
      db.getOptional<{ started_at: string }>(
        `SELECT started_at FROM workout_sessions WHERE id = ?`,
        [sessionId]
      ),
      db.getOptional<{ total_volume: number; pr_count: number }>(
        `SELECT
          COALESCE(SUM(CASE WHEN is_warmup = 0 THEN CAST(weight AS REAL) * reps ELSE 0 END), 0) as total_volume,
          COALESCE(SUM(CASE WHEN is_pr = 1 THEN 1 ELSE 0 END), 0) as pr_count
        FROM workout_sets WHERE session_id = ?`,
        [sessionId]
      ),
      db.getOptional<{ weight: string }>(
        `SELECT weight FROM measurements WHERE user_id = ? AND weight IS NOT NULL ORDER BY measured_at DESC LIMIT 1`,
        [userId]
      ),
    ]);
    if (!session) throw new Error('Session not found');

    const endTime = new Date();
    const startTime = new Date(session.started_at);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const totalVolume = stats?.total_volume || 0;
    const prCount = stats?.pr_count || 0;
    const userWeightKg = weightRow ? parseFloat(weightRow.weight) : 75;

    // Estimate calories
    let met = 4.5;
    if (perceivedDifficulty) {
      met = 3.5 + (perceivedDifficulty / 10) * 2.5;
    }
    const durationHours = durationMinutes / 60;
    let calories = met * userWeightKg * durationHours;
    const volumeBonus = Math.min(totalVolume / 10000 * 50, 100);
    calories += volumeBonus;
    const caloriesBurned = Math.round(calories);

    const now = nowISO();

    // Update session
    await db.execute(
      `UPDATE workout_sessions SET
        ended_at = ?, duration_minutes = ?, total_volume = ?,
        calories_burned = ?, perceived_difficulty = ?, notes = ?
      WHERE id = ?`,
      [now, durationMinutes, totalVolume.toFixed(2), caloriesBurned, perceivedDifficulty ?? null, notes ?? null, sessionId]
    );

    // XP calculation
    const baseXp = (durationMinutes > 0 || totalVolume > 0) ? 50 : 0;
    const volumeXp = Math.floor(totalVolume / 1000) * 10;
    const prXp = prCount * 25;
    const totalXp = baseXp + volumeXp + prXp;

    if (totalXp > 0) {
      const today = todayStr();

      // XP transaction
      await db.execute(
        `INSERT INTO xp_transactions (id, user_id, amount, reason, reference_type, reference_id, created_at)
         VALUES (?, ?, ?, 'workout_completed', 'workout_session', ?, ?)`,
        [uuid(), userId, totalXp, sessionId, now]
      );

      // Update gamification
      const existing = await db.getOptional<{ id: string; total_xp: number }>(
        `SELECT id, total_xp FROM user_gamification WHERE user_id = ?`,
        [userId]
      );

      if (existing) {
        await db.execute(
          `UPDATE user_gamification SET total_xp = total_xp + ?, last_activity_date = ?, updated_at = ? WHERE user_id = ?`,
          [totalXp, today, now, userId]
        );
      } else {
        await db.execute(
          `INSERT INTO user_gamification (id, user_id, total_xp, current_level, xp_to_next_level, current_streak, longest_streak, streak_freeze_available, last_activity_date, avatar_stage, created_at, updated_at)
           VALUES (?, ?, ?, 1, 100, 0, 0, 1, ?, 1, ?, ?)`,
          [uuid(), userId, totalXp, today, now, now]
        );
      }

      // Update streak
      await updateStreakLocal();
    }

    return { xpEarned: totalXp, totalVolume, duration: durationMinutes, prCount, caloriesBurned };
  }

  async function updateStreakLocal(): Promise<void> {
    const today = todayStr();
    const row = await db.getOptional<{
      current_streak: number;
      longest_streak: number;
      last_activity_date: string | null;
    }>(
      `SELECT current_streak, longest_streak, last_activity_date FROM user_gamification WHERE user_id = ?`,
      [userId]
    );
    if (!row) return;

    let newStreak = row.current_streak || 0;
    if (!row.last_activity_date) {
      newStreak = 1;
    } else {
      const diffDays = Math.floor(
        (new Date(today).getTime() - new Date(row.last_activity_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 0) { /* same day */ }
      else if (diffDays === 1) { newStreak++; }
      else { newStreak = 1; }
    }
    const newLongest = Math.max(newStreak, row.longest_streak || 0);
    const now = nowISO();

    await db.execute(
      `UPDATE user_gamification SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = ? WHERE user_id = ?`,
      [newStreak, newLongest, today, now, userId]
    );
  }

  async function deleteSession(sessionId: string): Promise<void> {
    await db.execute(`DELETE FROM workout_sets WHERE session_id = ?`, [sessionId]);
    await db.execute(`DELETE FROM workout_sessions WHERE id = ?`, [sessionId]);
  }

  async function deleteTemplate(templateId: string): Promise<void> {
    await db.execute(`DELETE FROM workout_template_exercises WHERE template_id = ?`, [templateId]);
    await db.execute(`DELETE FROM workout_templates WHERE id = ?`, [templateId]);
  }

  async function swapTemplateExercise(
    templateId: string,
    oldExerciseId: string,
    newExerciseId: string
  ): Promise<void> {
    await db.execute(
      `UPDATE workout_template_exercises SET exercise_id = ? WHERE template_id = ? AND exercise_id = ?`,
      [newExerciseId, templateId, oldExerciseId]
    );
  }

  // Cardio
  async function startCardioSession(activity: string): Promise<string> {
    const id = uuid();
    const now = nowISO();
    await db.execute(
      `INSERT INTO workout_sessions (id, user_id, session_type, cardio_activity, started_at, created_at)
       VALUES (?, ?, 'cardio', ?, ?, ?)`,
      [id, userId, activity, now, now]
    );
    return id;
  }

  async function addCardioInterval(sessionId: string, data: {
    intervalNumber: number;
    durationSeconds?: number;
    distanceMeters?: number;
    paceSecondsPerKm?: number;
    heartRate?: number;
  }): Promise<string> {
    const id = uuid();
    const now = nowISO();
    await db.execute(
      `INSERT INTO cardio_intervals (id, session_id, interval_number, duration_seconds, distance_meters, pace_seconds_per_km, heart_rate, performed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, sessionId, data.intervalNumber, data.durationSeconds ?? null, data.distanceMeters?.toString() ?? null, data.paceSecondsPerKm ?? null, data.heartRate ?? null, now]
    );
    return id;
  }

  async function endCardioSession(
    sessionId: string,
    data: {
      distanceMeters?: number;
      avgHeartRate?: number;
      maxHeartRate?: number;
      perceivedDifficulty?: number;
      notes?: string;
    }
  ): Promise<{
    xpEarned: number;
    duration: number;
    distanceMeters: number;
    avgPaceSecondsPerKm: number;
    caloriesBurned: number;
  }> {
    const [session, weightRow] = await Promise.all([
      db.getOptional<{ started_at: string; cardio_activity: string }>(
        `SELECT started_at, cardio_activity FROM workout_sessions WHERE id = ?`,
        [sessionId]
      ),
      db.getOptional<{ weight: string }>(
        `SELECT weight FROM measurements WHERE user_id = ? AND weight IS NOT NULL ORDER BY measured_at DESC LIMIT 1`,
        [userId]
      ),
    ]);
    if (!session) throw new Error('Session not found');

    const endTime = new Date();
    const startTime = new Date(session.started_at);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

    const distanceM = data.distanceMeters || 0;
    const pace = distanceM > 0 ? Math.round(durationSeconds / (distanceM / 1000)) : 0;
    const speed = distanceM > 0 ? Math.round((distanceM / 1000) / (durationSeconds / 3600) * 100) / 100 : 0;

    const weightKg = weightRow ? parseFloat(weightRow.weight) : 75;
    const met = 6 + (data.perceivedDifficulty ? (data.perceivedDifficulty / 10) * 4 : 2);
    const caloriesBurned = Math.round(met * weightKg * (durationMinutes / 60));

    const now = nowISO();

    await db.execute(
      `UPDATE workout_sessions SET
        ended_at = ?, duration_minutes = ?, distance_meters = ?,
        avg_pace_seconds_per_km = ?, avg_speed_kmh = ?,
        avg_heart_rate = ?, max_heart_rate = ?,
        calories_burned = ?, perceived_difficulty = ?, notes = ?
      WHERE id = ?`,
      [
        now, durationMinutes, distanceM.toString(),
        pace, speed.toFixed(2),
        data.avgHeartRate ?? null, data.maxHeartRate ?? null,
        caloriesBurned, data.perceivedDifficulty ?? null, data.notes ?? null,
        sessionId,
      ]
    );

    // XP: 50 base + 5 per 10min + 10 per km
    const totalXp = 50 + Math.floor(durationMinutes / 10) * 5 + Math.floor(distanceM / 1000) * 10;
    const today = todayStr();

    if (totalXp > 0) {
      await db.execute(
        `INSERT INTO xp_transactions (id, user_id, amount, reason, reference_type, reference_id, created_at)
         VALUES (?, ?, ?, 'cardio_completed', 'workout_session', ?, ?)`,
        [uuid(), userId, totalXp, sessionId, now]
      );

      const existing = await db.getOptional<{ id: string }>(
        `SELECT id FROM user_gamification WHERE user_id = ?`,
        [userId]
      );

      if (existing) {
        await db.execute(
          `UPDATE user_gamification SET total_xp = total_xp + ?, last_activity_date = ?, updated_at = ? WHERE user_id = ?`,
          [totalXp, today, now, userId]
        );
      } else {
        await db.execute(
          `INSERT INTO user_gamification (id, user_id, total_xp, current_level, xp_to_next_level, current_streak, longest_streak, streak_freeze_available, last_activity_date, avatar_stage, created_at, updated_at)
           VALUES (?, ?, ?, 1, 100, 0, 0, 1, ?, 1, ?, ?)`,
          [uuid(), userId, totalXp, today, now, now]
        );
      }

      await updateStreakLocal();
    }

    return {
      xpEarned: totalXp,
      duration: durationMinutes,
      distanceMeters: distanceM,
      avgPaceSecondsPerKm: pace,
      caloriesBurned,
    };
  }

  return {
    startWorkoutSession,
    addSet,
    updateSet,
    updateSetRestTaken,
    updateSetNotes,
    upsertExerciseNote,
    updateSessionNotes,
    deleteSet,
    endWorkoutSession,
    deleteSession,
    deleteTemplate,
    swapTemplateExercise,
    startCardioSession,
    addCardioInterval,
    endCardioSession,
  };
}
