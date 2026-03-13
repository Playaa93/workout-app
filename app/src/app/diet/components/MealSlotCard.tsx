'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { Plus, X } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { tc, card, GOLD, W } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';
import { MEAL_CONFIG, EXTRA_MEALS, MACRO_COLORS, triggerHaptic } from './shared';
import type { MealType, FoodEntryData } from './shared';


export default function MealSlotCard({
  mealType,
  entries,
  targetCalories,
  onAddPress,
  onDeleteEntry,
}: {
  mealType: MealType;
  entries: FoodEntryData[];
  targetCalories: number;
  onAddPress: (mealType: MealType) => void;
  onDeleteEntry: (id: string) => void;
}) {
  const { t, d } = useThemeTokens();

  const meal = MEAL_CONFIG[mealType];
  const { mealCals, mealProt, mealCarbs, mealFat } = useMemo(() => {
    let cals = 0, prot = 0, carbs = 0, fat = 0;
    for (const e of entries) {
      cals += e.calories ? parseFloat(e.calories) : 0;
      prot += e.protein ? parseFloat(e.protein) : 0;
      carbs += e.carbohydrates ? parseFloat(e.carbohydrates) : 0;
      fat += e.fat ? parseFloat(e.fat) : 0;
    }
    return { mealCals: cals, mealProt: prot, mealCarbs: carbs, mealFat: fat };
  }, [entries]);
  const isSnackLike = mealType === 'snack' || EXTRA_MEALS.includes(mealType);
  const mealTarget = Math.round(targetCalories * (isSnackLike ? 0.1 : 0.3));
  const hasMacros = entries.length > 0 && (mealProt > 0 || mealCarbs > 0 || mealFat > 0);

  return (
    <Box sx={card(t, { p: 2 })}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: meal.color, flexShrink: 0 }} />
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(t), flex: 1 }}>
          {meal.label}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: tc.m(t), fontVariantNumeric: 'tabular-nums' }}>
          {Math.round(mealCals)}/{mealTarget}
        </Typography>
        <IconButton
          size="small"
          onClick={() => {
            triggerHaptic('light');
            onAddPress(mealType);
          }}
          sx={{ width: 28, height: 28, bgcolor: alpha(GOLD, 0.1) }}
        >
          <Plus size={16} weight={W} color={GOLD} />
        </IconButton>
      </Stack>

      {hasMacros && (
        <Stack direction="row" spacing={1.5} sx={{ mt: 0.5, ml: 1.75, mb: entries.length > 0 ? 0.5 : 0 }}>
          {[
            { label: 'P', value: Math.round(mealProt), color: MACRO_COLORS.protein },
            { label: 'G', value: Math.round(mealCarbs), color: MACRO_COLORS.carbs },
            { label: 'L', value: Math.round(mealFat), color: MACRO_COLORS.fat },
          ].map((m) => (
            <Stack key={m.label} direction="row" alignItems="center" spacing={0.3}>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: m.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.55rem', color: tc.f(t), fontVariantNumeric: 'tabular-nums' }}>
                {m.label} {m.value}g
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}

      {entries.length > 0 && (
        <Stack spacing={0}>
          {entries.map((entry, i) => {
            const time = entry.loggedAt
              ? new Date(entry.loggedAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            return (
              <Box
                key={entry.id}
                sx={{
                  py: 1,
                  borderTop: i > 0 ? '1px solid' : 'none',
                  borderColor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
                }}
              >
                <Stack direction="row" alignItems="center">
                  <Typography
                    sx={{ fontSize: '0.8rem', fontWeight: 500, color: tc.h(t), flex: 1 }}
                    noWrap
                  >
                    {(entry.customName || 'Aliment').replace(/^./, c => c.toUpperCase())}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), mr: 1.5 }}>
                    {time}
                  </Typography>
                  <Typography
                    sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.m(t), fontVariantNumeric: 'tabular-nums', mr: 0.5 }}
                  >
                    {entry.calories ? `${Math.round(parseFloat(entry.calories))} kcal` : '--'}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => onDeleteEntry(entry.id)}
                    sx={{
                      p: 0.25,
                      color: tc.f(t),
                      '&:hover': { color: '#ef4444' },
                    }}
                  >
                    <X size={14} weight={W} />
                  </IconButton>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
