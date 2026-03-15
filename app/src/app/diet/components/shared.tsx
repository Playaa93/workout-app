'use client';

export type {
  CravingData,
  FoodData,
  FoodEntryData,
  DailySummaryData,
  NutritionProfileData,
  NutritionGoal,
  ActivityLevel,
} from '../actions';

export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'snack'
  | 'dinner'
  | 'evening_snack'
  | 'pre_workout'
  | 'intra_workout'
  | 'post_workout';

export const MEAL_CONFIG: Record<MealType, { label: string; color: string }> = {
  breakfast: { label: 'Petit-déj', color: '#ff9800' },
  morning_snack: { label: 'Collation matin', color: '#f59e0b' },
  lunch: { label: 'Déjeuner', color: '#4caf50' },
  afternoon_snack: { label: 'Goûter', color: '#ec4899' },
  snack: { label: 'Snack', color: '#e91e63' },
  dinner: { label: 'Dîner', color: '#7c3aed' },
  evening_snack: { label: 'Collation soir', color: '#8b5cf6' },
  pre_workout: { label: 'Pre-workout', color: '#06b6d4' },
  intra_workout: { label: 'Intra-workout', color: '#0891b2' },
  post_workout: { label: 'Post-workout', color: '#14b8a6' },
};

export const DEFAULT_MEALS: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];
export const EXTRA_MEALS: MealType[] = ['morning_snack', 'afternoon_snack', 'evening_snack', 'pre_workout', 'intra_workout', 'post_workout'];

export { triggerHaptic } from '@/lib/haptic';

export const MACRO_COLORS = { protein: '#93c5fd', carbs: '#fcd34d', fat: '#fca5a5' } as const;
