'use client';

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, card, GOLD } from '@/lib/design-tokens';
import { getLocalDateStr } from '@/lib/date-utils';
import DateStrip from './DateStrip';
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
  selectedDate,
  onDateChange,
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
  selectedDate: string;
  onDateChange: (date: string) => void;
  summary: { today: DailySummaryData; avg7d: DailySummaryData } | null;
  entries: FoodEntryData[];
  weekHistory: DailySummaryData[];
  profile: NutritionProfileData | null;
  workoutCalories: number;
  onOpenAddSheet: (mealType: MealType) => void;
  onOpenSettings: () => void;
  onDeleteEntry: (id: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';
  const viewingToday = selectedDate === getLocalDateStr();

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
    ? profile.targetCalories + (viewingToday ? workoutCalories : 0)
    : 2000;

  return (
    <Box sx={{ flex: 1, px: 3, pb: 12 }}>
      <Stack spacing={2}>
        <DateStrip selectedDate={selectedDate} onDateChange={onDateChange} />

        <SegmentedControl value={segment} onChange={onSegmentChange} />

        {segment === 'today' && summary && (
          <>
            <SummaryBanner
              summary={summary.today}
              profile={profile}
              workoutCalories={viewingToday ? workoutCalories : 0}
            />

            {viewingToday && <WorkoutBonusChip workoutCalories={workoutCalories} />}

            {!profile && viewingToday && (
              <Box
                onClick={onOpenSettings}
                sx={card(d, {
                  p: 2,
                  cursor: 'pointer',
                  borderColor: alpha(GOLD, 0.2),
                  '&:hover': { borderColor: alpha(GOLD, 0.4) },
                })}
              >
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(d) }}>
                  Configure ton profil
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', color: tc.m(d) }}>
                  On calcule tes besoins pour t&apos;aider à atteindre ton objectif
                </Typography>
              </Box>
            )}

            {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map((mealType) => (
              <MealSlotCard
                key={mealType}
                mealType={mealType}
                entries={entriesByMeal[mealType]}
                targetCalories={adjustedTarget}
                onAddPress={onOpenAddSheet}
                onDeleteEntry={onDeleteEntry}
                readOnly={!viewingToday}
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
          <Box sx={card(d, { p: 3, textAlign: 'center' })}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(d), mb: 0.5 }}>
              Résumé mensuel
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: tc.m(d), mb: 2 }}>
              Moyenne sur 7 jours
            </Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: GOLD, lineHeight: 1 }}>
              {Math.round(summary.avg7d.totalCalories)}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.5 }}>
              kcal/jour en moyenne
            </Typography>
            {profile?.targetCalories && (
              <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mt: 0.5 }}>
                Objectif : {profile.targetCalories} kcal/jour
              </Typography>
            )}
            <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 2.5 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d) }}>
                  {Math.round(summary.avg7d.totalProtein)}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>Protéines (g)</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d) }}>
                  {Math.round(summary.avg7d.totalCarbs)}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>Glucides (g)</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: tc.h(d) }}>
                  {Math.round(summary.avg7d.totalFat)}
                </Typography>
                <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>Lipides (g)</Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
