'use client';

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { Plus } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, card, GOLD, W } from '@/lib/design-tokens';
import { getLocalDateStr } from '@/lib/date-utils';
import { DEFAULT_MEALS, EXTRA_MEALS, MEAL_CONFIG, MACRO_COLORS, triggerHaptic } from './shared';
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
  monthHistory,
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
  monthHistory: DailySummaryData[];
  profile: NutritionProfileData | null;
  workoutCalories: number;
  onOpenAddSheet: (mealType: MealType) => void;
  onOpenSettings: () => void;
  onDeleteEntry: (id: string) => void;
}) {
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';
  const viewingToday = selectedDate === getLocalDateStr();
  const [showExtraPicker, setShowExtraPicker] = useState(false);

  const entriesByMeal = useMemo(() => {
    const grouped: Partial<Record<string, FoodEntryData[]>> = {};
    entries.forEach((e) => {
      const mt = e.mealType || 'snack';
      if (!grouped[mt]) grouped[mt] = [];
      grouped[mt]!.push(e);
    });
    return grouped;
  }, [entries]);

  // Build visible meal slots: defaults + extras that have entries
  const visibleMeals = useMemo(() => {
    const extraWithEntries = EXTRA_MEALS.filter((mt) => (entriesByMeal[mt]?.length ?? 0) > 0);
    // Insert extras in chronological order between defaults
    const all: MealType[] = [];
    for (const def of DEFAULT_MEALS) {
      if (def === 'lunch') {
        if (extraWithEntries.includes('morning_snack')) all.push('morning_snack');
      }
      if (def === 'snack') {
        if (extraWithEntries.includes('afternoon_snack')) all.push('afternoon_snack');
      }
      if (def === 'dinner') {
        if (extraWithEntries.includes('pre_workout')) all.push('pre_workout');
        if (extraWithEntries.includes('intra_workout')) all.push('intra_workout');
      }
      all.push(def);
      if (def === 'dinner') {
        if (extraWithEntries.includes('post_workout')) all.push('post_workout');
        if (extraWithEntries.includes('evening_snack')) all.push('evening_snack');
      }
    }
    return all;
  }, [entriesByMeal]);

  // Extras not yet visible (available to add)
  const availableExtras = EXTRA_MEALS.filter((mt) => !visibleMeals.includes(mt));

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
              onTap={onOpenSettings}
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

            {visibleMeals.map((mealType) => (
              <MealSlotCard
                key={mealType}
                mealType={mealType}
                entries={entriesByMeal[mealType] || []}
                targetCalories={adjustedTarget}
                onAddPress={onOpenAddSheet}
                onDeleteEntry={onDeleteEntry}
              />
            ))}

            {/* Add extra meal slot */}
            {availableExtras.length > 0 && (
              !showExtraPicker ? (
                  <Box
                    onClick={() => { triggerHaptic('light'); setShowExtraPicker(true); }}
                    sx={{
                      py: 1.25,
                      textAlign: 'center',
                      borderRadius: '14px',
                      border: '1px dashed',
                      borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      '&:active': { borderColor: alpha(GOLD, 0.3) },
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.75}>
                      <Plus size={16} weight={W} style={{ color: tc.f(d) }} />
                      <Typography sx={{ fontSize: '0.7rem', color: tc.f(d) }}>
                        Ajouter un repas
                      </Typography>
                    </Stack>
                  </Box>
                ) : (
                  <Box sx={card(d, { p: 1.5 })}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(d) }}>
                        Quel repas ?
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setShowExtraPicker(false)}
                        sx={{ p: 0.25, color: tc.f(d) }}
                      >
                        <Plus size={14} weight={W} style={{ transform: 'rotate(45deg)' }} />
                      </IconButton>
                    </Stack>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {availableExtras.map((mt) => {
                        const cfg = MEAL_CONFIG[mt];
                        return (
                          <Box
                            key={mt}
                            onClick={() => {
                              triggerHaptic('light');
                              setShowExtraPicker(false);
                              onOpenAddSheet(mt);
                            }}
                            sx={{
                              px: 1.5,
                              py: 0.75,
                              borderRadius: '10px',
                              border: '1px solid',
                              borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:active': { borderColor: GOLD, bgcolor: alpha(GOLD, 0.06) },
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, flexShrink: 0 }} />
                              <Typography sx={{ fontSize: '0.65rem', fontWeight: 500, color: tc.h(d), whiteSpace: 'nowrap' }}>
                                {cfg.label}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )
            )}
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

        {segment === 'month' && (
          <MonthSummary monthHistory={monthHistory} profile={profile} d={d} />
        )}
      </Stack>
    </Box>
  );
}

// ─── Month Summary ──────────────────────────────────────────────────

function MonthSummary({
  monthHistory,
  profile,
  d,
}: {
  monthHistory: DailySummaryData[];
  profile: NutritionProfileData | null;
  d: boolean;
}) {
  const stats = useMemo(() => {
    let totalCals = 0, totalProt = 0, totalCarbs = 0, totalFat = 0;
    let best = -Infinity, lowest = Infinity, n = 0;
    for (const day of monthHistory) {
      if (day.entriesCount <= 0) continue;
      n++;
      totalCals += day.totalCalories;
      totalProt += day.totalProtein;
      totalCarbs += day.totalCarbs;
      totalFat += day.totalFat;
      if (day.totalCalories > best) best = day.totalCalories;
      if (day.totalCalories < lowest) lowest = day.totalCalories;
    }
    if (n === 0) return null;
    return {
      daysTracked: n,
      avgCals: Math.round(totalCals / n),
      avgProt: Math.round(totalProt / n),
      avgCarbs: Math.round(totalCarbs / n),
      avgFat: Math.round(totalFat / n),
      bestDay: Math.round(best),
      lowestDay: Math.round(lowest),
    };
  }, [monthHistory]);

  if (!stats) {
    return (
      <Box sx={card(d, { p: 3, textAlign: 'center' })}>
        <Typography sx={{ fontSize: '0.8rem', color: tc.f(d) }}>
          Pas encore de donnees ce mois-ci
        </Typography>
      </Box>
    );
  }

  const target = profile?.targetCalories ?? 2000;
  const adherence = target > 0 ? Math.round((stats.avgCals / target) * 100) : 0;

  return (
    <Stack spacing={2}>
      {/* Main stat */}
      <Box sx={card(d, { p: 2.5, textAlign: 'center' })}>
        <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.5 }}>
          Moyenne sur 30 jours
        </Typography>
        <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, color: GOLD, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {stats.avgCals}
        </Typography>
        <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.5 }}>
          kcal/jour sur {stats.daysTracked} jours suivis
        </Typography>
        {profile?.targetCalories && (
          <Typography sx={{ fontSize: '0.65rem', color: adherence > 110 ? '#fca5a5' : adherence < 90 ? '#fcd34d' : '#86efac', mt: 0.5 }}>
            {adherence}% de l&apos;objectif ({target} kcal)
          </Typography>
        )}
      </Box>

      {/* Macros avg */}
      <Box sx={card(d, { overflow: 'hidden' })}>
        {[
          { label: 'Proteines', value: `${stats.avgProt}g`, target: profile?.targetProtein ? `/${profile.targetProtein}g` : '/jour', color: MACRO_COLORS.protein },
          { label: 'Glucides', value: `${stats.avgCarbs}g`, target: profile?.targetCarbs ? `/${profile.targetCarbs}g` : '/jour', color: MACRO_COLORS.carbs },
          { label: 'Lipides', value: `${stats.avgFat}g`, target: profile?.targetFat ? `/${profile.targetFat}g` : '/jour', color: MACRO_COLORS.fat },
        ].map((row, i, arr) => (
          <Stack
            key={row.label}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2,
              py: 1.25,
              borderBottom: i < arr.length - 1 ? '1px solid' : 'none',
              borderColor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.75rem', color: tc.m(d) }}>
                {row.label}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>
              {row.value}
              <Typography component="span" sx={{ fontSize: '0.65rem', color: tc.f(d) }}>
                {row.target}
              </Typography>
            </Typography>
          </Stack>
        ))}
      </Box>

      {/* Range */}
      <Box sx={card(d, { p: 2 })}>
        <Stack direction="row" spacing={2}>
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jour le plus bas
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(d), fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
              {stats.lowestDay}
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>kcal</Typography>
          </Box>
          <Box sx={{ width: '1px', bgcolor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06) }} />
          <Box sx={{ flex: 1, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.55rem', color: tc.f(d), textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Jour le plus haut
            </Typography>
            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(d), fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
              {stats.bestDay}
            </Typography>
            <Typography sx={{ fontSize: '0.6rem', color: tc.f(d) }}>kcal</Typography>
          </Box>
        </Stack>
      </Box>
    </Stack>
  );
}
