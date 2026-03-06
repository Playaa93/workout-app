import { useQuery } from '@powersync/react';
import { useUserId } from '../auth-context';
import { todayStr } from '../helpers';
import type { Database } from '../schema';

export type FoodRow = Database['foods'];
export type FoodCravingRow = Database['food_cravings'];
export type FoodEntryRow = Database['food_entries'];
export type NutritionSummaryRow = Database['nutrition_daily_summary'];
export type NutritionProfileRow = Database['nutrition_profiles'];

export function useTodayEntries() {
  const userId = useUserId();
  const today = todayStr();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  return useQuery<FoodEntryRow>(
    `SELECT * FROM food_entries
     WHERE user_id = ? AND logged_at >= ? AND logged_at < ?
     ORDER BY logged_at DESC`,
    [userId, today + 'T00:00:00', tomorrowStr + 'T00:00:00']
  );
}

export function useCravings() {
  return useQuery<FoodCravingRow>(
    `SELECT * FROM food_cravings WHERE is_active = 1 ORDER BY category, name_fr`
  );
}

export function useSearchFoods(query: string) {
  const safeQuery = `%${query.toLowerCase()}%`;
  return useQuery<FoodRow>(
    query.length >= 2
      ? `SELECT * FROM foods WHERE LOWER(name_fr) LIKE ? OR LOWER(COALESCE(brand, '')) LIKE ? ORDER BY LENGTH(name_fr) LIMIT 20`
      : `SELECT * FROM foods WHERE 0`,
    [safeQuery, safeQuery]
  );
}

export function useDailySummary() {
  const userId = useUserId();
  const today = todayStr();
  return useQuery<NutritionSummaryRow>(
    `SELECT * FROM nutrition_daily_summary WHERE user_id = ? AND date = ?`,
    [userId, today]
  );
}

export function useWeekHistory() {
  const userId = useUserId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sinceDate = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

  return useQuery<NutritionSummaryRow>(
    `SELECT * FROM nutrition_daily_summary WHERE user_id = ? AND date >= ? ORDER BY date`,
    [userId, sinceDate]
  );
}

export function useNutritionProfile() {
  const userId = useUserId();
  return useQuery<NutritionProfileRow>(
    `SELECT * FROM nutrition_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
}

export function useRecentFoods(limit = 10) {
  const userId = useUserId();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return useQuery<FoodEntryRow & { food_name: string | null }>(
    `SELECT fe.*, f.name_fr as food_name
     FROM food_entries fe
     LEFT JOIN foods f ON fe.food_id = f.id
     WHERE fe.user_id = ? AND fe.logged_at >= ?
     ORDER BY fe.logged_at DESC LIMIT 50`,
    [userId, sevenDaysAgo.toISOString()]
  );
}

export function useFoodByBarcode(barcode: string) {
  return useQuery<FoodRow>(
    barcode ? `SELECT * FROM foods WHERE barcode = ? LIMIT 1` : `SELECT * FROM foods WHERE 0`,
    [barcode]
  );
}
