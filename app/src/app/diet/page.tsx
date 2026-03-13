'use client';

import { useState, useEffect, useMemo } from 'react';
import { useBackHandler } from '@/hooks/useBackHandler';
import type {
  CravingData,
  FoodEntryData,
  DailySummaryData,
  NutritionProfileData,
} from './actions';
import { useAuth } from '@/powersync/auth-context';
import {
  useEntriesForDate,
  useCravings,
  useSummaryForDate,
  useWeekHistory,
  useMonthHistory,
  useNutritionProfile,
  useRecentFoods,
} from '@/powersync/queries/diet-queries';
import { useLatestMeasurement } from '@/powersync/queries/measurement-queries';
import { useTodayWorkoutCalories } from '@/powersync/queries/workout-queries';
import { useDietMutations } from '@/powersync/mutations/diet-mutations';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';
import { useThemeTokens } from '@/hooks/useDark';
import { surfaceBg, panelBg, tc, GOLD } from '@/lib/design-tokens';
import { getLocalDateStr } from '@/lib/date-utils';
import { triggerHaptic } from './components/shared';
import type { MealType } from './components/shared';
import type { Segment } from './components/SegmentedControl';
import type { SheetAction } from './components/AddEntryBottomSheet';
import MainView from './components/MainView';
import CravingsView from './components/CravingsView';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import ScannerView from './components/ScannerView';
import PhotoAIView from './components/PhotoAIView';
import AddEntryBottomSheet from './components/AddEntryBottomSheet';
import BottomNav from '@/components/BottomNav';

type View = 'main' | 'cravings' | 'search' | 'scanner' | 'photo';

function toFoodEntryData(e: any): FoodEntryData {
  return {
    id: e.id,
    foodId: e.food_id,
    cravingId: e.craving_id,
    customName: e.custom_name,
    loggedAt: new Date(e.logged_at),
    mealType: e.meal_type,
    quantity: e.quantity ?? '1',
    calories: e.calories,
    protein: e.protein,
    carbohydrates: e.carbohydrates,
    fat: e.fat,
    isCheat: !!e.is_cheat,
    notes: e.notes,
  };
}

function toSummaryRow(s: any): DailySummaryData {
  return {
    date: s.date,
    totalCalories: parseFloat(s.total_calories || '0'),
    totalProtein: parseFloat(s.total_protein || '0'),
    totalCarbs: parseFloat(s.total_carbs || '0'),
    totalFat: parseFloat(s.total_fat || '0'),
    entriesCount: s.entries_count || 0,
  };
}

export default function DietPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <DietContent />;
}

