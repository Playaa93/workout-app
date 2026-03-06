'use server';

import { db, foods, foodCravings, foodEntries, nutritionDailySummary, nutritionProfiles, userGamification, xpTransactions } from '@/db';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';
import { getLocalDateStr } from '@/lib/date-utils';
import { updateStreak } from '@/app/profile/actions';

// XP rewards for diet actions
const XP_REWARDS = {
  FOOD_ENTRY: 5,      // Log a food entry
  CRAVING_LOGGED: 10, // Log a craving ("J'ai envie de...")
  FIRST_ENTRY_OF_DAY: 15, // First entry of the day bonus
  DAILY_CAP: 50,      // Max XP from diet per day
};

export type FoodData = {
  id: string;
  nameFr: string;
  nameEn: string | null;
  brand: string | null;
  calories: string | null;
  protein: string | null;
  carbohydrates: string | null;
  fat: string | null;
  servingSize: string | null;
};

export type CravingData = {
  id: string;
  nameFr: string;
  icon: string | null;
  estimatedCalories: number | null;
  category: string | null;
};

export type FoodEntryData = {
  id: string;
  foodId: string | null;
  cravingId: string | null;
  customName: string | null;
  loggedAt: Date;
  mealType: string | null;
  quantity: string;
  calories: string | null;
  protein: string | null;
  carbohydrates: string | null;
  fat: string | null;
  isCheat: boolean | null;
  notes: string | null;
};

export type DailySummaryData = {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entriesCount: number;
};

