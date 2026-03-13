'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { tc, card, GOLD } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';
import { MacroPill, MACRO_COLORS } from './shared';
import type { DailySummaryData, NutritionProfileData } from './shared';

function CalorieRing({ size, stroke, pct, d }: { size: number; stroke: number; pct: number; d: boolean }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={GOLD} strokeWidth={stroke}
          strokeDasharray={`${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${alpha(GOLD, 0.4)})` }}
        />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: tc.h(d), lineHeight: 1 }}>
          {pct}%
        </Typography>
      </Box>
    </Box>
  );
}

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
  const { t, d } = useThemeTokens();

  const targetCals = profile?.targetCalories
    ? profile.targetCalories + workoutCalories
    : 2000;
  const consumed = Math.round(summary.totalCalories);
  const remaining = Math.max(0, targetCals - consumed);
  const pct = Math.min(Math.round((consumed / targetCals) * 100), 100);

  return (
    <Box
      onClick={onTap}
      sx={card(t, {
        p: 2.5,
        cursor: onTap ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        ...(onTap && { '&:active': { transform: 'scale(0.98)' } }),
      })}
    >
      <Stack direction="row" alignItems="center" spacing={2.5}>
        <CalorieRing size={72} stroke={6} pct={pct} d={d} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: tc.h(t), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {consumed}
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: tc.m(t), mt: 0.3 }}>
            sur {targetCals} kcal · reste {remaining}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <MacroPill label="Prot" value={Math.round(summary.totalProtein)} target={profile?.targetProtein ?? 150} color={MACRO_COLORS.protein} isDark={d} />
        <MacroPill label="Gluc" value={Math.round(summary.totalCarbs)} target={profile?.targetCarbs ?? 250} color={MACRO_COLORS.carbs} isDark={d} />
        <MacroPill label="Lip" value={Math.round(summary.totalFat)} target={profile?.targetFat ?? 70} color={MACRO_COLORS.fat} isDark={d} />
      </Stack>
    </Box>
  );
}