function DietContent() {
  const { t, d } = useThemeTokens();
  const [view, setView] = useState<View>('main');
  const [segment, setSegment] = useState<Segment>('today');
  const [selectedDate, setSelectedDate] = useState(getLocalDateStr);

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('snack');

  // Back button → close overlay instead of navigating away
  useBackHandler(view !== 'main', () => setView('main'), 'diet-view');
  useBackHandler(sheetOpen, () => setSheetOpen(false), 'diet-sheet');
  useBackHandler(settingsOpen, () => setSettingsOpen(false), 'diet-settings');

  // PowerSync reactive hooks
  const { data: cravingRows } = useCravings();
  const { data: entryRows, isLoading: entriesLoading } = useEntriesForDate(selectedDate);
  const { data: summaryRows } = useSummaryForDate(selectedDate);
  const { data: weekRows } = useWeekHistory();
  const { data: monthRows } = useMonthHistory();
  const { data: profileRows } = useNutritionProfile();
  const { data: workoutCalRows } = useTodayWorkoutCalories();
  const { data: recentRows } = useRecentFoods();
  const { data: latestMeasurement } = useLatestMeasurement();
  const mutations = useDietMutations(selectedDate);

  // Map cravings
  const cravings = useMemo<CravingData[]>(() => {
    return cravingRows.map((c: any) => ({
      id: c.id,
      nameFr: c.name_fr,
      icon: c.icon,
      estimatedCalories: c.estimated_calories,
      category: c.category,
    }));
  }, [cravingRows]);

  // Map entries
  const entries = useMemo<FoodEntryData[]>(() => {
    return entryRows.map(toFoodEntryData);
  }, [entryRows]);

  // Map summary
  const summary = useMemo<{ today: DailySummaryData; avg7d: DailySummaryData } | null>(() => {
    const today = selectedDate;
    if (summaryRows.length === 0) {
      return {
        today: { date: today, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, entriesCount: 0 },
        avg7d: { date: today, totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, entriesCount: 0 },
      };
    }
    const s = summaryRows[0] as any;
    return {
      today: {
        date: s.date,
        totalCalories: parseFloat(s.total_calories || '0'),
        totalProtein: parseFloat(s.total_protein || '0'),
        totalCarbs: parseFloat(s.total_carbs || '0'),
        totalFat: parseFloat(s.total_fat || '0'),
        entriesCount: s.entries_count || 0,
      },
      avg7d: {
        date: s.date,
        totalCalories: Math.round(parseFloat(s.avg_7d_calories || '0')),
        totalProtein: Math.round(parseFloat(s.avg_7d_protein || '0')),
        totalCarbs: Math.round(parseFloat(s.avg_7d_carbs || '0')),
        totalFat: Math.round(parseFloat(s.avg_7d_fat || '0')),
        entriesCount: 0,
      },
    };
  }, [summaryRows]);

  // Map week/month history
  const weekHistory = useMemo(() => weekRows.map(toSummaryRow), [weekRows]);
  const monthHistory = useMemo(() => monthRows.map(toSummaryRow), [monthRows]);

  // Map profile (use latest measurement weight if available)
  const row = latestMeasurement[0] as any;
  const latestWeight = row?.weight ? parseFloat(row.weight) : null;

  const profile = useMemo<NutritionProfileData | null>(() => {
    if (profileRows.length === 0) return null;
    const p = profileRows[0] as any;
    const profileWeight = p.weight ? parseFloat(p.weight) : null;
    return {
      goal: p.goal,
      activityLevel: p.activity_level,
      height: p.height ? parseFloat(p.height) : null,
      weight: latestWeight ?? profileWeight,
      age: p.age,
      isMale: !!p.is_male,
      tdee: p.tdee,
      targetCalories: p.target_calories,
      targetProtein: p.target_protein,
      targetCarbs: p.target_carbs,
      targetFat: p.target_fat,
    };
  }, [profileRows, latestWeight]);

  // Workout calories
  const workoutCalories = useMemo(() => {
    return (workoutCalRows[0] as any)?.total || 0;
  }, [workoutCalRows]);

  // Map recent foods (deduplicated)
  const recentFoods = useMemo<FoodEntryData[]>(() => {
    const seen = new Set<string>();
    const unique: FoodEntryData[] = [];
    for (const e of recentRows as any[]) {
      const key = e.food_id || e.custom_name || e.id;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(toFoodEntryData(e));
      if (unique.length >= 10) break;
    }
    return unique;
  }, [recentRows]);

  // Handlers
  const handleOpenAddSheet = (mealType: MealType) => {
    setActiveMealType(mealType);
    setSheetOpen(true);
    triggerHaptic('light');
  };

  const handleSheetAction = (action: SheetAction) => {
    setSheetOpen(false);
    setView(action as View);
  };

  const handleQuickReAdd = async (entry: FoodEntryData) => {
    setSheetOpen(false);
    await mutations.addFoodEntry({
      foodId: entry.foodId ?? undefined,
      customName: entry.customName ?? undefined,
      mealType: activeMealType,
      quantity: parseFloat(entry.quantity) || 1,
      calories: entry.calories ? parseFloat(entry.calories) : undefined,
      protein: entry.protein ? parseFloat(entry.protein) : undefined,
      carbohydrates: entry.carbohydrates ? parseFloat(entry.carbohydrates) : undefined,
      fat: entry.fat ? parseFloat(entry.fat) : undefined,
    });
    triggerHaptic('medium');
  };

  const handleAddCraving = async (cravingId: string, mealType: MealType) => {
    const craving = cravings.find((c) => c.id === cravingId);
    if (!craving) return;
    await mutations.addFoodEntry({
      cravingId,
      customName: craving.nameFr,
      mealType,
      quantity: 1,
      calories: craving.estimatedCalories ?? undefined,
      isCheat: true,
    });
    triggerHaptic('medium');
    setView('main');
  };

  const handleAddFood = async (data: {
    foodId?: string;
    customName?: string;
    mealType?: string;
    quantity: number;
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    notes?: string;
  }) => {
    await mutations.addFoodEntry({ ...data, mealType: data.mealType || activeMealType });
    triggerHaptic('medium');
  };

  const handleSaveProfile = async (data: {
    goal: string;
    activityLevel: string;
    height: number;
    weight: number;
    age: number;
    isMale: boolean;
  }) => {
    // Calculate TDEE and macros (Mifflin-St Jeor)
    const MULTIPLIERS: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const ADJUSTMENTS: Record<string, number> = { bulk: 300, maintain: 0, cut: -400 };
    const bmr = data.isMale
      ? 10 * data.weight + 6.25 * data.height - 5 * data.age + 5
      : 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;
    const tdee = Math.round(bmr * (MULTIPLIERS[data.activityLevel] || 1.55));
    const targetCalories = Math.round(tdee + (ADJUSTMENTS[data.goal] || 0));
    const proteinRatio = data.goal === 'bulk' ? 2.0 : data.goal === 'cut' ? 2.2 : 1.8;
    const fatRatio = data.goal === 'maintain' ? 0.28 : 0.25;
    const targetProtein = Math.round(data.weight * proteinRatio);
    const targetFat = Math.round((targetCalories * fatRatio) / 9);
    const targetCarbs = Math.max(0, Math.round((targetCalories - targetProtein * 4 - targetFat * 9) / 4));

    await mutations.saveNutritionProfile({ ...data, tdee, targetCalories, targetProtein, targetCarbs, targetFat });
    setSettingsOpen(false);
  };

  const handleDelete = async (id: string) => {
    await mutations.deleteEntry(id);
  };

  const handleBackToMain = () => setView('main');

  if (entriesLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: surfaceBg(t),
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: tc.h(t), letterSpacing: '-0.02em' }}>
          Journal
        </Typography>
      </Box>

      {/* Views */}
      {view === 'main' && (
        <MainView
          segment={segment}
          onSegmentChange={setSegment}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          summary={summary}
          entries={entries}
          weekHistory={weekHistory}
          monthHistory={monthHistory}
          profile={profile}
          workoutCalories={workoutCalories}
          onOpenAddSheet={handleOpenAddSheet}
          onOpenSettings={() => setSettingsOpen(true)}
          onDeleteEntry={handleDelete}
        />
      )}

      {view === 'cravings' && (
        <CravingsView
          cravings={cravings}
          mealType={activeMealType}
          onSelect={handleAddCraving}
          onClose={handleBackToMain}
        />
      )}

      {view === 'search' && (
        <SearchView
          mealType={activeMealType}
          onAdd={handleAddFood}
          onClose={handleBackToMain}
        />
      )}

      {view === 'scanner' && (
        <ScannerView
          mealType={activeMealType}
          onAdd={handleAddFood}
          onClose={handleBackToMain}
          onSwitchToSearch={() => setView('search')}
        />
      )}

      {view === 'photo' && (
        <PhotoAIView
          mealType={activeMealType}
          onDone={async () => setView('main')}
          onClose={handleBackToMain}
        />
      )}

      {/* Settings overlay */}
      <SettingsSheet
        open={settingsOpen}
        profile={profile}
        onSave={handleSaveProfile}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Bottom Sheet */}
      <AddEntryBottomSheet
        open={sheetOpen}
        mealType={activeMealType}
        recentFoods={recentFoods}
        onClose={() => setSheetOpen(false)}
        onSelectAction={handleSheetAction}
        onQuickReAdd={handleQuickReAdd}
      />

      {/* Bottom Nav */}
      <BottomNav />
    </Box>
  );
}

// ─── Settings Bottom Sheet ──────────────────────────────────────────

function SettingsSheet({
  open,
  profile,
  onSave,
  onClose,
}: {
  open: boolean;
  profile: Parameters<typeof SettingsView>[0]['profile'];
  onSave: Parameters<typeof SettingsView>[0]['onSave'];
  onClose: () => void;
}) {
  const { t, d } = useThemeTokens();

  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.width = '100%';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.position = '';
      body.style.inset = '';
      body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.4)',
          zIndex: 1300,
          backdropFilter: 'blur(4px)',
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          top: 48,
          zIndex: 1301,
          borderRadius: '20px 20px 0 0',
          maxWidth: 500,
          mx: 'auto',
          bgcolor: panelBg(t),
          display: 'flex',
          flexDirection: 'column',
          animation: 'settings-slide-up 0.3s ease-out',
          '@keyframes settings-slide-up': {
            from: { transform: 'translateY(100%)' },
            to: { transform: 'translateY(0)' },
          },
        }}
      >
        {/* Drag handle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
          <Box sx={{
            width: 36,
            height: 4,
            borderRadius: 2,
            bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          }} />
        </Box>
        <SettingsView profile={profile} onSave={onSave} onClose={onClose} />
      </Box>
    </>
  );
}