// Get diet XP earned today
async function getDietXpToday(userId: string, todayStr?: string): Promise<number> {
  todayStr = todayStr ?? getLocalDateStr();
  const todayStart = new Date(todayStr + 'T00:00:00');
  const todayEnd = new Date(todayStr + 'T23:59:59');
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${xpTransactions.amount}), 0)` })
    .from(xpTransactions)
    .where(and(
      eq(xpTransactions.userId, userId),
      eq(xpTransactions.referenceType, 'food_entry'),
      gte(xpTransactions.createdAt, todayStart),
      lte(xpTransactions.createdAt, todayEnd),
    ));
  return Number(result[0]?.total ?? 0);
}

// Award XP for diet actions (respects daily cap)
async function awardDietXp(userId: string, amount: number, reason: string, referenceId?: string) {
  // Check daily cap
  const today = getLocalDateStr();
  const earnedToday = await getDietXpToday(userId, today);
  const remaining = Math.max(0, XP_REWARDS.DAILY_CAP - earnedToday);
  const actualAmount = Math.min(amount, remaining);
  if (actualAmount <= 0) return;

  // Add XP transaction
  await db.insert(xpTransactions).values({
    userId,
    amount: actualAmount,
    reason,
    referenceType: 'food_entry',
    referenceId,
  });

  // Update user gamification
  await db
    .insert(userGamification)
    .values({
      userId,
      totalXp: actualAmount,
      lastActivityDate: today,
      currentStreak: 1,
    })
    .onConflictDoUpdate({
      target: userGamification.userId,
      set: {
        totalXp: sql`${userGamification.totalXp} + ${actualAmount}`,
        lastActivityDate: today,
        updatedAt: new Date(),
      },
    });

  await updateStreak(userId);
}

// Check if this is the first entry of the day
async function isFirstEntryOfDay(userId: string): Promise<boolean> {
  const todayStr = getLocalDateStr();
  const todayStart = new Date(todayStr + 'T00:00:00');
  const todayEnd = new Date(todayStr + 'T23:59:59.999');

  const [existing] = await db
    .select({ count: sql<number>`count(*)` })
    .from(foodEntries)
    .where(
      and(
        eq(foodEntries.userId, userId),
        gte(foodEntries.loggedAt, todayStart),
        lte(foodEntries.loggedAt, todayEnd)
      )
    );

  return existing.count === 0;
}

// Get all cravings ("J'ai envie de...")
export async function getCravings(): Promise<CravingData[]> {
  const result = await db
    .select()
    .from(foodCravings)
    .where(eq(foodCravings.isActive, true))
    .orderBy(foodCravings.category, foodCravings.nameFr);

  return result;
}

// Search foods
export async function searchFoods(query: string, limit = 20): Promise<FoodData[]> {
  if (!query || query.length < 2) return [];

  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  if (words.length === 0) return [];

  // Chaque mot doit être présent dans le nom OU la marque (AND entre mots)
  const conditions = words.map(w =>
    sql`(LOWER(${foods.nameFr}) LIKE ${`%${w}%`} OR LOWER(COALESCE(${foods.brand}, '')) LIKE ${`%${w}%`})`
  );
  const firstWord = words[0];

  const result = await db
    .select({
      id: foods.id,
      nameFr: foods.nameFr,
      nameEn: foods.nameEn,
      brand: foods.brand,
      calories: foods.calories,
      protein: foods.protein,
      carbohydrates: foods.carbohydrates,
      fat: foods.fat,
      servingSize: foods.servingSize,
    })
    .from(foods)
    .where(and(...conditions))
    .orderBy(
      sql`CASE
        WHEN LOWER(${foods.nameFr}) LIKE ${`${firstWord}%`} THEN 0
        WHEN LOWER(${foods.nameFr}) LIKE ${`% ${firstWord}%`} THEN 1
        ELSE 2
      END`,
      sql`LENGTH(${foods.nameFr})`,
    )
    .limit(limit);

  return result;
}

// Get today's entries
export async function getTodayEntries(): Promise<FoodEntryData[]> {
  const userId = await requireUserId();
  const todayStr = getLocalDateStr();
  const today = new Date(todayStr + 'T00:00:00');
  const tomorrow = new Date(todayStr + 'T23:59:59.999');

  const result = await db
    .select()
    .from(foodEntries)
    .where(
      and(
        eq(foodEntries.userId, userId),
        gte(foodEntries.loggedAt, today),
        lte(foodEntries.loggedAt, tomorrow)
      )
    )
    .orderBy(desc(foodEntries.loggedAt));

  return result.map((e) => ({
    ...e,
    loggedAt: e.loggedAt!,
  }));
}

// Add food entry from craving
export async function addCravingEntry(cravingId: string, notes?: string, mealType: string = 'snack'): Promise<{ id: string; xpEarned: number }> {
  const userId = await requireUserId();

  // Check if first entry of day (before inserting)
  const firstOfDay = await isFirstEntryOfDay(userId);

  // Get craving details
  const [craving] = await db
    .select()
    .from(foodCravings)
    .where(eq(foodCravings.id, cravingId));

  if (!craving) throw new Error('Craving not found');

  const [entry] = await db
    .insert(foodEntries)
    .values({
      userId: userId,
      cravingId,
      customName: craving.nameFr,
      loggedAt: new Date(),
      mealType,
      quantity: '1',
      calories: craving.estimatedCalories?.toString(),
      isCheat: true, // Cravings are considered "cheats" but that's OK!
      notes,
    })
    .returning();

  // Update daily summary
  await updateDailySummary(userId);

  // Award XP - extra for craving log (honesty bonus)
  let xpEarned = XP_REWARDS.CRAVING_LOGGED;
  if (firstOfDay) xpEarned += XP_REWARDS.FIRST_ENTRY_OF_DAY;
  await awardDietXp(userId, xpEarned, 'Craving loggé 🎭', entry.id);

  return { id: entry.id, xpEarned };
}

// Add food entry manually
export async function addFoodEntry(data: {
  foodId?: string;
  customName?: string;
  mealType: string;
  quantity: number;
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  notes?: string;
}): Promise<{ id: string; xpEarned: number }> {
  if (!data.quantity || data.quantity <= 0) throw new Error('La quantité doit être supérieure à 0');

  const userId = await requireUserId();

  // Check if first entry of day (before inserting)
  const firstOfDay = await isFirstEntryOfDay(userId);

  // If foodId provided, get food details
  let foodData: FoodData | null = null;
  if (data.foodId) {
    const [food] = await db
      .select({
        id: foods.id,
        nameFr: foods.nameFr,
        nameEn: foods.nameEn,
        brand: foods.brand,
        calories: foods.calories,
        protein: foods.protein,
        carbohydrates: foods.carbohydrates,
        fat: foods.fat,
        servingSize: foods.servingSize,
      })
      .from(foods)
      .where(eq(foods.id, data.foodId));
    foodData = food;
  }

  // Calculate macros based on quantity (assuming per 100g)
  const multiplier = data.quantity / 100;
  const calories = data.calories ?? (foodData?.calories ? parseFloat(foodData.calories) * multiplier : undefined);
  const protein = data.protein ?? (foodData?.protein ? parseFloat(foodData.protein) * multiplier : undefined);
  const carbs = data.carbohydrates ?? (foodData?.carbohydrates ? parseFloat(foodData.carbohydrates) * multiplier : undefined);
  const fat = data.fat ?? (foodData?.fat ? parseFloat(foodData.fat) * multiplier : undefined);

  const [entry] = await db
    .insert(foodEntries)
    .values({
      userId: userId,
      foodId: data.foodId,
      customName: data.customName || foodData?.nameFr,
      loggedAt: new Date(),
      mealType: data.mealType,
      quantity: data.quantity.toString(),
      calories: calories?.toString(),
      protein: protein?.toString(),
      carbohydrates: carbs?.toString(),
      fat: fat?.toString(),
      notes: data.notes,
    })
    .returning();

  // Update daily summary
  await updateDailySummary(userId);

  // Award XP
  let xpEarned = XP_REWARDS.FOOD_ENTRY;
  if (firstOfDay) xpEarned += XP_REWARDS.FIRST_ENTRY_OF_DAY;
  await awardDietXp(userId, xpEarned, 'Repas loggé 🍎', entry.id);

  return { id: entry.id, xpEarned };
}

// Add quick entry (just name and estimated calories)
export async function addQuickEntry(
  name: string,
  estimatedCalories: number,
  mealType: string = 'snack'
): Promise<{ id: string; xpEarned: number }> {
  const userId = await requireUserId();

  // Check if first entry of day (before inserting)
  const firstOfDay = await isFirstEntryOfDay(userId);

  const [entry] = await db
    .insert(foodEntries)
    .values({
      userId: userId,
      customName: name,
      loggedAt: new Date(),
      mealType,
      quantity: '1',
      calories: estimatedCalories.toString(),
    })
    .returning();

  await updateDailySummary(userId);

  // Award XP
  let xpEarned = XP_REWARDS.FOOD_ENTRY;
  if (firstOfDay) xpEarned += XP_REWARDS.FIRST_ENTRY_OF_DAY;
  await awardDietXp(userId, xpEarned, 'Entrée rapide 📝', entry.id);

  return { id: entry.id, xpEarned };
}

// Delete entry
export async function deleteEntry(entryId: string): Promise<void> {
  const userId = await requireUserId();
  await db.delete(foodEntries).where(eq(foodEntries.id, entryId));
  await updateDailySummary(userId);
}

// Update daily summary
async function updateDailySummary(userId: string): Promise<void> {
  const todayStr = getLocalDateStr();
  const today = new Date(todayStr + 'T00:00:00');
  const tomorrow = new Date(todayStr + 'T23:59:59.999');

  // Calculate 7-day averages date range
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = getLocalDateStr(sevenDaysAgo);

  // Get today's totals via SQL SUM + week summaries in parallel
  const [[todayTotals], weekSummaries] = await Promise.all([
    db.select({
      totalCalories: sql<string>`COALESCE(SUM(${foodEntries.calories}::numeric), 0)`,
      totalProtein: sql<string>`COALESCE(SUM(${foodEntries.protein}::numeric), 0)`,
      totalCarbs: sql<string>`COALESCE(SUM(${foodEntries.carbohydrates}::numeric), 0)`,
      totalFat: sql<string>`COALESCE(SUM(${foodEntries.fat}::numeric), 0)`,
      entriesCount: sql<number>`count(*)`,
    }).from(foodEntries).where(
      and(
        eq(foodEntries.userId, userId),
        gte(foodEntries.loggedAt, today),
        lte(foodEntries.loggedAt, tomorrow)
      )
    ),
    db.select().from(nutritionDailySummary).where(
      and(
        eq(nutritionDailySummary.userId, userId),
        gte(nutritionDailySummary.date, sevenDaysAgoStr)
      )
    ),
  ]);

  const totalCalories = parseFloat(todayTotals.totalCalories);
  const totalProtein = parseFloat(todayTotals.totalProtein);
  const totalCarbs = parseFloat(todayTotals.totalCarbs);
  const totalFat = parseFloat(todayTotals.totalFat);
  const entriesCount = todayTotals.entriesCount;

  const daysWithData = weekSummaries.length + 1; // +1 for today
  const avgCalories =
    (weekSummaries.reduce((sum, s) => sum + parseFloat(s.totalCalories || '0'), 0) + totalCalories) /
    daysWithData;
  const avgProtein =
    (weekSummaries.reduce((sum, s) => sum + parseFloat(s.totalProtein || '0'), 0) + totalProtein) /
    daysWithData;
  const avgCarbs =
    (weekSummaries.reduce((sum, s) => sum + parseFloat(s.totalCarbs || '0'), 0) + totalCarbs) /
    daysWithData;
  const avgFat =
    (weekSummaries.reduce((sum, s) => sum + parseFloat(s.totalFat || '0'), 0) + totalFat) /
    daysWithData;

  // Upsert daily summary
  await db
    .insert(nutritionDailySummary)
    .values({
      userId,
      date: todayStr,
      totalCalories: totalCalories.toString(),
      totalProtein: totalProtein.toString(),
      totalCarbs: totalCarbs.toString(),
      totalFat: totalFat.toString(),
      avg7dCalories: avgCalories.toString(),
      avg7dProtein: avgProtein.toString(),
      avg7dCarbs: avgCarbs.toString(),
      avg7dFat: avgFat.toString(),
      entriesCount,
    })
    .onConflictDoUpdate({
      target: [nutritionDailySummary.userId, nutritionDailySummary.date],
      set: {
        totalCalories: totalCalories.toString(),
        totalProtein: totalProtein.toString(),
        totalCarbs: totalCarbs.toString(),
        totalFat: totalFat.toString(),
        avg7dCalories: avgCalories.toString(),
        avg7dProtein: avgProtein.toString(),
        avg7dCarbs: avgCarbs.toString(),
        avg7dFat: avgFat.toString(),
        entriesCount,
      },
    });
}

// Get daily summary with 7-day average
export async function getDailySummary(): Promise<{
  today: DailySummaryData;
  avg7d: DailySummaryData;
} | null> {
  const userId = await requireUserId();
  const todayStr = getLocalDateStr();

  const [summary] = await db
    .select()
    .from(nutritionDailySummary)
    .where(
      and(eq(nutritionDailySummary.userId, userId), eq(nutritionDailySummary.date, todayStr))
    );

  if (!summary) {
    return {
      today: {
        date: todayStr,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        entriesCount: 0,
      },
      avg7d: {
        date: todayStr,
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        entriesCount: 0,
      },
    };
  }

  return {
    today: {
      date: summary.date,
      totalCalories: parseFloat(summary.totalCalories || '0'),
      totalProtein: parseFloat(summary.totalProtein || '0'),
      totalCarbs: parseFloat(summary.totalCarbs || '0'),
      totalFat: parseFloat(summary.totalFat || '0'),
      entriesCount: summary.entriesCount || 0,
    },
    avg7d: {
      date: summary.date,
      totalCalories: parseFloat(summary.avg7dCalories || '0'),
      totalProtein: parseFloat(summary.avg7dProtein || '0'),
      totalCarbs: parseFloat(summary.avg7dCarbs || '0'),
      totalFat: parseFloat(summary.avg7dFat || '0'),
      entriesCount: 0,
    },
  };
}

// Get week history for chart
export async function getWeekHistory(): Promise<DailySummaryData[]> {
  const userId = await requireUserId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const summaries = await db
    .select()
    .from(nutritionDailySummary)
    .where(
      and(
        eq(nutritionDailySummary.userId, userId),
        gte(nutritionDailySummary.date, getLocalDateStr(sevenDaysAgo))
      )
    )
    .orderBy(nutritionDailySummary.date);

  return summaries.map((s) => ({
    date: s.date,
    totalCalories: parseFloat(s.totalCalories || '0'),
    totalProtein: parseFloat(s.totalProtein || '0'),
    totalCarbs: parseFloat(s.totalCarbs || '0'),
    totalFat: parseFloat(s.totalFat || '0'),
    entriesCount: s.entriesCount || 0,
  }));
}

// =====================================================
// NUTRITION PROFILE (Goals Configuration)
// =====================================================

export type NutritionGoal = 'bulk' | 'maintain' | 'cut';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export type NutritionProfileData = {
  goal: NutritionGoal;
  activityLevel: ActivityLevel;
  height: number | null;
  weight: number | null;
  age: number | null;
  isMale: boolean;
  tdee: number | null;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
};

// Activity level multipliers for TDEE calculation (Harris-Benedict)
const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Goal calorie adjustments
const GOAL_ADJUSTMENTS: Record<NutritionGoal, number> = {
  bulk: 300,    // +300 kcal surplus
  maintain: 0,
  cut: -400,    // -400 kcal deficit (moderate, sustainable)
};

// Calculate TDEE and macros
function calculateNutritionTargets(
  weight: number,
  height: number,
  age: number,
  isMale: boolean,
  activityLevel: ActivityLevel,
  goal: NutritionGoal
): { tdee: number; targetCalories: number; targetProtein: number; targetCarbs: number; targetFat: number } {
  // Mifflin-St Jeor Equation (more accurate than Harris-Benedict)
  let bmr: number;
  if (isMale) {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  const targetCalories = Math.round(tdee + GOAL_ADJUSTMENTS[goal]);

  // Macro distribution based on goal
  let proteinRatio: number;
  let fatRatio: number;

  if (goal === 'bulk') {
    proteinRatio = 2.0; // 2g/kg for muscle building
    fatRatio = 0.25;    // 25% from fat
  } else if (goal === 'cut') {
    proteinRatio = 2.2; // Higher protein to preserve muscle
    fatRatio = 0.25;
  } else {
    proteinRatio = 1.8; // Moderate protein
    fatRatio = 0.28;
  }

  const targetProtein = Math.round(weight * proteinRatio);
  const targetFat = Math.round((targetCalories * fatRatio) / 9);
  // Remaining calories from carbs
  const carbCalories = targetCalories - (targetProtein * 4) - (targetFat * 9);
  const targetCarbs = Math.max(0, Math.round(carbCalories / 4));

  return { tdee, targetCalories, targetProtein, targetCarbs, targetFat };
}

// Get nutrition profile
export async function getNutritionProfile(): Promise<NutritionProfileData | null> {
  try {
    const userId = await requireUserId();

    const [profile] = await db
      .select()
      .from(nutritionProfiles)
      .where(eq(nutritionProfiles.userId, userId));

    if (!profile) {
      return null;
    }

    return {
      goal: profile.goal as NutritionGoal,
      activityLevel: profile.activityLevel as ActivityLevel,
      height: profile.height ? parseFloat(profile.height) : null,
      weight: profile.weight ? parseFloat(profile.weight) : null,
      age: profile.age,
      isMale: profile.isMale ?? true,
      tdee: profile.tdee,
      targetCalories: profile.targetCalories,
      targetProtein: profile.targetProtein,
      targetCarbs: profile.targetCarbs,
      targetFat: profile.targetFat,
    };
  } catch (error) {
    // Table might not exist yet - return null gracefully
    console.error('Error fetching nutrition profile:', error);
    return null;
  }
}

// Save nutrition profile
export async function saveNutritionProfile(data: {
  goal: NutritionGoal;
  activityLevel: ActivityLevel;
  height: number;
  weight: number;
  age: number;
  isMale: boolean;
}): Promise<NutritionProfileData> {
  const userId = await requireUserId();

  // Calculate targets
  const targets = calculateNutritionTargets(
    data.weight,
    data.height,
    data.age,
    data.isMale,
    data.activityLevel,
    data.goal
  );

  const profileData = {
    userId: userId,
    goal: data.goal,
    activityLevel: data.activityLevel,
    height: data.height.toString(),
    weight: data.weight.toString(),
    age: data.age,
    isMale: data.isMale,
    tdee: targets.tdee,
    targetCalories: targets.targetCalories,
    targetProtein: targets.targetProtein,
    targetCarbs: targets.targetCarbs,
    targetFat: targets.targetFat,
    updatedAt: new Date(),
  };

  // Upsert profile
  await db
    .insert(nutritionProfiles)
    .values(profileData)
    .onConflictDoUpdate({
      target: nutritionProfiles.userId,
      set: {
        goal: profileData.goal,
        activityLevel: profileData.activityLevel,
        height: profileData.height,
        weight: profileData.weight,
        age: profileData.age,
        isMale: profileData.isMale,
        tdee: profileData.tdee,
        targetCalories: profileData.targetCalories,
        targetProtein: profileData.targetProtein,
        targetCarbs: profileData.targetCarbs,
        targetFat: profileData.targetFat,
        updatedAt: profileData.updatedAt,
      },
    });

  return {
    goal: data.goal,
    activityLevel: data.activityLevel,
    height: data.height,
    weight: data.weight,
    age: data.age,
    isMale: data.isMale,
    ...targets,
  };
}

// =====================================================
// OPEN FOOD FACTS shared helpers
// =====================================================

function nutrientStr(value: unknown): string | null {
  return value != null ? String(value) : null;
}

function mapOFFProduct(product: Record<string, unknown>): {
  nameFr: string; nameEn: string | null; brand: string | null;
  calories: string | null; protein: string | null; carbohydrates: string | null; fat: string | null;
} | null {
  const nameFr = (product.product_name_fr || product.product_name || product.generic_name_fr) as string | undefined;
  if (!nameFr) return null;
  const n = (product.nutriments || {}) as Record<string, unknown>;
  if (n['energy-kcal_100g'] == null) return null;
  const rawBrands = product.brands;
  const brand = Array.isArray(rawBrands) ? rawBrands[0] || null : (rawBrands as string) || null;
  return {
    nameFr,
    nameEn: (product.product_name_en as string) || null,
    brand,
    calories: nutrientStr(n['energy-kcal_100g']),
    protein: nutrientStr(n.proteins_100g),
    carbohydrates: nutrientStr(n.carbohydrates_100g),
    fat: nutrientStr(n.fat_100g),
  };
}

// =====================================================
// OPEN FOOD FACTS SEARCH (text search fallback)
// =====================================================

export async function searchOpenFoodFacts(query: string, limit = 20): Promise<FoodData[]> {
  if (!query || query.length < 2) return [];

  try {
    const params = new URLSearchParams({
      q: query,
      page_size: String(limit),
      fields: 'code,product_name_fr,product_name,brands,nutriments',
    });

    const response = await fetch(
      `https://search.openfoodfacts.org/search?${params}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) return [];
    const data = await response.json();
    if (!data.hits?.length) return [];

    const results: FoodData[] = [];
    for (const p of data.hits) {
      const mapped = mapOFFProduct(p);
      if (!mapped) continue;
      results.push({
        id: `off:${p.code || mapped.nameFr}`,
        ...mapped,
        servingSize: null,
      });
    }

    return results;
  } catch {
    return [];
  }
}

