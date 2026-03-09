'use client';

import { useMemo } from 'react';
import { useQuery } from '@powersync/react';
import { useUserId } from '../auth-context';
import { todayStr, localDayBoundsUTC } from '../helpers';
import { getLocalDateStr } from '@/lib/date-utils';
import type { Database } from '../schema';

export type FoodRow = Database['foods'];
export type FoodCravingRow = Database['food_cravings'];
export type FoodEntryRow = Database['food_entries'];
export type NutritionSummaryRow = Database['nutrition_daily_summary'];
export type NutritionProfileRow = Database['nutrition_profiles'];

export function useTodayEntries() {
  return useEntriesForDate(todayStr());
}

export function useEntriesForDate(dateStr: string) {
  const userId = useUserId();
  const bounds = useMemo(() => localDayBoundsUTC(dateStr), [dateStr]);
  return useQuery<FoodEntryRow>(
    `SELECT * FROM food_entries
     WHERE user_id = ? AND logged_at >= ? AND logged_at < ?
     ORDER BY logged_at DESC`,
    [userId, bounds.start, bounds.end]
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
      : `SELECT * FROM foods WHERE 0`, // empty result when query too short
    [safeQuery, safeQuery]
  );
}

export function useDailySummary() {
  return useSummaryForDate(todayStr());
}

export function useSummaryForDate(dateStr: string) {
  const userId = useUserId();
  return useQuery<NutritionSummaryRow>(
    `SELECT * FROM nutrition_daily_summary WHERE user_id = ? AND date = ?`,
    [userId, dateStr]
  );
}

export function useWeekHistory() {
  const userId = useUserId();
  const sinceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateStr(d);
  }, []);

  return useQuery<NutritionSummaryRow>(
    `SELECT * FROM nutrition_daily_summary WHERE user_id = ? AND date >= ? ORDER BY date`,
    [userId, sinceDate]
  );
}

export function useMonthHistory() {
  const userId = useUserId();
  const sinceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getLocalDateStr(d);
  }, []);

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

export function useRecentFoods() {
  const userId = useUserId();
  const sinceDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return getLocalDateStr(d);
  }, []);

  return useQuery<FoodEntryRow & { food_name: string | null }>(
    `SELECT fe.*, f.name_fr as food_name
     FROM food_entries fe
     LEFT JOIN foods f ON fe.food_id = f.id
     WHERE fe.user_id = ? AND fe.logged_at >= ?
     ORDER BY fe.logged_at DESC LIMIT 50`,
    [userId, sinceDate]
  );
}

export function useFoodByBarcode(barcode: string) {
  return useQuery<FoodRow>(
    barcode ? `SELECT * FROM foods WHERE barcode = ? LIMIT 1` : `SELECT * FROM foods WHERE 0`,
    [barcode]
  );
}
