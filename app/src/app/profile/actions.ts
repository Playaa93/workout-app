'use server';

import {
  db,
  users,
  userGamification,
  xpTransactions,
  achievements,
  userAchievements,
  workoutSessions,
  foodEntries,
  measurements,
  personalRecords,
  bossFights,
} from '@/db';
import { eq, desc, sql, and, count } from 'drizzle-orm';

// =====================================================
// TYPES
// =====================================================

export type UserProfileData = {
  id: string;
  displayName: string | null;
  email: string;
};

export type GamificationData = {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  xpProgress: number; // percentage to next level
  currentStreak: number;
  longestStreak: number;
  avatarStage: number;
};

export type AchievementData = {
  id: string;
  key: string;
  nameFr: string;
  descriptionFr: string | null;
  icon: string | null;
  xpReward: number;
  category: string | null;
  isSecret: boolean;
  unlockedAt: Date | null;
};

export type XpTransactionData = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
};

export type StatsData = {
  totalWorkouts: number;
  totalFoodEntries: number;
  totalMeasurements: number;
  totalPRs: number;
  bossFightsWon: number;
};

// =====================================================
// HELPERS
// =====================================================

// XP needed for each level (exponential growth)
function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function calculateLevel(totalXp: number): { level: number; xpInCurrentLevel: number; xpToNext: number } {
  let level = 1;
  let xpNeeded = getXpForLevel(level);
  let xpRemaining = totalXp;

  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    level++;
    xpNeeded = getXpForLevel(level);
  }

  return {
    level,
    xpInCurrentLevel: xpRemaining,
    xpToNext: xpNeeded,
  };
}

// Get or create user
async function getUser() {
  let user = await db.select().from(users).limit(1);
  if (user.length === 0) {
    const [newUser] = await db
      .insert(users)
      .values({ email: 'demo@workout.app', displayName: 'haze' })
      .returning();
    user = [newUser];
  }
  return user[0];
}

// Get or create gamification profile
async function getOrCreateGamification(userId: string) {
  let [gamification] = await db
    .select()
    .from(userGamification)
    .where(eq(userGamification.userId, userId));

  if (!gamification) {
    [gamification] = await db
      .insert(userGamification)
      .values({
        userId,
        totalXp: 0,
        currentLevel: 1,
        xpToNextLevel: 100,
        currentStreak: 0,
        longestStreak: 0,
        avatarStage: 1,
      })
      .returning();
  }

  return gamification;
}

// =====================================================
// PUBLIC ACTIONS
// =====================================================

// Get user profile
export async function getUserProfile(): Promise<UserProfileData> {
  const user = await getUser();
  return {
    id: user.id,
    displayName: user.displayName,
    email: user.email,
  };
}

// Get gamification data
export async function getGamificationData(): Promise<GamificationData> {
  const user = await getUser();
  const gamification = await getOrCreateGamification(user.id);

  const levelInfo = calculateLevel(gamification.totalXp || 0);
  const xpProgress = Math.round((levelInfo.xpInCurrentLevel / levelInfo.xpToNext) * 100);

  return {
    totalXp: gamification.totalXp || 0,
    currentLevel: levelInfo.level,
    xpToNextLevel: levelInfo.xpToNext,
    xpProgress,
    currentStreak: gamification.currentStreak || 0,
    longestStreak: gamification.longestStreak || 0,
    avatarStage: gamification.avatarStage || 1,
  };
}

// Get all achievements with unlock status
export async function getAchievements(): Promise<AchievementData[]> {
  const user = await getUser();

  const allAchievements = await db
    .select({
      id: achievements.id,
      key: achievements.key,
      nameFr: achievements.nameFr,
      descriptionFr: achievements.descriptionFr,
      icon: achievements.icon,
      xpReward: achievements.xpReward,
      category: achievements.category,
      isSecret: achievements.isSecret,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(achievements)
    .leftJoin(
      userAchievements,
      and(
        eq(userAchievements.achievementId, achievements.id),
        eq(userAchievements.userId, user.id)
      )
    )
    .orderBy(achievements.category, achievements.xpReward);

  return allAchievements.map((a) => ({
    ...a,
    xpReward: a.xpReward || 0,
    isSecret: a.isSecret || false,
  }));
}

// Get recent XP transactions
export async function getRecentXp(limit = 10): Promise<XpTransactionData[]> {
  const user = await getUser();

  const transactions = await db
    .select()
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, user.id))
    .orderBy(desc(xpTransactions.createdAt))
    .limit(limit);

  return transactions.map((t) => ({
    id: t.id,
    amount: t.amount,
    reason: t.reason,
    createdAt: t.createdAt!,
  }));
}

// Get user stats
export async function getUserStats(): Promise<StatsData> {
  const user = await getUser();

  const [workoutsResult] = await db
    .select({ count: count() })
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, user.id));

  const [foodResult] = await db
    .select({ count: count() })
    .from(foodEntries)
    .where(eq(foodEntries.userId, user.id));

  const [measurementsResult] = await db
    .select({ count: count() })
    .from(measurements)
    .where(eq(measurements.userId, user.id));

  const [prsResult] = await db
    .select({ count: count() })
    .from(personalRecords)
    .where(eq(personalRecords.userId, user.id));

  const [bossResult] = await db
    .select({ count: count() })
    .from(bossFights)
    .where(and(eq(bossFights.userId, user.id), eq(bossFights.status, 'completed')));

  return {
    totalWorkouts: workoutsResult.count,
    totalFoodEntries: foodResult.count,
    totalMeasurements: measurementsResult.count,
    totalPRs: prsResult.count,
    bossFightsWon: bossResult.count,
  };
}

