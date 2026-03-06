import { useQuery } from '@powersync/react';
import { useUserId } from '../auth-context';
import type { Database } from '../schema';

export type UserRow = Database['users'];
export type GamificationRow = Database['user_gamification'];
export type AchievementRow = Database['achievements'];
export type UserAchievementRow = Database['user_achievements'];
export type XpTransactionRow = Database['xp_transactions'];
export type UserSettingsRow = Database['user_settings'];

export function useUserProfile() {
  const userId = useUserId();
  return useQuery<UserRow>(
    `SELECT * FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
}

export function useGamification() {
  const userId = useUserId();
  return useQuery<GamificationRow>(
    `SELECT * FROM user_gamification WHERE user_id = ? LIMIT 1`,
    [userId]
  );
}

export function useAchievementsWithStatus() {
  const userId = useUserId();
  return useQuery<AchievementRow & { unlocked_at: string | null }>(
    `SELECT a.*, ua.unlocked_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ?
     ORDER BY a.category, a.xp_reward`,
    [userId]
  );
}

export function useRecentXp(limit = 10) {
  const userId = useUserId();
  return useQuery<XpTransactionRow>(
    `SELECT * FROM xp_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    [userId, limit]
  );
}

export function useUserStats() {
  const userId = useUserId();
  return useQuery<{
    total_workouts: number;
    total_food_entries: number;
    total_measurements: number;
    total_prs: number;
    boss_fights_won: number;
    total_cardio_sessions: number;
    total_cardio_distance_m: number;
    total_cardio_minutes: number;
  }>(
    `SELECT
      (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ? AND ended_at IS NOT NULL) as total_workouts,
      (SELECT COUNT(*) FROM food_entries WHERE user_id = ? AND CAST(calories AS REAL) > 0) as total_food_entries,
      (SELECT COUNT(*) FROM measurements WHERE user_id = ?) as total_measurements,
      (SELECT COUNT(*) FROM personal_records WHERE user_id = ?) as total_prs,
      (SELECT COUNT(*) FROM boss_fights WHERE user_id = ? AND status = 'completed') as boss_fights_won,
      (SELECT COUNT(*) FROM workout_sessions WHERE user_id = ? AND session_type = 'cardio' AND ended_at IS NOT NULL) as total_cardio_sessions,
      (SELECT COALESCE(SUM(CAST(distance_meters AS REAL)), 0) FROM workout_sessions WHERE user_id = ? AND session_type = 'cardio' AND ended_at IS NOT NULL) as total_cardio_distance_m,
      (SELECT COALESCE(SUM(duration_minutes), 0) FROM workout_sessions WHERE user_id = ? AND session_type = 'cardio' AND ended_at IS NOT NULL) as total_cardio_minutes`,
    [userId, userId, userId, userId, userId, userId, userId, userId]
  );
}

export function useWeeklyComparison(thisWeekStart: string, lastWeekStart: string) {
  const userId = useUserId();
  return useQuery<{
    week: string;
    sessions: number;
    volume_kg: number;
    duration_min: number;
    calories: number;
    pr_count: number;
  }>(
    `SELECT
      CASE WHEN started_at >= ? THEN 'this' ELSE 'last' END as week,
      COUNT(*) as sessions,
      COALESCE(SUM(CAST(total_volume AS REAL)), 0) as volume_kg,
      COALESCE(SUM(duration_minutes), 0) as duration_min,
      COALESCE(SUM(calories_burned), 0) as calories,
      (SELECT COUNT(*) FROM workout_sets ws
       INNER JOIN workout_sessions ws2 ON ws.session_id = ws2.id
       WHERE ws2.user_id = ? AND ws2.started_at >= CASE WHEN ws2.started_at >= ? THEN ? ELSE ? END
       AND ws2.started_at < CASE WHEN ws2.started_at >= ? THEN datetime('now') ELSE ? END
       AND ws2.ended_at IS NOT NULL AND ws.is_pr = 1) as pr_count
    FROM workout_sessions
    WHERE user_id = ? AND started_at >= ? AND ended_at IS NOT NULL
    GROUP BY week`,
    [thisWeekStart, userId, thisWeekStart, thisWeekStart, lastWeekStart, thisWeekStart, thisWeekStart, userId, lastWeekStart]
  );
}

export function useUserSettings() {
  const userId = useUserId();
  return useQuery<UserSettingsRow>(
    `SELECT * FROM user_settings WHERE user_id = ? LIMIT 1`,
    [userId]
  );
}
