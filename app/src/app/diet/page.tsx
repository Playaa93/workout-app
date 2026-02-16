'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getCravings,
  getTodayEntries,
  getDailySummary,
  addCravingEntry,
  addFoodEntry,
  addQuickEntry,
  deleteEntry,
  getWeekHistory,
  getNutritionProfile,
  saveNutritionProfile,
  getRecentFoods,
  type CravingData,
  type FoodEntryData,
  type DailySummaryData,
  type NutritionProfileData,
} from './actions';
import { getTodayWorkoutCalories } from '../workout/actions';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Settings from '@mui/icons-material/Settings';
import { triggerHaptic } from './components/shared';
import type { MealType } from './components/shared';
import type { Segment } from './components/SegmentedControl';
import type { SheetAction } from './components/AddEntryBottomSheet';
import MainView from './components/MainView';
import CravingsView from './components/CravingsView';
import SearchView from './components/SearchView';
import QuickEntryView from './components/QuickEntryView';
import SettingsView from './components/SettingsView';
import ScannerView from './components/ScannerView';
import PhotoAIView from './components/PhotoAIView';
import AddEntryBottomSheet from './components/AddEntryBottomSheet';
import BottomNav from './components/BottomNav';

type View = 'main' | 'cravings' | 'search' | 'quick' | 'settings' | 'scanner' | 'photo';

export default function DietPage() {
  const [view, setView] = useState<View>('main');
  const [segment, setSegment] = useState<Segment>('today');
  const [cravings, setCravings] = useState<CravingData[]>([]);
  const [entries, setEntries] = useState<FoodEntryData[]>([]);
  const [summary, setSummary] = useState<{ today: DailySummaryData; avg7d: DailySummaryData } | null>(null);
  const [weekHistory, setWeekHistory] = useState<DailySummaryData[]>([]);
  const [profile, setProfile] = useState<NutritionProfileData | null>(null);
  const [workoutCalories, setWorkoutCalories] = useState<number>(0);
  const [recentFoods, setRecentFoods] = useState<FoodEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bottom sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('snack');

  const loadData = useCallback(async () => {
    const [cravingsData, entriesData, summaryData, historyData, profileData, workoutCal, recent] =
      await Promise.all([
        getCravings(),
        getTodayEntries(),
        getDailySummary(),
        getWeekHistory(),
        getNutritionProfile(),
        getTodayWorkoutCalories(),
        getRecentFoods(10),
      ]);
    setCravings(cravingsData);
    setEntries(entriesData);
    setSummary(summaryData);
    setWeekHistory(historyData);
    setProfile(profileData);
    setWorkoutCalories(workoutCal);
    setRecentFoods(recent);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleOpenAddSheet = (mealType: MealType) => {
    setActiveMealType(mealType);
    setSheetOpen(true);
    triggerHaptic('light');
  };

  const handleSheetAction = (action: SheetAction) => {
    setSheetOpen(false);
    switch (action) {
      case 'search':
        setView('search');
        break;
      case 'scanner':
        setView('scanner');
        break;
      case 'photo':
        setView('photo');
        break;
      case 'quick':
        setView('quick');
        break;
      case 'cravings':
        setView('cravings');
        break;
    }
  };

  const handleQuickReAdd = async (entry: FoodEntryData) => {
    setSheetOpen(false);
    await addFoodEntry({
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
    await loadData();
  };

  const handleAddCraving = async (cravingId: string, mealType: MealType) => {
    await addCravingEntry(cravingId, undefined, mealType);
    triggerHaptic('medium');
    await loadData();
    setView('main');
  };

  const handleAddFood = async (data: Parameters<typeof addFoodEntry>[0]) => {
    await addFoodEntry({ ...data, mealType: data.mealType || activeMealType });
    triggerHaptic('medium');
    await loadData();
    setView('main');
  };

  const handleAddQuick = async (name: string, calories: number, mealType: string) => {
    await addQuickEntry(name, calories, mealType);
    triggerHaptic('medium');
    await loadData();
    setView('main');
  };

  const handleSaveProfile = async (data: Parameters<typeof saveNutritionProfile>[0]) => {
    const newProfile = await saveNutritionProfile(data);
    setProfile(newProfile);
    setView('main');
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    await loadData();
  };

  const handleBackToMain = () => setView('main');

  if (isLoading) {
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
        bgcolor: 'background.default',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1,
          background: 'linear-gradient(180deg, rgba(103,80,164,0.08) 0%, transparent 100%)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
            Journal
          </Typography>
          <IconButton
            size="small"
            onClick={() => {
              triggerHaptic('light');
              setView('settings');
            }}
            sx={{ color: 'text.secondary' }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      {/* Views */}
      {view === 'main' && (
        <MainView
          segment={segment}
          onSegmentChange={setSegment}
          summary={summary}
          entries={entries}
          weekHistory={weekHistory}
          profile={profile}
          workoutCalories={workoutCalories}
          onOpenAddSheet={handleOpenAddSheet}
          onOpenSettings={() => setView('settings')}
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

      {view === 'quick' && (
        <QuickEntryView
          mealType={activeMealType}
          onAdd={handleAddQuick}
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
          onDone={async () => {
            await loadData();
            setView('main');
          }}
          onClose={handleBackToMain}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          profile={profile}
          onSave={handleSaveProfile}
          onClose={handleBackToMain}
        />
      )}

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
      <BottomNav active="journal" />
    </Box>
  );
}