// =====================================================
// XP & ACHIEVEMENT SYSTEM
// =====================================================

// Award XP to user
export async function awardXp(
  reason: string,
  amount: number,
  referenceType?: string,
  referenceId?: string
): Promise<{ newTotal: number; leveledUp: boolean; newLevel: number }> {
  const user = await getUser();
  const gamification = await getOrCreateGamification(user.id);

  const oldLevel = calculateLevel(gamification.totalXp || 0).level;
  const newTotal = (gamification.totalXp || 0) + amount;
  const newLevelInfo = calculateLevel(newTotal);

  // Record transaction
  await db.insert(xpTransactions).values({
    userId: user.id,
    amount,
    reason,
    referenceType,
    referenceId,
  });

  // Update gamification
  await db
    .update(userGamification)
    .set({
      totalXp: newTotal,
      currentLevel: newLevelInfo.level,
      xpToNextLevel: newLevelInfo.xpToNext,
      updatedAt: new Date(),
    })
    .where(eq(userGamification.userId, user.id));

  return {
    newTotal,
    leveledUp: newLevelInfo.level > oldLevel,
    newLevel: newLevelInfo.level,
  };
}

// Check and unlock achievements
export async function checkAchievements(): Promise<AchievementData[]> {
  const user = await getUser();
  const stats = await getUserStats();
  const gamification = await getOrCreateGamification(user.id);

  // Get all unearned achievements
  const unearnedAchievements = await db
    .select()
    .from(achievements)
    .where(
      sql`${achievements.id} NOT IN (
        SELECT achievement_id FROM user_achievements WHERE user_id = ${user.id}
      )`
    );

  const newlyUnlocked: AchievementData[] = [];

  for (const achievement of unearnedAchievements) {
    const requirement = achievement.requirement as { type: string; value: number } | null;
    if (!requirement) continue;

    let unlocked = false;

    switch (requirement.type) {
      case 'workout_count':
        unlocked = stats.totalWorkouts >= requirement.value;
        break;
      case 'food_entry_count':
        unlocked = stats.totalFoodEntries >= requirement.value;
        break;
      case 'measurement_count':
        unlocked = stats.totalMeasurements >= requirement.value;
        break;
      case 'pr_count':
        unlocked = stats.totalPRs >= requirement.value;
        break;
      case 'boss_fight_won':
        unlocked = stats.bossFightsWon >= requirement.value;
        break;
      case 'streak':
        unlocked = (gamification.currentStreak || 0) >= requirement.value;
        break;
      case 'cheat_logged':
        // Check if user has logged a cheat meal
        const [cheatEntry] = await db
          .select()
          .from(foodEntries)
          .where(and(eq(foodEntries.userId, user.id), eq(foodEntries.isCheat, true)))
          .limit(1);
        unlocked = !!cheatEntry;
        break;
    }

    if (unlocked) {
      // Unlock achievement
      await db.insert(userAchievements).values({
        userId: user.id,
        achievementId: achievement.id,
      });

      // Award XP
      if (achievement.xpReward) {
        await awardXp(`Achievement: ${achievement.nameFr}`, achievement.xpReward, 'achievement', achievement.id);
      }

      newlyUnlocked.push({
        id: achievement.id,
        key: achievement.key,
        nameFr: achievement.nameFr,
        descriptionFr: achievement.descriptionFr,
        icon: achievement.icon,
        xpReward: achievement.xpReward || 0,
        category: achievement.category,
        isSecret: achievement.isSecret || false,
        unlockedAt: new Date(),
      });
    }
  }

  return newlyUnlocked;
}

// Update streak
export async function updateStreak(): Promise<{ currentStreak: number; isNewRecord: boolean }> {
  const user = await getUser();
  const gamification = await getOrCreateGamification(user.id);

  const today = new Date().toISOString().split('T')[0];
  const lastActivity = gamification.lastActivityDate;

  let newStreak = gamification.currentStreak || 0;
  let isNewRecord = false;

  if (!lastActivity) {
    // First activity ever
    newStreak = 1;
  } else {
    const lastDate = new Date(lastActivity);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Same day, no change
    } else if (diffDays === 1) {
      // Consecutive day
      newStreak++;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const newLongest = Math.max(newStreak, gamification.longestStreak || 0);
  isNewRecord = newLongest > (gamification.longestStreak || 0);

  await db
    .update(userGamification)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActivityDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userGamification.userId, user.id));

  // Check for streak achievements
  await checkAchievements();

  return { currentStreak: newStreak, isNewRecord };
}

// Update avatar stage based on level
export async function updateAvatarStage(): Promise<number> {
  const user = await getUser();
  const gamification = await getOrCreateGamification(user.id);

  const level = calculateLevel(gamification.totalXp || 0).level;

  // Avatar evolves every 10 levels
  const newStage = Math.min(Math.floor(level / 10) + 1, 5);

  if (newStage !== gamification.avatarStage) {
    await db
      .update(userGamification)
      .set({ avatarStage: newStage, updatedAt: new Date() })
      .where(eq(userGamification.userId, user.id));
  }

  return newStage;
}
