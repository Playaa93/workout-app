'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import { MEAL_CONFIG, triggerHaptic } from './shared';
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
  const meal = MEAL_CONFIG[mealType];
  const MealIcon = meal.icon;
  const mealCals = entries.reduce(
    (s, e) => s + (e.calories ? parseFloat(e.calories) : 0),
    0
  );
  const mealTarget = Math.round(targetCalories * (mealType === 'snack' ? 0.1 : 0.3));

  return (
    <Card>
      <CardContent sx={{ py: 2, px: 2 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.5}
          sx={{ mb: entries.length > 0 ? 1.5 : 0 }}
        >
          <Avatar sx={{ width: 40, height: 40, bgcolor: `${meal.color}15` }}>
            <MealIcon sx={{ fontSize: 22, color: meal.color }} />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" fontWeight={700}>
              {meal.label}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <LinearProgress
                variant="determinate"
                value={mealTarget > 0 ? Math.min((mealCals / mealTarget) * 100, 100) : 0}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: meal.color, borderRadius: 2 },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: '0.65rem', minWidth: 60, textAlign: 'right' }}
              >
                {Math.round(mealCals)}/{mealTarget}
              </Typography>
            </Stack>
          </Box>
          <IconButton
            size="small"
            onClick={() => {
              triggerHaptic('light');
              onAddPress(mealType);
            }}
            sx={{
              bgcolor: `${meal.color}12`,
              color: meal.color,
              '&:hover': { bgcolor: `${meal.color}20` },
            }}
          >
            <Add sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>

        {entries.length > 0 && (
          <Stack spacing={0.5} sx={{ pl: 7 }}>
            {entries.map((entry) => {
              const time = entry.loggedAt
                ? new Date(entry.loggedAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '';
              return (
                <Stack
                  key={entry.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      fontWeight={500}
                      sx={{ fontSize: '0.75rem' }}
                      noWrap
                    >
                      {entry.customName || 'Aliment'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: '0.65rem' }}
                    >
                      {time}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ fontSize: '0.75rem', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {entry.calories ? Math.round(parseFloat(entry.calories)) : '--'}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => onDeleteEntry(entry.id)}
                      sx={{
                        p: 0.25,
                        color: 'text.disabled',
                        '&:hover': { color: 'error.main' },
                      }}
                    >
                      <Close sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
