'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { Barbell } from '@phosphor-icons/react';
import { tc, card, GOLD, W } from '@/lib/design-tokens';
import { useThemeTokens } from '@/hooks/useDark';

export default function WorkoutBonusChip({
  workoutCalories,
}: {
  workoutCalories: number;
}) {
  const { t, d } = useThemeTokens();

  if (workoutCalories <= 0) return null;

  return (
    <Box sx={card(t, { p: 2, borderColor: alpha(GOLD, 0.2) })}>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Barbell size={18} weight={W} color={GOLD} />
        <Typography sx={{ fontSize: '0.8rem', color: tc.m(t), flex: 1 }}>
          Séance aujourd&apos;hui
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: GOLD }}>
          +{workoutCalories} kcal
        </Typography>
      </Stack>
    </Box>
  );
}