// Save an Open Food Facts product to the local DB (cache on select)
export async function cacheOpenFoodFactsProduct(product: FoodData): Promise<FoodData> {
  // Check if already cached (by name + brand combo)
  const existing = await db
    .select({ id: foods.id })
    .from(foods)
    .where(
      and(
        eq(foods.nameFr, product.nameFr),
        product.brand ? eq(foods.brand, product.brand) : sql`${foods.brand} IS NULL`
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { ...product, id: existing[0].id };
  }

  const [saved] = await db
    .insert(foods)
    .values({
      nameFr: product.nameFr,
      nameEn: product.nameEn,
      brand: product.brand,
      calories: product.calories,
      protein: product.protein,
      carbohydrates: product.carbohydrates,
      fat: product.fat,
      verified: true,
    })
    .returning();

  return { ...product, id: saved.id };
}

// =====================================================
// BARCODE LOOKUP (Open Food Facts)
// =====================================================

export async function lookupBarcode(barcode: string): Promise<FoodData | null> {
  // First, check local database
  const [localFood] = await db
    .select({
      id: foods.id,
      nameFr: foods.nameFr,
      nameEn: foods.nameEn,
      brand: foods.brand,
      calories: foods.calories,
      protein: foods.protein,
      carbohydrates: foods.carbohydrates,
      fat: foods.fat,
      servingSize: foods.servingSize,
    })
    .from(foods)
    .where(eq(foods.barcode, barcode));

  if (localFood) return localFood;

  // Fetch from Open Food Facts
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) return null;
    const data = await response.json();

    if (data.status !== 1 || !data.product) return null;

    const mapped = mapOFFProduct(data.product);
    const nameFr = mapped?.nameFr || 'Produit scanné';

    const [saved] = await db
      .insert(foods)
      .values({
        nameFr,
        nameEn: mapped?.nameEn ?? null,
        brand: mapped?.brand ?? null,
        barcode,
        calories: mapped?.calories ?? null,
        protein: mapped?.protein ?? null,
        carbohydrates: mapped?.carbohydrates ?? null,
        fat: mapped?.fat ?? null,
      })
      .returning();

    return {
      id: saved.id,
      nameFr: saved.nameFr,
      nameEn: saved.nameEn,
      brand: saved.brand,
      calories: saved.calories,
      protein: saved.protein,
      carbohydrates: saved.carbohydrates,
      fat: saved.fat,
      servingSize: saved.servingSize,
    };
  } catch {
    return null;
  }
}

