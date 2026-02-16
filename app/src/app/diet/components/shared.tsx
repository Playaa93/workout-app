'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import FreeBreakfast from '@mui/icons-material/FreeBreakfast';
import LunchDining from '@mui/icons-material/LunchDining';
import DinnerDining from '@mui/icons-material/DinnerDining';
import Icecream from '@mui/icons-material/Icecream';

export type {
  CravingData,
  FoodData,
  FoodEntryData,
  DailySummaryData,
  NutritionProfileData,
  NutritionGoal,
  ActivityLevel,
} from '../actions';

export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export const MEAL_CONFIG = {
  breakfast: { label: 'Petit-déj', icon: FreeBreakfast, color: '#ff9800' },
  lunch: { label: 'Déjeuner', icon: LunchDining, color: '#4caf50' },
  snack: { label: 'Snack', icon: Icecream, color: '#e91e63' },
  dinner: { label: 'Dîner', icon: DinnerDining, color: '#7c3aed' },
} as const;

export const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
};

export function MacroBar({
  label,
  current,
  target,
  color,
  unit,
}: {
  label: string;
  current: number;
  target: number;
  color: string;
  unit: string;
}) {
  return (
    <Box sx={{ flex: 1, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={Math.min((current / target) * 100, 100)}
        sx={{
          height: 6,
          borderRadius: 3,
          my: 0.5,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
        }}
      />
      <Typography
        variant="caption"
        fontWeight={600}
        sx={{ fontSize: '0.7rem', fontVariantNumeric: 'tabular-nums' }}
      >
        {current}
        <Typography component="span" variant="caption" color="text.secondary">
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
}: {
  label: string;
  value: number;
  target: number;
  color: string;
}) {
  return (
    <Box
      sx={{
        bgcolor: 'rgba(255,255,255,0.15)',
        borderRadius: 2,
        px: 1.5,
        py: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
      }}
    >
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
      <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
        {label} {value}/{target}g
      </Typography>
    </Box>
  );
}
