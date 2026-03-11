'use client';

import { usePowerSync } from '@powersync/react';
import { useUserId } from '../auth-context';
import { uuid, nowISO, todayStr, localDayBoundsUTC, toSqliteTimestamp } from '../helpers';

export function useDietMutations(targetDate?: string) {
  const db = usePowerSync();
  const userId = useUserId();

  /** Resolved date: provided targetDate or today */
  const resolvedDate = targetDate || todayStr();
  const isToday = resolvedDate === todayStr();

  async function addFoodEntry(data: {
    foodId?: string;
    cravingId?: string;
    customName?: string;
    mealType: string;
    quantity: number;
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    servingSize?: number;
    photoUrl?: string;
    recognizedByAi?: boolean;
    aiConfidence?: number;
    isCheat?: boolean;
    notes?: string;
  }): Promise<string> {
    const id = uuid();
    const now = nowISO();
    const loggedAt = isToday ? now : toSqliteTimestamp(new Date(resolvedDate + 'T12:00:00'));

    await db.execute(
      `INSERT INTO food_entries (
        id, user_id, food_id, craving_id, custom_name, logged_at, meal_type,
        quantity, serving_size, calories, protein, carbohydrates, fat,
        photo_url, recognized_by_ai, ai_confidence, is_cheat, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId,
        data.foodId ?? null,
        data.cravingId ?? null,
        data.customName ?? null,
        loggedAt,
        data.mealType,
        data.quantity.toString(),
        data.servingSize?.toString() ?? null,
        data.calories?.toString() ?? null,
        data.protein?.toString() ?? null,
        data.carbohydrates?.toString() ?? null,
        data.fat?.toString() ?? null,
        data.photoUrl ?? null,
        data.recognizedByAi ? 1 : 0,
        data.aiConfidence?.toString() ?? null,
        data.isCheat ? 1 : 0,
        data.notes ?? null,
        now,
      ]
    );

    await recalcDailySummary();
    return id;
  }

  async function deleteEntry(entryId: string): Promise<void> {
    await db.execute(`DELETE FROM food_entries WHERE id = ?`, [entryId]);
    await recalcDailySummary();
  }

  async function recalcDailySummary(): Promise<void> {
    const date = resolvedDate;
    const { start: dayStart, end: dayEnd } = localDayBoundsUTC(date);

    const ref = new Date(date + 'T12:00:00');
    ref.setDate(ref.getDate() - 7);
    const sinceDate = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(ref.getDate()).padStart(2, '0')}`;

    const [totals, weekData, existing] = await Promise.all([
      db.getOptional<{
        total_calories: number;
        total_protein: number;
        total_carbs: number;
        total_fat: number;
        entries_count: number;
      }>(
        `SELECT
          COALESCE(SUM(CAST(calories AS REAL)), 0) as total_calories,
          COALESCE(SUM(CAST(protein AS REAL)), 0) as total_protein,
          COALESCE(SUM(CAST(carbohydrates AS REAL)), 0) as total_carbs,
          COALESCE(SUM(CAST(fat AS REAL)), 0) as total_fat,
          COUNT(*) as entries_count
        FROM food_entries
        WHERE user_id = ? AND logged_at >= ? AND logged_at < ?`,
        [userId, dayStart, dayEnd]
      ),
      db.getAll<{
        total_calories: string | null;
        total_protein: string | null;
        total_carbs: string | null;
        total_fat: string | null;
      }>(
        `SELECT total_calories, total_protein, total_carbs, total_fat
         FROM nutrition_daily_summary
         WHERE user_id = ? AND date >= ? AND date != ?`,
        [userId, sinceDate, date]
      ),
      db.getOptional<{ id: string }>(
        `SELECT id FROM nutrition_daily_summary WHERE user_id = ? AND date = ?`,
        [userId, date]
      ),
    ]);

    if (!totals) return;

    const daysWithData = weekData.length + 1;
    const avgCalories = (weekData.reduce((s, r) => s + parseFloat(r.total_calories || '0'), 0) + totals.total_calories) / daysWithData;
    const avgProtein = (weekData.reduce((s, r) => s + parseFloat(r.total_protein || '0'), 0) + totals.total_protein) / daysWithData;
    const avgCarbs = (weekData.reduce((s, r) => s + parseFloat(r.total_carbs || '0'), 0) + totals.total_carbs) / daysWithData;
    const avgFat = (weekData.reduce((s, r) => s + parseFloat(r.total_fat || '0'), 0) + totals.total_fat) / daysWithData;

    if (existing) {
      await db.execute(
        `UPDATE nutrition_daily_summary SET
          total_calories = ?, total_protein = ?, total_carbs = ?, total_fat = ?,
          avg_7d_calories = ?, avg_7d_protein = ?, avg_7d_carbs = ?, avg_7d_fat = ?,
          entries_count = ?
        WHERE id = ?`,
        [
          totals.total_calories.toString(),
          totals.total_protein.toString(),
          totals.total_carbs.toString(),
          totals.total_fat.toString(),
          avgCalories.toString(),
          avgProtein.toString(),
          avgCarbs.toString(),
          avgFat.toString(),
          totals.entries_count,
          existing.id,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO nutrition_daily_summary (id, user_id, date, total_calories, total_protein, total_carbs, total_fat, avg_7d_calories, avg_7d_protein, avg_7d_carbs, avg_7d_fat, entries_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(), userId, date,
          totals.total_calories.toString(),
          totals.total_protein.toString(),
          totals.total_carbs.toString(),
          totals.total_fat.toString(),
          avgCalories.toString(),
          avgProtein.toString(),
          avgCarbs.toString(),
          avgFat.toString(),
          totals.entries_count,
        ]
      );
    }
  }

  async function saveNutritionProfile(data: {
    goal: string;
    activityLevel: string;
    height: number;
    weight: number;
    age: number;
    isMale: boolean;
    tdee: number;
    targetCalories: number;
    targetProtein: number;
    targetCarbs: number;
    targetFat: number;
  }): Promise<void> {
    const now = nowISO();
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM nutrition_profiles WHERE user_id = ?`,
      [userId]
    );

    if (existing) {
      await db.execute(
        `UPDATE nutrition_profiles SET
          goal = ?, activity_level = ?, height = ?, weight = ?, age = ?, is_male = ?,
          tdee = ?, target_calories = ?, target_protein = ?, target_carbs = ?, target_fat = ?, updated_at = ?
        WHERE user_id = ?`,
        [
          data.goal, data.activityLevel,
          data.height.toString(), data.weight.toString(), data.age,
          data.isMale ? 1 : 0,
          data.tdee, data.targetCalories, data.targetProtein, data.targetCarbs, data.targetFat,
          now, userId,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO nutrition_profiles (id, user_id, goal, activity_level, height, weight, age, is_male, tdee, target_calories, target_protein, target_carbs, target_fat, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuid(), userId, data.goal, data.activityLevel,
          data.height.toString(), data.weight.toString(), data.age,
          data.isMale ? 1 : 0,
          data.tdee, data.targetCalories, data.targetProtein, data.targetCarbs, data.targetFat,
          now, now,
        ]
      );
    }
  }

  return {
    addFoodEntry,
    deleteEntry,
    recalcDailySummary,
    saveNutritionProfile,
  };
}
