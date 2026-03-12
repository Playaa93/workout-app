import { usePowerSync } from '@powersync/react';
import { useUserId } from '../auth-context';
import { uuid, nowISO, todayStr } from '../helpers';
import { calculateLevel } from '@/lib/xp-utils';

export function useProfileMutations() {
  const db = usePowerSync();
  const userId = useUserId();

  async function getOrCreateGamification() {
    let row = await db.getOptional<{
      id: string;
      total_xp: number;
      current_streak: number;
      longest_streak: number;
      last_activity_date: string | null;
      avatar_stage: number;
    }>(
      `SELECT * FROM user_gamification WHERE user_id = ?`,
      [userId]
    );

    if (!row) {
      const id = uuid();
      const now = nowISO();
      await db.execute(
        `INSERT INTO user_gamification (id, user_id, total_xp, current_level, xp_to_next_level, current_streak, longest_streak, streak_freeze_available, avatar_stage, created_at, updated_at)
         VALUES (?, ?, 0, 1, 100, 0, 0, 1, 1, ?, ?)`,
        [id, userId, now, now]
      );
      row = await db.getOptional(
        `SELECT * FROM user_gamification WHERE user_id = ?`,
        [userId]
      );
    }

    return row!;
  }

  async function awardXp(
    reason: string,
    amount: number,
    referenceType?: string,
    referenceId?: string
  ): Promise<{ newTotal: number; leveledUp: boolean; newLevel: number }> {
    const gamification = await getOrCreateGamification();
    const oldLevel = calculateLevel(gamification.total_xp || 0).level;
    const newTotal = (gamification.total_xp || 0) + amount;
    const newLevelInfo = calculateLevel(newTotal);
    const now = nowISO();

    await db.execute(
      `INSERT INTO xp_transactions (id, user_id, amount, reason, reference_type, reference_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuid(), userId, amount, reason, referenceType ?? null, referenceId ?? null, now]
    );

    await db.execute(
      `UPDATE user_gamification SET total_xp = ?, current_level = ?, xp_to_next_level = ?, updated_at = ? WHERE user_id = ?`,
      [newTotal, newLevelInfo.level, newLevelInfo.xpToNext, now, userId]
    );

    return {
      newTotal,
      leveledUp: newLevelInfo.level > oldLevel,
      newLevel: newLevelInfo.level,
    };
  }

  async function updateStreak(): Promise<{ currentStreak: number; isNewRecord: boolean }> {
    const gamification = await getOrCreateGamification();
    const today = todayStr();
    const lastActivity = gamification.last_activity_date;

    let newStreak = gamification.current_streak || 0;
    let isNewRecord = false;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActivity);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, no change
      } else if (diffDays === 1) {
        newStreak++;
      } else {
        newStreak = 1;
      }
    }

    const newLongest = Math.max(newStreak, gamification.longest_streak || 0);
    isNewRecord = newLongest > (gamification.longest_streak || 0);
    const now = nowISO();

    await db.execute(
      `UPDATE user_gamification SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = ? WHERE user_id = ?`,
      [newStreak, newLongest, today, now, userId]
    );

    return { currentStreak: newStreak, isNewRecord };
  }

  async function unlockAchievement(achievementId: string): Promise<void> {
    const now = nowISO();
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM user_achievements WHERE user_id = ? AND achievement_id = ?`,
      [userId, achievementId]
    );
    if (existing) return;

    await db.execute(
      `INSERT INTO user_achievements (id, user_id, achievement_id, unlocked_at)
       VALUES (?, ?, ?, ?)`,
      [uuid(), userId, achievementId, now]
    );
  }

  async function saveUserSettings(data: {
    language?: string;
    theme?: string;
    notificationsEnabled?: boolean;
    unitSystem?: string;
  }): Promise<void> {
    const now = nowISO();
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM user_settings WHERE user_id = ?`,
      [userId]
    );

    if (existing) {
      const sets: string[] = [];
      const vals: unknown[] = [];
      if (data.language !== undefined) { sets.push('language = ?'); vals.push(data.language); }
      if (data.theme !== undefined) { sets.push('theme = ?'); vals.push(data.theme); }
      if (data.notificationsEnabled !== undefined) { sets.push('notifications_enabled = ?'); vals.push(data.notificationsEnabled ? 1 : 0); }
      if (data.unitSystem !== undefined) { sets.push('unit_system = ?'); vals.push(data.unitSystem); }
      sets.push('updated_at = ?'); vals.push(now);
      vals.push(userId);

      await db.execute(
        `UPDATE user_settings SET ${sets.join(', ')} WHERE user_id = ?`,
        vals
      );
    } else {
      await db.execute(
        `INSERT INTO user_settings (id, user_id, language, theme, notifications_enabled, unit_system, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(), userId,
          data.language ?? 'fr',
          data.theme ?? 'system',
          data.notificationsEnabled !== undefined ? (data.notificationsEnabled ? 1 : 0) : 1,
          data.unitSystem ?? 'metric',
          now, now,
        ]
      );
    }
  }

  return {
    getOrCreateGamification,
    awardXp,
    updateStreak,
    unlockAchievement,
    saveUserSettings,
  };
}
