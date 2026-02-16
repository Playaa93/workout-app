'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import SegmentedControl from './SegmentedControl';
import type { Segment } from './SegmentedControl';
import SummaryBanner from './SummaryBanner';
import WorkoutBonusChip from './WorkoutBonusChip';
import MealSlotCard from './MealSlotCard';
import WeekChart from './WeekChart';
import type {
  MealType,
  FoodEntryData,
  DailySummaryData,
  NutritionProfileData,
} from './shared';

export default function MainView({
  segment,
  onSegmentChange,
  summary,
  entries,
  weekHistory,
  profile,
  workoutCalories,
  onOpenAddSheet,
  onOpenSettings,
  onDeleteEntry,
}: {
  segment: Segment;
  onSegmentChange: (s: Segment) => void;
  summary: { today: DailySummaryData; avg7d: DailySummaryData } | null;
  entries: FoodEntryData[];
  weekHistory: DailySummaryData[];
  profile: NutritionProfileData | null;
  workoutCalories: number;
  onOpenAddSheet: (mealType: MealType) => void;
  onOpenSettings: () => void;
  onDeleteEntry: (id: string) => void;
}) {
  const entriesByMeal = useMemo(() => {
    const grouped: Record<MealType, FoodEntryData[]> = {
      breakfast: [],
      lunch: [],
      snack: [],
      dinner: [],
    };
    entries.forEach((e) => {
      const mt = (e.mealType as MealType) || 'snack';
      if (grouped[mt]) grouped[mt].push(e);
      else grouped.snack.push(e);
    });
    return grouped;
  }, [entries]);

  const adjustedTarget = profile?.targetCalories
    ? profile.targetCalories + workoutCalories
    : 2000;

  return (
    <Box sx={{ flex: 1, p: 2, pb: 12 }}>
      <Stack spacing={2}>
        <SegmentedControl value={segment} onChange={onSegmentChange} />

        {segment === 'today' && summary && (
          <>
            <SummaryBanner
              summary={summary.today}
              profile={profile}
              workoutCalories={workoutCalories}
            />

            <WorkoutBonusChip workoutCalories={workoutCalories} />

            {!profile && (
              <Card
                sx={{
                  background: (theme: { palette: { mode: string } }) =>
                    theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(103,80,164,0.2) 0%, rgba(156,39,176,0.15) 100%)'
                      : 'linear-gradient(135deg, rgba(103,80,164,0.15) 0%, rgba(156,39,176,0.1) 100%)',
                  border: 1,
                  borderColor: 'primary.main',
                }}
              >
                <CardActionArea onClick={onOpenSettings} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h5">⚙️</Typography>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        Configure ton profil
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        On calcule tes besoins pour t&apos;aider à atteindre ton objectif
                      </Typography>
                    </Box>
                  </Stack>
                </CardActionArea>
              </Card>
            )}

            {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map((mealType) => (
              <MealSlotCard
                key={mealType}
                mealType={mealType}
                entries={entriesByMeal[mealType]}
                targetCalories={adjustedTarget}
                onAddPress={onOpenAddSheet}
                onDeleteEntry={onDeleteEntry}
              />
            ))}
          </>
        )}

        {segment === 'week' && (
          <>
            {summary && (
              <SummaryBanner
                summary={summary.avg7d}
                profile={profile}
                workoutCalories={0}
              />
            )}
            <WeekChart
              weekHistory={weekHistory}
              targetCalories={profile?.targetCalories ?? 0}
            />
          </>
        )}

        {segment === 'month' && summary && (
          <Card>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>📊</Typography>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                Résumé mensuel
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Moyenne sur 7 jours
              </Typography>
              <Typography variant="h4" fontWeight={700} color="primary.main">
                {Math.round(summary.avg7d.totalCalories)} kcal
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                /jour en moyenne
              </Typography>
              {profile?.targetCalories && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Objectif : {profile.targetCalories} kcal/jour
                </Typography>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Protéines</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {Math.round(summary.avg7d.totalProtein)}g
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Glucides</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {Math.round(summary.avg7d.totalCarbs)}g
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Lipides</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {Math.round(summary.avg7d.totalFat)}g
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Card>
        )}
      </Stack>
    </Box>
  );
}
