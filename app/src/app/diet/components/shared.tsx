'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { tc } from '@/lib/design-tokens';

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

export function MacroBar({
  label,
  current,
  target,
  color,
  unit,
  isDark = false,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
  isDark?: boolean;
}) {
  return (
    <Box sx={{ flex: 1, textAlign: 'center' }}>
      <Typography sx={{ fontSize: '0.65rem', color: tc.m(isDark) }}>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={target > 0 ? Math.min((current / target) * 100, 100) : 0}
        sx={{
          height: 6,
          borderRadius: 3,
          my: 0.5,
          bgcolor: isDark ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography
        sx={{ fontSize: '0.7rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: tc.h(isDark) }}
      >
        {current}
        <Typography component="span" sx={{ fontSize: '0.7rem', color: tc.m(isDark) }}>
          /{target}{unit}
        </Typography>
      </Typography>
    </Box>
  );
}

export function MacroPill({
  label,
  value,
  target,
  color,
  isDark = false,
}: {
  label: string;
  value: number;
  target: number;
  color: string;
  isDark?: boolean;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{ fontSize: '0.65rem', color: tc.m(isDark), fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: '0.65rem', color: tc.h(isDark), fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}/{target}g
      </Typography>
    </Stack>
  );
}
