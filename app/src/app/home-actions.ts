'use server';

import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { requireUserId } from '@/lib/auth';
import { getISOWeekStart } from '@/lib/date-utils';
import type { HomeSnapshot } from './home-snapshot';

export async function getHomeSnapshot(localDate: string): Promise<HomeSnapshot> {
  const userId = await requireUserId();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) throw new Error('Date invalide');
  const weekStart = getISOWeekStart(new Date()).toISOString();
  const result = await db.execute<{ snapshot: HomeSnapshot }>(sql`
    SELECT json_build_object(
      'displayName', u.display_name,
      'totalXp', coalesce(g.total_xp, 0), 'streak', coalesce(g.current_streak, 0),
      'totalWorkouts', workouts.total, 'weeklySessions', workouts.this_week,
      'totalPRs', (SELECT count(*) FROM personal_records WHERE user_id = u.id),
      'hasMorphoProfile', EXISTS(SELECT 1 FROM morpho_profiles WHERE user_id = u.id),
      'activeSession', (SELECT json_build_object('id', id, 'sessionType', session_type)
        FROM workout_sessions WHERE user_id = u.id AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1),
      'nutrition', (SELECT json_build_object('cal', round(coalesce(d.total_calories, 0)),
        'prot', round(coalesce(d.total_protein, 0)), 'carbs', round(coalesce(d.total_carbs, 0)),
        'fat', round(coalesce(d.total_fat, 0)), 'targetCal', coalesce(nullif(p.target_calories, 0), 2200),
        'targetProt', coalesce(nullif(p.target_protein, 0), 140))
        FROM nutrition_profiles p LEFT JOIN nutrition_daily_summary d ON d.user_id = p.user_id AND d.date = ${localDate}::date
        WHERE p.user_id = u.id),
      'recentSessions', coalesce((SELECT json_agg(recent ORDER BY recent."startedAt" DESC) FROM (
        SELECT s.id, s.started_at AS "startedAt", t.name AS "templateName", s.session_type AS "sessionType",
          s.cardio_activity AS "cardioActivity", ARRAY(SELECT DISTINCT e.muscle_group FROM workout_sets ws
            JOIN exercises e ON e.id = ws.exercise_id WHERE ws.session_id = s.id) AS "muscleGroups"
        FROM workout_sessions s LEFT JOIN workout_templates t ON t.id = s.template_id AND t.user_id = u.id
        WHERE s.user_id = u.id AND s.ended_at IS NOT NULL ORDER BY s.started_at DESC LIMIT 3
      ) recent), '[]'::json),
      'recentPRs', coalesce((SELECT json_agg(json_build_object('exerciseName', pr.name, 'value', pr.value) ORDER BY pr.achieved_at DESC) FROM (
        SELECT coalesce(e.name_fr, '—') AS name, coalesce(r.value, 0) AS value, r.achieved_at
        FROM personal_records r LEFT JOIN exercises e ON e.id = r.exercise_id
        WHERE r.user_id = u.id ORDER BY r.achieved_at DESC LIMIT 3
      ) pr), '[]'::json),
      'bodyEvolution', CASE WHEN latest.weight IS NOT NULL THEN json_build_object('weight', latest.weight,
        'bodyFat', latest.body_fat_percentage, 'weightDiff', latest.weight - first_measure.weight) END
    ) AS snapshot
    FROM users u LEFT JOIN user_gamification g ON g.user_id = u.id
    CROSS JOIN LATERAL (SELECT count(*) AS total, count(*) FILTER (WHERE started_at >= ${weekStart}::timestamptz) AS this_week
      FROM workout_sessions WHERE user_id = u.id AND ended_at IS NOT NULL) workouts
    LEFT JOIN LATERAL (SELECT weight, body_fat_percentage FROM measurements WHERE user_id = u.id ORDER BY measured_at DESC LIMIT 1) latest ON true
    LEFT JOIN LATERAL (SELECT weight FROM measurements WHERE user_id = u.id ORDER BY measured_at LIMIT 1) first_measure ON true
    WHERE u.id = ${userId}
  `);
  if (!result.rows[0]) throw new Error('Compte indisponible');
  return result.rows[0].snapshot;
}