// =====================================================
// RECENT FOODS
// =====================================================

export async function getRecentFoods(limit: number = 10): Promise<FoodEntryData[]> {
  const userId = await requireUserId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const entries = await db
    .select()
    .from(foodEntries)
    .where(
      and(
        eq(foodEntries.userId, userId),
        gte(foodEntries.loggedAt, sevenDaysAgo)
      )
    )
    .orderBy(desc(foodEntries.loggedAt))
    .limit(50);

  // Deduplicate by customName/foodId
  const seen = new Set<string>();
  const unique: FoodEntryData[] = [];

  for (const e of entries) {
    const key = e.foodId || e.customName || e.id;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      ...e,
      loggedAt: e.loggedAt!,
    });
    if (unique.length >= limit) break;
  }

  return unique;
}

// =====================================================
// AI FOOD ENTRY
// =====================================================

export async function addAIFoodEntry(data: {
  customName: string;
  mealType: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  photoUrl?: string;
  aiConfidence: number;
}): Promise<{ id: string; xpEarned: number }> {
  const userId = await requireUserId();

  const firstOfDay = await isFirstEntryOfDay(userId);

  const [entry] = await db
    .insert(foodEntries)
    .values({
      userId,
      customName: data.customName,
      loggedAt: new Date(),
      mealType: data.mealType,
      quantity: '1',
      calories: data.calories.toString(),
      protein: data.protein.toString(),
      carbohydrates: data.carbohydrates.toString(),
      fat: data.fat.toString(),
      photoUrl: data.photoUrl,
      recognizedByAi: true,
      aiConfidence: data.aiConfidence.toString(),
    })
    .returning();

  await updateDailySummary(userId);

  let xpEarned = XP_REWARDS.FOOD_ENTRY;
  if (firstOfDay) xpEarned += XP_REWARDS.FIRST_ENTRY_OF_DAY;
  await awardDietXp(userId, xpEarned, 'Photo IA 📸', entry.id);

  return { id: entry.id, xpEarned };
}
