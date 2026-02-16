'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import FitnessCenter from '@mui/icons-material/FitnessCenter';

export default function WorkoutBonusChip({
  workoutCalories,
}: {
  workoutCalories: number;
}) {
  if (workoutCalories <= 0) return null;

  return (
    <Card sx={{ bgcolor: 'rgba(255,152,0,0.08)', border: 1, borderColor: 'rgba(255,152,0,0.2)' }}>
      <CardContent sx={{ py: 1.5, px: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <FitnessCenter sx={{ fontSize: 20, color: '#ff9800' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
              Séance aujourd&apos;hui
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              +{workoutCalories} kcal ajoutées à ton objectif
            </Typography>
          </Box>
          <Chip
            label={`+${workoutCalories}`}
            size="small"
            sx={{
              bgcolor: 'rgba(255,152,0,0.15)',
              color: '#ff9800',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
