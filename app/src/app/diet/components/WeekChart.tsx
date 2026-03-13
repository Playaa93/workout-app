'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { TrendUp } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { tc, card, GOLD, W } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';
import type { DailySummaryData } from './shared';

export default function WeekChart({
  weekHistory,
  targetCalories,
}: {
  weekHistory: DailySummaryData[];
  targetCalories: number;
}) {
  const { t, d } = useThemeTokens();

  if (weekHistory.length < 2) return null;

  const maxCal = Math.max(...weekHistory.map((day) => day.totalCalories), targetCalories || 1);
  const avg = Math.round(
    weekHistory.reduce((s, day) => s + day.totalCalories, 0) / weekHistory.length,
  );

  return (
    <Box sx={card(t, { p: 2.5 })}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.m(t) }}>
          Cette semaine
        </Typography>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <TrendUp size={14} weight={W} color={GOLD} />
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.h(t) }}>
            Moy: {avg} kcal
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ height: 120, alignItems: 'flex-end' }}>
        {weekHistory.map((day, i) => {
          const h = (day.totalCalories / maxCal) * 100;
          const isToday = i === weekHistory.length - 1;
          const isOver = targetCalories > 0 && day.totalCalories > targetCalories;
          const dayName = new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' });

          return (
            <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.55rem', fontWeight: 600, color: tc.f(t), fontVariantNumeric: 'tabular-nums' }}>
                {day.totalCalories > 0 ? Math.round(day.totalCalories) : ''}
              </Typography>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 28,
                  height: `${h}%`,
                  minHeight: 4,
                  borderRadius: '6px 6px 2px 2px',
                  bgcolor: isToday
                    ? GOLD
                    : isOver
                      ? alpha('#ef4444', 0.6)
                      : d
                        ? alpha('#ffffff', 0.08)
                        : alpha('#000000', 0.06),
                  border: isToday ? `1px solid ${GOLD}` : 'none',
                  transition: 'height 0.4s ease',
                }}
              />
              <Typography
                sx={{
                  fontSize: '0.6rem',
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? GOLD : tc.f(t),
                  textTransform: 'capitalize',
                }}
              >
                {dayName}
              </Typography>
            </Box>
          );
        })}
      </Stack>

      {targetCalories > 0 && (
        <Box sx={{ mt: 1, borderTop: '1px dashed', borderColor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06), pt: 0.5 }}>
          <Typography sx={{ fontSize: '0.6rem', color: tc.f(t), textAlign: 'right' }}>
            Objectif: {targetCalories} kcal/j
          </Typography>
        </Box>
      )}
    </Box>
  );
}
