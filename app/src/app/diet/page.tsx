'use client';

import { useState, useEffect } from 'react';
import {
  getCravings,
  searchFoods,
  getTodayEntries,
  getDailySummary,
  addCravingEntry,
  addFoodEntry,
  addQuickEntry,
  deleteEntry,
  getWeekHistory,
  getNutritionProfile,
  saveNutritionProfile,
  type CravingData,
  type FoodData,
  type FoodEntryData,
  type DailySummaryData,
  type NutritionProfileData,
  type NutritionGoal,
  type ActivityLevel,
} from './actions';
import { getTodayWorkoutCalories } from '../workout/actions';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Settings from '@mui/icons-material/Settings';
import Search from '@mui/icons-material/Search';
import Close from '@mui/icons-material/Close';

type View = 'main' | 'cravings' | 'search' | 'quick' | 'settings';

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
};

export default function DietPage() {
  const [view, setView] = useState<View>('main');
  const [cravings, setCravings] = useState<CravingData[]>([]);
  const [entries, setEntries] = useState<FoodEntryData[]>([]);
  const [summary, setSummary] = useState<{ today: DailySummaryData; avg7d: DailySummaryData } | null>(null);
  const [weekHistory, setWeekHistory] = useState<DailySummaryData[]>([]);
  const [profile, setProfile] = useState<NutritionProfileData | null>(null);
  const [workoutCalories, setWorkoutCalories] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [cravingsData, entriesData, summaryData, historyData, profileData, workoutCal] = await Promise.all([
      getCravings(),
      getTodayEntries(),
      getDailySummary(),
      getWeekHistory(),
      getNutritionProfile(),
      getTodayWorkoutCalories(),
    ]);
    setCravings(cravingsData);
    setEntries(entriesData);
    setSummary(summaryData);
    setWeekHistory(historyData);
    setProfile(profileData);
    setWorkoutCalories(workoutCal);
    setIsLoading(false);
  };

  const handleSaveProfile = async (data: Parameters<typeof saveNutritionProfile>[0]) => {
    const newProfile = await saveNutritionProfile(data);
    setProfile(newProfile);
    setView('main');
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCraving = async (cravingId: string) => {
    await addCravingEntry(cravingId);
    await loadData();
    setView('main');
  };

  const handleAddFood = async (data: Parameters<typeof addFoodEntry>[0]) => {
    await addFoodEntry(data);
    await loadData();
    setView('main');
  };

  const handleAddQuick = async (name: string, calories: number) => {
    await addQuickEntry(name, calories);
    await loadData();
    setView('main');
  };

  const handleDelete = async (id: string) => {
    await deleteEntry(id);
    await loadData();
  };

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            component={Link}
            href="/"
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              textDecoration: 'none',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Nutrition
          </Typography>
          <Box
            onClick={() => {
              triggerHaptic('light');
              setView('settings');
            }}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <Settings sx={{ fontSize: 22 }} />
          </Box>
        </Stack>
      </Box>

      {view === 'main' && (
        <MainView
          summary={summary}
          entries={entries}
          weekHistory={weekHistory}
          profile={profile}
          workoutCalories={workoutCalories}
          onOpenCravings={() => setView('cravings')}
          onOpenSearch={() => setView('search')}
          onOpenQuick={() => setView('quick')}
          onOpenSettings={() => setView('settings')}
          onDelete={handleDelete}
        />
      )}

      {view === 'cravings' && (
        <CravingsView
          cravings={cravings}
          onSelect={handleAddCraving}
          onClose={() => setView('main')}
        />
      )}

      {view === 'search' && (
        <SearchView
          onAdd={handleAddFood}
          onClose={() => setView('main')}
        />
      )}

      {view === 'quick' && (
        <QuickEntryView
          onAdd={handleAddQuick}
          onClose={() => setView('main')}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setView('main')}
        />
      )}
    </Box>
  );
}

