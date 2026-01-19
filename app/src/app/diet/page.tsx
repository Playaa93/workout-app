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
  type CravingData,
  type FoodData,
  type FoodEntryData,
  type DailySummaryData,
} from './actions';

type View = 'main' | 'cravings' | 'search' | 'quick';

export default function DietPage() {
  const [view, setView] = useState<View>('main');
  const [cravings, setCravings] = useState<CravingData[]>([]);
  const [entries, setEntries] = useState<FoodEntryData[]>([]);
  const [summary, setSummary] = useState<{ today: DailySummaryData; avg7d: DailySummaryData } | null>(null);
  const [weekHistory, setWeekHistory] = useState<DailySummaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    const [cravingsData, entriesData, summaryData, historyData] = await Promise.all([
      getCravings(),
      getTodayEntries(),
      getDailySummary(),
      getWeekHistory(),
    ]);
    setCravings(cravingsData);
    setEntries(entriesData);
    setSummary(summaryData);
    setWeekHistory(historyData);
    setIsLoading(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 border-b border-neutral-800 flex items-center gap-4">
        <a href="/" className="text-neutral-400 hover:text-white transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </a>
        <h1 className="text-lg font-semibold">Nutrition</h1>
      </header>

      {view === 'main' && (
        <MainView
          summary={summary}
          entries={entries}
          weekHistory={weekHistory}
          onOpenCravings={() => setView('cravings')}
          onOpenSearch={() => setView('search')}
          onOpenQuick={() => setView('quick')}
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
    </main>
  );
}

// Main View
function MainView({
  summary,
  entries,
  weekHistory,
  onOpenCravings,
  onOpenSearch,
  onOpenQuick,
  onDelete,
}: {
  summary: { today: DailySummaryData; avg7d: DailySummaryData } | null;
  entries: FoodEntryData[];
  weekHistory: DailySummaryData[];
  onOpenCravings: () => void;
  onOpenSearch: () => void;
  onOpenQuick: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex-1 p-4 pb-24 space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onOpenCravings}
          className="p-4 bg-gradient-to-br from-pink-600/30 to-orange-600/30 rounded-xl border border-pink-500/30 hover:border-pink-500/50 transition-colors"
        >
          <span className="text-2xl block mb-1">🍕</span>
          <span className="text-sm">J'ai envie de...</span>
        </button>
        <button
          onClick={onOpenSearch}
          className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
        >
          <span className="text-2xl block mb-1">🔍</span>
          <span className="text-sm">Chercher</span>
        </button>
        <button
          onClick={onOpenQuick}
          className="p-4 bg-neutral-900 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors"
        >
          <span className="text-2xl block mb-1">⚡</span>
          <span className="text-sm">Rapide</span>
        </button>
      </div>

      {/* 7-Day Average - The "invisible" tracking */}
      {summary && summary.avg7d.totalCalories > 0 && (
        <div className="p-4 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">📊</span>
            <h3 className="font-semibold">Moyenne 7 jours</h3>
          </div>
          <p className="text-3xl font-bold text-emerald-400 mb-1">
            {Math.round(summary.avg7d.totalCalories)} kcal
          </p>
          <p className="text-sm text-neutral-400">
            C'est ta vraie consommation. Les écarts d'un jour ne comptent pas.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <p className="text-neutral-500">Protéines</p>
              <p className="font-medium">{Math.round(summary.avg7d.totalProtein)}g</p>
            </div>
            <div>
              <p className="text-neutral-500">Glucides</p>
              <p className="font-medium">{Math.round(summary.avg7d.totalCarbs)}g</p>
            </div>
            <div>
              <p className="text-neutral-500">Lipides</p>
              <p className="font-medium">{Math.round(summary.avg7d.totalFat)}g</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Summary */}
      {summary && (
        <div className="p-4 bg-neutral-900 rounded-xl">
          <h3 className="text-sm text-neutral-400 mb-3">Aujourd'hui</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-bold">
              {Math.round(summary.today.totalCalories)}
            </span>
            <span className="text-neutral-400">kcal</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <MacroBar label="P" value={summary.today.totalProtein} color="bg-blue-500" />
            <MacroBar label="G" value={summary.today.totalCarbs} color="bg-amber-500" />
            <MacroBar label="L" value={summary.today.totalFat} color="bg-pink-500" />
          </div>
        </div>
      )}

      {/* Week Chart */}
      {weekHistory.length > 1 && (
        <div className="p-4 bg-neutral-900 rounded-xl">
          <h3 className="text-sm text-neutral-400 mb-4">Cette semaine</h3>
          <WeekChart data={weekHistory} />
        </div>
      )}

      {/* Today's Entries */}
      <div>
        <h3 className="text-sm text-neutral-400 mb-3">
          Journal du jour ({entries.length} entrées)
        </h3>
        {entries.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>Rien de loggé aujourd'hui</p>
            <p className="text-sm mt-1">Et c'est OK 😊</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} onDelete={() => onDelete(entry.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MacroBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-neutral-500">{label}</span>
        <span>{Math.round(value)}g</span>
      </div>
      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min((value / 100) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}

function WeekChart({ data }: { data: DailySummaryData[] }) {
  const maxCal = Math.max(...data.map((d) => d.totalCalories), 1);

  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((day, i) => {
        const height = (day.totalCalories / maxCal) * 100;
        const dayName = new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' });

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full bg-violet-500/50 rounded-t transition-all"
                style={{ height: `${height}%` }}
              />
            </div>
            <span className="text-[10px] text-neutral-500 capitalize">{dayName}</span>
          </div>
        );
      })}
    </div>
  );
}

function EntryCard({ entry, onDelete }: { entry: FoodEntryData; onDelete: () => void }) {
  const time = new Date(entry.loggedAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-3 bg-neutral-900 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-xl">
          {entry.isCheat ? '🍕' : entry.mealType === 'breakfast' ? '🌅' : entry.mealType === 'lunch' ? '☀️' : entry.mealType === 'dinner' ? '🌙' : '🍎'}
        </span>
        <div>
          <p className="font-medium">{entry.customName || 'Aliment'}</p>
          <p className="text-sm text-neutral-400">
            {time} • {entry.calories ? `${Math.round(parseFloat(entry.calories))} kcal` : '--'}
          </p>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Cravings View - "J'ai envie de..."
function CravingsView({
  cravings,
  onSelect,
  onClose,
}: {
  cravings: CravingData[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  // Group by category
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
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-bold">J'ai envie de...</h2>
        </div>
        <p className="text-neutral-400 text-sm">
          Pas de jugement. Log ce que tu manges vraiment.
        </p>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(byCategory).map(([category, items]) => (
          <div key={category}>
            <h3 className="text-sm text-neutral-400 mb-3">
              {categoryLabels[category] || category}
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {items.map((craving) => (
                <button
                  key={craving.id}
                  onClick={() => onSelect(craving.id)}
                  className="p-3 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors text-center"
                >
                  <span className="text-2xl block mb-1">{craving.icon || '🍽️'}</span>
                  <span className="text-xs">{craving.nameFr}</span>
                  {craving.estimatedCalories && (
                    <span className="text-[10px] text-neutral-500 block">
                      ~{craving.estimatedCalories} kcal
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
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
      <div className="flex-1 flex flex-col p-4">
        <button onClick={() => setSelectedFood(null)} className="text-neutral-400 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Retour
        </button>

        <h2 className="text-xl font-bold mb-2">{selectedFood.nameFr}</h2>
        {selectedFood.brand && (
          <p className="text-neutral-400 text-sm mb-4">{selectedFood.brand}</p>
        )}

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Quantité (g)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-900 rounded-xl"
            />
          </div>

          <div>
            <label className="text-sm text-neutral-400 mb-2 block">Repas</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'breakfast', label: '🌅 Petit-déj' },
                { value: 'lunch', label: '☀️ Déjeuner' },
                { value: 'dinner', label: '🌙 Dîner' },
                { value: 'snack', label: '🍎 Snack' },
              ].map((meal) => (
                <button
                  key={meal.value}
                  onClick={() => setMealType(meal.value)}
                  className={`p-2 rounded-lg text-xs transition-colors ${
                    mealType === meal.value
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {meal.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-neutral-900 rounded-xl">
            <p className="text-2xl font-bold mb-2">{Math.round(calories)} kcal</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Protéines</p>
                <p>{selectedFood.protein ? Math.round(parseFloat(selectedFood.protein) * multiplier) : 0}g</p>
              </div>
              <div>
                <p className="text-neutral-500">Glucides</p>
                <p>{selectedFood.carbohydrates ? Math.round(parseFloat(selectedFood.carbohydrates) * multiplier) : 0}g</p>
              </div>
              <div>
                <p className="text-neutral-500">Lipides</p>
                <p>{selectedFood.fat ? Math.round(parseFloat(selectedFood.fat) * multiplier) : 0}g</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-colors"
        >
          Ajouter
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold">Rechercher un aliment</h2>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: poulet, riz, pomme..."
          className="w-full px-4 py-3 bg-neutral-900 rounded-xl"
          autoFocus
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isSearching ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            {query.length >= 2 ? 'Aucun résultat' : 'Tape au moins 2 caractères'}
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((food) => (
              <button
                key={food.id}
                onClick={() => setSelectedFood(food)}
                className="w-full p-3 bg-neutral-900 rounded-xl text-left hover:bg-neutral-800 transition-colors"
              >
                <p className="font-medium">{food.nameFr}</p>
                <p className="text-sm text-neutral-400">
                  {food.calories ? `${food.calories} kcal/100g` : ''} {food.brand ? `• ${food.brand}` : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
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
    <div className="flex-1 flex flex-col p-4">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">Entrée rapide</h2>
      </div>

      <p className="text-neutral-400 text-sm mb-6">
        Tu sais pas exactement ce que tu manges ? Pas grave. Estime juste.
      </p>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-sm text-neutral-400 mb-2 block">C'est quoi ?</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: sandwich, plat du resto..."
            className="w-full px-4 py-3 bg-neutral-900 rounded-xl"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm text-neutral-400 mb-2 block">Environ combien de calories ?</label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="500"
            className="w-full px-4 py-3 bg-neutral-900 rounded-xl"
          />
        </div>

        {/* Quick estimates */}
        <div>
          <p className="text-xs text-neutral-500 mb-2">Estimations rapides</p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Petit repas', cal: 400 },
              { label: 'Repas moyen', cal: 600 },
              { label: 'Gros repas', cal: 900 },
              { label: 'Snack', cal: 200 },
            ].map((est) => (
              <button
                key={est.label}
                onClick={() => setCalories(est.cal.toString())}
                className="px-3 py-1 bg-neutral-800 rounded-full text-xs hover:bg-neutral-700 transition-colors"
              >
                {est.label} (~{est.cal})
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!name || !calories}
        className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold transition-colors"
      >
        Ajouter
      </button>
    </div>
  );
}
