'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import TrendingUp from '@mui/icons-material/TrendingUp';
import type { DailySummaryData } from './shared';

export default function WeekChart({
  weekHistory,
  targetCalories,
}: {
  weekHistory: DailySummaryData[];
  targetCalories: number;
}) {
  if (weekHistory.length < 2) return null;

  const maxCal = Math.max(...weekHistory.map((d) => d.totalCalories), 1);
  const avg = Math.round(
    weekHistory.reduce((s, d) => s + d.totalCalories, 0) / weekHistory.length
  );

  return (
    <Card>
      <CardContent sx={{ py: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1.5 }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Cette semaine
          </Typography>
          <Chip
            icon={<TrendingUp sx={{ fontSize: 14 }} />}
            label={`Moy: ${avg} kcal`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.65rem', height: 24 }}
          />
        </Stack>
        <Box
          sx={{ height: 80, display: 'flex', alignItems: 'flex-end', gap: 0.75, px: 0.5 }}
        >
          {weekHistory.map((day, i) => {
            const pct = Math.min(day.totalCalories / (maxCal * 1.1), 1);
            const isOver = targetCalories > 0 && day.totalCalories > targetCalories;
            const isToday = i === weekHistory.length - 1;
            const dayName = new Date(day.date).toLocaleDateString('fr-FR', {
              weekday: 'short',
            });

            return (
              <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                <Box
                  sx={{
                    height: `${pct * 60}px`,
                    bgcolor: isToday
                      ? 'primary.main'
                      : isOver
                        ? 'rgba(239,68,68,0.3)'
                        : 'action.hover',
                    borderRadius: 0.75,
                    mb: 0.5,
                    border: isToday ? '2px solid' : 'none',
                    borderColor: 'primary.main',
                    transition: 'height 0.3s ease',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.6rem',
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? 'primary.main' : 'text.secondary',
                    textTransform: 'capitalize',
                  }}
                >
                  {dayName}
                </Typography>
              </Box>
            );
          })}
        </Box>
        {targetCalories > 0 && (
          <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'flex-end' }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.55rem' }}>
              Objectif : {targetCalories} kcal/j
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