// Main View
function MainView({
  summary,
  entries,
  weekHistory,
  profile,
  workoutCalories,
  onOpenCravings,
  onOpenSearch,
  onOpenQuick,
  onOpenSettings,
  onDelete,
}: {
  summary: { today: DailySummaryData; avg7d: DailySummaryData } | null;
  entries: FoodEntryData[];
  weekHistory: DailySummaryData[];
  profile: NutritionProfileData | null;
  workoutCalories: number;
  onOpenCravings: () => void;
  onOpenSearch: () => void;
  onOpenQuick: () => void;
  onOpenSettings: () => void;
  onDelete: (id: string) => void;
}) {
  const goalLabels: Record<NutritionGoal, string> = {
    bulk: 'Prise de masse',
    maintain: 'Maintenance',
    cut: 'Sèche',
  };

  const adjustedTarget = profile?.targetCalories
    ? profile.targetCalories + workoutCalories
    : null;

  return (
    <Box sx={{ flex: 1, p: 2, pb: 12 }}>
      <Stack spacing={3}>
        {/* Quick Actions */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          <Card
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(233,30,99,0.2) 0%, rgba(255,152,0,0.15) 100%)'
                : 'linear-gradient(135deg, rgba(233,30,99,0.15) 0%, rgba(255,152,0,0.1) 100%)',
              border: 1,
              borderColor: 'rgba(233,30,99,0.3)',
            }}
          >
            <CardActionArea onClick={onOpenCravings} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>🍕</Typography>
              <Typography variant="caption">J&apos;ai envie de...</Typography>
            </CardActionArea>
          </Card>
          <Card>
            <CardActionArea onClick={onOpenSearch} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>🔍</Typography>
              <Typography variant="caption">Chercher</Typography>
            </CardActionArea>
          </Card>
          <Card>
            <CardActionArea onClick={onOpenQuick} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>⚡</Typography>
              <Typography variant="caption">Rapide</Typography>
            </CardActionArea>
          </Card>
        </Box>

        {/* No profile configured */}
        {!profile && (
          <Card
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
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
                  <Typography variant="subtitle2" fontWeight={600}>Configure ton profil</Typography>
                  <Typography variant="caption" color="text.secondary">
                    On calcule tes besoins pour t&apos;aider à atteindre ton objectif
                  </Typography>
                </Box>
              </Stack>
            </CardActionArea>
          </Card>
        )}

        {/* 7-Day Average */}
        {summary && summary.avg7d.totalCalories > 0 && (
          <Card
            sx={{
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.15) 100%)'
                : 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,182,212,0.1) 100%)',
              border: 1,
              borderColor: 'success.main',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography variant="h6">📊</Typography>
                  <Typography variant="subtitle1" fontWeight={600}>Moyenne 7 jours</Typography>
                </Stack>
                {profile && (
                  <Chip
                    label={goalLabels[profile.goal]}
                    size="small"
                    color="success"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
              <Typography variant="h4" fontWeight={700} color="success.main" sx={{ mb: 0.5 }}>
                {Math.round(summary.avg7d.totalCalories)} kcal
              </Typography>
              {profile && profile.targetCalories && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Objectif : ~{profile.targetCalories} kcal/jour en moyenne
                </Typography>
              )}
              {!profile && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  C&apos;est ta vraie consommation. Les écarts d&apos;un jour ne comptent pas.
                </Typography>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Protéines</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {Math.round(summary.avg7d.totalProtein)}g
                    {profile?.targetProtein && (
                      <Typography component="span" variant="caption" color="text.secondary"> / {profile.targetProtein}g</Typography>
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Glucides</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {Math.round(summary.avg7d.totalCarbs)}g
                    {profile?.targetCarbs && (
                      <Typography component="span" variant="caption" color="text.secondary"> / {profile.targetCarbs}g</Typography>
                    )}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Lipides</Typography>
                  <Typography variant="body2" fontWeight={500}>
                    {Math.round(summary.avg7d.totalFat)}g
                    {profile?.targetFat && (
                      <Typography component="span" variant="caption" color="text.secondary"> / {profile.targetFat}g</Typography>
                    )}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Today's Summary */}
        {summary && (
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Aujourd&apos;hui</Typography>
                {workoutCalories > 0 && (
                  <Chip
                    label={`🏋️ +${workoutCalories} kcal brûlées`}
                    size="small"
                    color="warning"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mb: 1 }}>
                <Typography variant="h4" fontWeight={700}>
                  {Math.round(summary.today.totalCalories)}
                </Typography>
                <Typography color="text.secondary">kcal</Typography>
                {adjustedTarget && (
                  <Typography variant="body2" color="text.secondary">/ {adjustedTarget}</Typography>
                )}
              </Stack>
              {workoutCalories > 0 && profile?.targetCalories && (
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Objectif ajusté : {profile.targetCalories} + {workoutCalories} (workout) = {adjustedTarget} kcal
                </Typography>
              )}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
                <MacroBar label="P" value={summary.today.totalProtein} color="info" />
                <MacroBar label="G" value={summary.today.totalCarbs} color="warning" />
                <MacroBar label="L" value={summary.today.totalFat} color="error" />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Week Chart */}
        {weekHistory.length > 1 && (
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Cette semaine</Typography>
              <WeekChart data={weekHistory} />
            </CardContent>
          </Card>
        )}

        {/* Today's Entries */}
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Journal du jour ({entries.length} entrées)
          </Typography>
          {entries.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">Rien de loggé aujourd&apos;hui</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Et c&apos;est OK 😊</Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {entries.map((entry) => (
                <EntryCard key={entry.id} entry={entry} onDelete={() => onDelete(entry.id)} />
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function MacroBar({ label, value, color }: { label: string; value: number; color: 'info' | 'warning' | 'error' }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption">{Math.round(value)}g</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={Math.min((value / 100) * 100, 100)}
        color={color}
        sx={{ height: 6, borderRadius: 3 }}
      />
    </Box>
  );
}

function WeekChart({ data }: { data: DailySummaryData[] }) {
  const maxCal = Math.max(...data.map((d) => d.totalCalories), 1);

  return (
    <Stack direction="row" spacing={0.5} sx={{ height: 96, alignItems: 'flex-end' }}>
      {data.map((day, i) => {
        const height = (day.totalCalories / maxCal) * 100;
        const dayName = new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' });

        return (
          <Box key={i} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <Box
                sx={{
                  width: '100%',
                  bgcolor: 'primary.main',
                  opacity: 0.6,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  height: `${height}%`,
                  transition: 'height 0.3s ease',
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', textTransform: 'capitalize' }}>
              {dayName}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

function EntryCard({ entry, onDelete }: { entry: FoodEntryData; onDelete: () => void }) {
  const time = new Date(entry.loggedAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const getIcon = () => {
    if (entry.isCheat) return '🍕';
    if (entry.mealType === 'breakfast') return '🌅';
    if (entry.mealType === 'lunch') return '☀️';
    if (entry.mealType === 'dinner') return '🌙';
    return '🍎';
  };

  return (
    <Card>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="h6">{getIcon()}</Typography>
            <Box>
              <Typography variant="body2" fontWeight={500}>{entry.customName || 'Aliment'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {time} • {entry.calories ? `${Math.round(parseFloat(entry.calories))} kcal` : '--'}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" onClick={onDelete} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}

// Cravings View
function CravingsView({
  cravings,
  onSelect,
  onClose,
}: {
  cravings: CravingData[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const byCategory = cravings.reduce((acc, c) => {
    const cat = c.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(c);
    return acc;
  }, {} as Record<string, CravingData[]>);

  const categoryLabels: Record<string, string> = {
    fast_food: '🍔 Fast Food',
    dessert: '🍰 Desserts',
    snack: '🍿 Snacks',
    drink: '🍺 Boissons',
    restaurant: '🍽️ Restaurant',
    event: '🎉 Events',
    breakfast: '🥐 Petit-déj',
    other: '📦 Autre',
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            J&apos;ai envie de...
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', pb: 1 }}>
          Pas de jugement. Log ce que tu manges vraiment.
        </Typography>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={3}>
          {Object.entries(byCategory).map(([category, items]) => (
            <Box key={category}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                {categoryLabels[category] || category}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                {items.map((craving) => (
                  <Card key={craving.id}>
                    <CardActionArea onClick={() => onSelect(craving.id)} sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>{craving.icon || '🍽️'}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>{craving.nameFr}</Typography>
                      {craving.estimatedCalories && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                          ~{craving.estimatedCalories} kcal
                        </Typography>
                      )}
                    </CardActionArea>
                  </Card>
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

// Search View
function SearchView({
  onAdd,
  onClose,
}: {
  onAdd: (data: Parameters<typeof addFoodEntry>[0]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodData[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodData | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState('snack');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchFoods(query);
      setResults(data);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAdd = () => {
    if (!selectedFood) return;
    onAdd({
      foodId: selectedFood.id,
      mealType,
      quantity: parseFloat(quantity),
    });
  };

  if (selectedFood) {
    const multiplier = parseFloat(quantity) / 100;
    const calories = selectedFood.calories ? parseFloat(selectedFood.calories) * multiplier : 0;

    return (
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => setSelectedFood(null)}
          sx={{ alignSelf: 'flex-start', mb: 2, color: 'text.secondary' }}
        >
          Retour
        </Button>

        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>{selectedFood.nameFr}</Typography>
        {selectedFood.brand && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{selectedFood.brand}</Typography>
        )}

        <Stack spacing={3} sx={{ flex: 1 }}>
          <TextField
            label="Quantité (g)"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            fullWidth
          />

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Repas</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
              {[
                { value: 'breakfast', label: '🌅 Petit-déj' },
                { value: 'lunch', label: '☀️ Déjeuner' },
                { value: 'dinner', label: '🌙 Dîner' },
                { value: 'snack', label: '🍎 Snack' },
              ].map((meal) => (
                <Chip
                  key={meal.value}
                  label={meal.label}
                  onClick={() => setMealType(meal.value)}
                  color={mealType === meal.value ? 'primary' : 'default'}
                  variant={mealType === meal.value ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ fontSize: '0.7rem' }}
                />
              ))}
            </Box>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>{Math.round(calories)} kcal</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Protéines</Typography>
                  <Typography variant="body2">{selectedFood.protein ? Math.round(parseFloat(selectedFood.protein) * multiplier) : 0}g</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Glucides</Typography>
                  <Typography variant="body2">{selectedFood.carbohydrates ? Math.round(parseFloat(selectedFood.carbohydrates) * multiplier) : 0}g</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Lipides</Typography>
                  <Typography variant="body2">{selectedFood.fat ? Math.round(parseFloat(selectedFood.fat) * multiplier) : 0}g</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Stack>

        <Box
          onClick={handleAdd}
          sx={{
            mt: 2,
            py: 1.5,
            textAlign: 'center',
            bgcolor: 'text.primary',
            color: 'background.default',
            borderRadius: 2,
            fontWeight: 600,
            cursor: 'pointer',
            '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
          }}
        >
          Ajouter
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Rechercher un aliment
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
        <TextField
          fullWidth
          placeholder="Ex: poulet, riz, pomme..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="small"
          autoFocus
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {isSearching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : results.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            {query.length >= 2 ? 'Aucun résultat' : 'Tape au moins 2 caractères'}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {results.map((food) => (
              <Card key={food.id}>
                <CardActionArea onClick={() => setSelectedFood(food)} sx={{ p: 2 }}>
                  <Typography variant="body2" fontWeight={500}>{food.nameFr}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {food.calories ? `${food.calories} kcal/100g` : ''} {food.brand ? `• ${food.brand}` : ''}
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

// Quick Entry View
function QuickEntryView({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, calories: number) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const handleSubmit = () => {
    if (!name || !calories) return;
    onAdd(name, parseInt(calories));
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Entrée rapide
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, px: 2 }}>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Tu sais pas exactement ce que tu manges ? Pas grave. Estime juste.
      </Typography>

      <Stack spacing={3} sx={{ flex: 1 }}>
        <TextField
          label="C'est quoi ?"
          placeholder="Ex: sandwich, plat du resto..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          autoFocus
        />

        <TextField
          label="Environ combien de calories ?"
          type="number"
          placeholder="500"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          fullWidth
        />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Estimations rapides
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {[
              { label: 'Petit repas', cal: 400 },
              { label: 'Repas moyen', cal: 600 },
              { label: 'Gros repas', cal: 900 },
              { label: 'Snack', cal: 200 },
            ].map((est) => (
              <Chip
                key={est.label}
                label={`${est.label} (~${est.cal})`}
                onClick={() => setCalories(est.cal.toString())}
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>
      </Stack>

      <Box
        onClick={handleSubmit}
        sx={{
          py: 1.5,
          textAlign: 'center',
          bgcolor: !name || !calories ? 'action.disabled' : 'text.primary',
          color: 'background.default',
          borderRadius: 2,
          fontWeight: 600,
          cursor: !name || !calories ? 'default' : 'pointer',
          '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
        }}
      >
        Ajouter
      </Box>
      </Box>
    </Box>
  );
}

// Settings View
function SettingsView({
  profile,
  onSave,
  onClose,
}: {
  profile: NutritionProfileData | null;
  onSave: (data: {
    goal: NutritionGoal;
    activityLevel: ActivityLevel;
    height: number;
    weight: number;
    age: number;
    isMale: boolean;
  }) => void;
  onClose: () => void;
}) {
  const [goal, setGoal] = useState<NutritionGoal>(profile?.goal || 'maintain');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile?.activityLevel || 'moderate');
  const [height, setHeight] = useState(profile?.height?.toString() || '');
  const [weight, setWeight] = useState(profile?.weight?.toString() || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [isMale, setIsMale] = useState(profile?.isMale ?? true);

  const goals: { value: NutritionGoal; label: string; emoji: string; desc: string }[] = [
    { value: 'bulk', label: 'Prise de masse', emoji: '💪', desc: '+300 kcal' },
    { value: 'maintain', label: 'Maintenance', emoji: '⚖️', desc: 'Équilibre' },
    { value: 'cut', label: 'Sèche', emoji: '🔥', desc: '-400 kcal' },
  ];

  const activityLevels: { value: ActivityLevel; label: string; desc: string }[] = [
    { value: 'sedentary', label: 'Sédentaire', desc: 'Travail de bureau' },
    { value: 'light', label: 'Légèrement actif', desc: '1-2x sport/sem' },
    { value: 'moderate', label: 'Modérément actif', desc: '3-4x sport/sem' },
    { value: 'active', label: 'Actif', desc: '5-6x sport/sem' },
    { value: 'very_active', label: 'Très actif', desc: '2x/jour ou physique' },
  ];

  const isValid = height && weight && age;

  const handleSave = () => {
    if (!isValid) return;
    onSave({
      goal,
      activityLevel,
      height: parseFloat(height),
      weight: parseFloat(weight),
      age: parseInt(age),
      isMale,
    });
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <ArrowBack sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Mon profil nutrition
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Stack spacing={3}>
          {/* Goal Selection */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Mon objectif</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
              {goals.map((g) => (
                <Card
                  key={g.value}
                  sx={{
                    ...(goal === g.value && {
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                    }),
                  }}
                >
                  <CardActionArea onClick={() => setGoal(g.value)} sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>{g.emoji}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>{g.label}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>{g.desc}</Typography>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Basic Info */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Mes infos</Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <Button
                  fullWidth
                  variant={isMale ? 'contained' : 'outlined'}
                  onClick={() => setIsMale(true)}
                  sx={{ ...(isMale && { bgcolor: 'info.main' }) }}
                >
                  Homme
                </Button>
                <Button
                  fullWidth
                  variant={!isMale ? 'contained' : 'outlined'}
                  onClick={() => setIsMale(false)}
                  sx={{ ...(!isMale && { bgcolor: 'secondary.main' }) }}
                >
                  Femme
                </Button>
              </Stack>

              <Stack direction="row" spacing={2}>
                <TextField
                  label="Âge"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{ inputProps: { style: { textAlign: 'center' } } }}
                />
                <TextField
                  label="Taille (cm)"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{ inputProps: { style: { textAlign: 'center' } } }}
                />
                <TextField
                  label="Poids (kg)"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  size="small"
                  fullWidth
                  InputProps={{ inputProps: { style: { textAlign: 'center' } } }}
                />
              </Stack>
            </Stack>
          </Box>

          {/* Activity Level */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Niveau d&apos;activité</Typography>
            <Stack spacing={1}>
              {activityLevels.map((level) => (
                <Card
                  key={level.value}
                  sx={{
                    ...(activityLevel === level.value && {
                      bgcolor: 'rgba(103,80,164,0.15)',
                      border: 1,
                      borderColor: 'primary.main',
                    }),
                  }}
                >
                  <CardActionArea onClick={() => setActivityLevel(level.value)} sx={{ p: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>{level.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{level.desc}</Typography>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Info note */}
          <Card sx={{ bgcolor: 'action.hover' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Ces infos servent à estimer tes besoins. C&apos;est une base de départ, pas un objectif strict.
                Ce qui compte vraiment, c&apos;est ta moyenne sur 7 jours.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box
          onClick={handleSave}
          sx={{
            py: 1.5,
            textAlign: 'center',
            bgcolor: !isValid ? 'action.disabled' : 'text.primary',
            color: 'background.default',
            borderRadius: 2,
            fontWeight: 600,
            cursor: !isValid ? 'default' : 'pointer',
            '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
          }}
        >
          Enregistrer
        </Box>
      </Box>
    </Box>
  );
}
