'use server';

import { db, foods, foodCravings, foodEntries, nutritionDailySummary, users } from '@/db';
import { eq, desc, sql, and, gte, lte } from 'drizzle-orm';

export type FoodData = {
  id: string;
  nameFr: string;
  nameEn: string | null;
  brand: string | null;
  calories: string | null;
  protein: string | null;
  carbohydrates: string | null;
  fat: string | null;
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
    })
    .from(foods)
    .where(sql`LOWER(${foods.nameFr}) LIKE ${`%${query.toLowerCase()}%`}`)
    .limit(limit);

  return result;
}

// Get today's entries
export async function getTodayEntries(): Promise<FoodEntryData[]> {
  const user = await getUser();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await db
    .select()
    .from(foodEntries)
    .where(
      and(
        eq(foodEntries.userId, user.id),
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
export async function addCravingEntry(cravingId: string, notes?: string): Promise<string> {
  const user = await getUser();

  // Get craving details
  const [craving] = await db
    .select()
    .from(foodCravings)
    .where(eq(foodCravings.id, cravingId));

  if (!craving) throw new Error('Craving not found');

  const [entry] = await db
    .insert(foodEntries)
    .values({
      userId: user.id,
      cravingId,
      customName: craving.nameFr,
      loggedAt: new Date(),
      mealType: 'snack',
      quantity: '1',
      calories: craving.estimatedCalories?.toString(),
      isCheat: true, // Cravings are considered "cheats" but that's OK!
      notes,
    })
    .returning();

  // Update daily summary
  await updateDailySummary(user.id);

  return entry.id;
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
}): Promise<string> {
  const user = await getUser();

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
      userId: user.id,
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
  await updateDailySummary(user.id);

  return entry.id;
}

// Add quick entry (just name and estimated calories)
export async function addQuickEntry(
  name: string,
  estimatedCalories: number,
  mealType: string = 'snack'
): Promise<string> {
  const user = await getUser();

  const [entry] = await db
    .insert(foodEntries)
    .values({
      userId: user.id,
      customName: name,
      loggedAt: new Date(),
      mealType,
      quantity: '1',
      calories: estimatedCalories.toString(),
    })
    .returning();

  await updateDailySummary(user.id);

  return entry.id;
}

// Delete entry
export async function deleteEntry(entryId: string): Promise<void> {
  const user = await getUser();
  await db.delete(foodEntries).where(eq(foodEntries.id, entryId));
  await updateDailySummary(user.id);
}

// Update daily summary
async function updateDailySummary(userId: string): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const todayStr = today.toISOString().split('T')[0];

  // Get today's entries
  const entries = await db
    .select()
    .from(foodEntries)
    .where(
      and(
        eq(foodEntries.userId, userId),
        gte(foodEntries.loggedAt, today),
        lte(foodEntries.loggedAt, tomorrow)
      )
    );

  // Calculate totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  entries.forEach((e) => {
    if (e.calories) totalCalories += parseFloat(e.calories);
    if (e.protein) totalProtein += parseFloat(e.protein);
    if (e.carbohydrates) totalCarbs += parseFloat(e.carbohydrates);
    if (e.fat) totalFat += parseFloat(e.fat);
  });

  // Calculate 7-day averages
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weekSummaries = await db
    .select()
    .from(nutritionDailySummary)
    .where(
      and(
        eq(nutritionDailySummary.userId, userId),
        gte(nutritionDailySummary.date, sevenDaysAgo.toISOString().split('T')[0])
      )
    );

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
      entriesCount: entries.length,
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
        entriesCount: entries.length,
      },
    });
}

// Get daily summary with 7-day average
export async function getDailySummary(): Promise<{
  today: DailySummaryData;
  avg7d: DailySummaryData;
} | null> {
  const user = await getUser();
  const todayStr = new Date().toISOString().split('T')[0];

  const [summary] = await db
    .select()
    .from(nutritionDailySummary)
    .where(
      and(eq(nutritionDailySummary.userId, user.id), eq(nutritionDailySummary.date, todayStr))
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
  const user = await getUser();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const summaries = await db
    .select()
    .from(nutritionDailySummary)
    .where(
      and(
        eq(nutritionDailySummary.userId, user.id),
        gte(nutritionDailySummary.date, sevenDaysAgo.toISOString().split('T')[0])
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
