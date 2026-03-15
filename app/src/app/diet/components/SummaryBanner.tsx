'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { tc, card, GOLD } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';
import { MACRO_COLORS } from './shared';
import type { DailySummaryData, NutritionProfileData } from './shared';

const MC = { P: MACRO_COLORS.protein, G: MACRO_COLORS.carbs, L: MACRO_COLORS.fat };

export default function SummaryBanner({
  summary,
  profile,
  workoutCalories,
  onTap,
}: {
  summary: DailySummaryData;
  profile: NutritionProfileData | null;
  workoutCalories: number;
  onTap?: () => void;
}) {
  const { t } = useThemeTokens();
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.1em', textTransform: 'uppercase' as const };

  const targetCals = profile?.targetCalories
    ? profile.targetCalories + workoutCalories
    : 2000;
  const consumed = Math.round(summary.totalCalories);
  const remaining = Math.max(0, targetCals - consumed);
  const over = consumed > targetCals;

  const prot = Math.round(summary.totalProtein);
  const carbs = Math.round(summary.totalCarbs);
  const fat = Math.round(summary.totalFat);
  const targetProt = profile?.targetProtein ?? 150;
  const targetCarbs = profile?.targetCarbs ?? 250;
  const targetFat = profile?.targetFat ?? 70;

  return (
    <Box
      onClick={onTap}
      sx={card(t, {
        p: 2.5,
        cursor: onTap ? 'pointer' : 'default',
        ...(onTap && { '&:active': { opacity: 0.85 } }),
      })}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography sx={lblSx}>Nutrition</Typography>
        <Typography sx={{ fontSize: '0.6rem', color: over ? '#f87171' : tc.m(t), fontWeight: 600 }}>
          {over ? `${consumed - targetCals} en trop` : `${remaining} restant`}
        </Typography>
      </Stack>

      {/* Big calorie number */}
      <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: tc.h(t), lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
          {consumed}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), fontWeight: 500 }}>
          / {targetCals} kcal
        </Typography>
      </Stack>

      {/* Calorie bar */}
      <Box sx={{ height: 4, borderRadius: 2, bgcolor: alpha(GOLD, 0.08), overflow: 'hidden', mb: 1.2 }}>
        <Box sx={{
          width: `${Math.min((consumed / targetCals) * 100, 100)}%`,
          height: '100%', borderRadius: 2, bgcolor: over ? '#f87171' : GOLD,
          transition: 'width 0.5s',
        }} />
      </Box>

      {/* Macro bars inline */}
      <Stack direction="row" spacing={2}>
        {[
          { k: 'Prot', v: prot, target: targetProt, c: MC.P },
          { k: 'Gluc', v: carbs, target: targetCarbs, c: MC.G },
          { k: 'Lip', v: fat, target: targetFat, c: MC.L },
        ].map((m) => (
          <Box key={m.k} sx={{ flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.2 }}>
              <Typography sx={{ fontSize: '0.5rem', color: tc.f(t), fontWeight: 500 }}>{m.k}</Typography>
              <Typography sx={{ fontSize: '0.5rem', color: tc.m(t), fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{m.v}/{m.target}g</Typography>
            </Stack>
            <Box sx={{ height: 3, borderRadius: 2, bgcolor: alpha(m.c, 0.15), overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min((m.v / m.target) * 100, 100)}%`, height: '100%', borderRadius: 2, bgcolor: m.c, transition: 'width 0.5s' }} />
            </Box>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
