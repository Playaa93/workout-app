'use client';

import { useState, useEffect, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import { ArrowLeft, MagnifyingGlass } from '@phosphor-icons/react';
import { alpha } from '@mui/material/styles';
import { useTheme } from 'next-themes';
import { tc, card, GOLD, W } from '@/lib/design-tokens';
import { triggerHaptic, MACRO_COLORS } from './shared';
import { searchFoods, searchOpenFoodFacts, cacheOpenFoodFactsProduct, addFoodEntry } from '../actions';
import type { FoodData, MealType } from './shared';

function foodDedupeKey(f: FoodData): string {
  return (f.nameFr + '\0' + (f.brand || '')).toLowerCase();
}

const PORTION_PRESETS: { keywords: string[]; portions: { label: string; grams: number }[] }[] = [
  { keywords: ['banane'], portions: [{ label: '1 banane', grams: 120 }, { label: '2 bananes', grams: 240 }] },
  { keywords: ['pomme'], portions: [{ label: '1 pomme', grams: 150 }, { label: '1/2 pomme', grams: 75 }] },
  { keywords: ['orange'], portions: [{ label: '1 orange', grams: 150 }] },
  { keywords: ['oeuf', 'œuf'], portions: [{ label: '1 oeuf', grams: 60 }, { label: '2 oeufs', grams: 120 }, { label: '3 oeufs', grams: 180 }] },
  { keywords: ['pain', 'baguette'], portions: [{ label: '1 tranche', grams: 30 }, { label: '1/2 baguette', grams: 125 }] },
  { keywords: ['yaourt', 'yogourt'], portions: [{ label: '1 pot', grams: 125 }] },
  { keywords: ['lait'], portions: [{ label: '1 verre', grams: 200 }, { label: '1 bol', grams: 300 }] },
  { keywords: ['fromage'], portions: [{ label: '1 portion', grams: 30 }] },
  { keywords: ['beurre'], portions: [{ label: '1 noix', grams: 10 }, { label: '1 tartine', grams: 15 }] },
  { keywords: ['huile'], portions: [{ label: '1 c. a soupe', grams: 10 }, { label: '1 filet', grams: 5 }] },
  { keywords: ['riz', 'pâtes', 'spaghetti', 'nouille', 'semoule', 'quinoa'], portions: [{ label: '1 portion cuit', grams: 200 }, { label: '1 portion cru', grams: 80 }] },
  { keywords: ['poulet', 'dinde', 'boeuf', 'bœuf', 'veau', 'porc', 'agneau', 'steak', 'escalope', 'filet'], portions: [{ label: '1 portion', grams: 150 }, { label: '1 gros', grams: 200 }] },
  { keywords: ['saumon', 'thon', 'cabillaud', 'poisson', 'truite', 'sardine'], portions: [{ label: '1 filet', grams: 150 }, { label: '1 boite', grams: 120 }] },
  { keywords: ['tomate'], portions: [{ label: '1 tomate', grams: 120 }] },
  { keywords: ['carotte'], portions: [{ label: '1 carotte', grams: 80 }] },
  { keywords: ['pomme de terre', 'patate'], portions: [{ label: '1 moyenne', grams: 150 }, { label: '1 grosse', grams: 250 }] },
  { keywords: ['avocat'], portions: [{ label: '1/2 avocat', grams: 80 }, { label: '1 avocat', grams: 160 }] },
  { keywords: ['amande', 'noix', 'noisette', 'cacahuète'], portions: [{ label: '1 poignee', grams: 30 }] },
  { keywords: ['miel', 'confiture', 'sucre'], portions: [{ label: '1 c. a cafe', grams: 8 }, { label: '1 c. a soupe', grams: 20 }] },
  { keywords: ['chocolat'], portions: [{ label: '2 carres', grams: 20 }, { label: '1 barre', grams: 40 }] },
  { keywords: ['crème'], portions: [{ label: '1 c. a soupe', grams: 15 }] },
];

function getPortions(foodName: string, servingSize?: number | null) {
  const lower = foodName.toLowerCase();
  for (const preset of PORTION_PRESETS) {
    if (preset.keywords.some(k => lower.includes(k))) {
      return preset.portions;
    }
  }
  if (servingSize && Math.round(servingSize) !== 100) {
    const g = Math.round(servingSize);
    const shortName = foodName.replace(/\s*\(.*\)/, '').trim();
    const portions = [{ label: `1 ${shortName}`, grams: g }];
    if (g <= 500) {
      portions.push({ label: `2 ${shortName}`, grams: g * 2 });
    }
    return portions;
  }
  return [];
}

export default function SearchView({
  mealType: initialMealType,
  onAdd,
  onClose,
}: {
  mealType: MealType;
  onAdd: (data: Parameters<typeof addFoodEntry>[0]) => void;
  onClose: () => void;
}) {
  const { resolvedTheme } = useTheme();
  const d = resolvedTheme !== 'light';

  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodData[]>([]);
  const [offResults, setOffResults] = useState<FoodData[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodData | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<string>(initialMealType);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingOff, setIsSearchingOff] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSnackbar, setAddedSnackbar] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setLocalResults([]);
      setOffResults([]);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setIsSearchingOff(true);
      setOffResults([]);
      try {
        const local = await searchFoods(query);
        if (cancelled) return;
        setLocalResults(local);
        setIsSearching(false);

        if (local.length < 5) {
          const off = await searchOpenFoodFacts(query);
          if (cancelled) return;
          const localKeys = new Set(local.map(foodDedupeKey));
          const filtered = off.filter(f => !localKeys.has(foodDedupeKey(f)));
          setOffResults(filtered);
        }
      } catch {
        // degrade gracefully
      } finally {
        if (!cancelled) {
          setIsSearching(false);
          setIsSearchingOff(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const results = [...localResults, ...offResults];

  const handleAdd = async () => {
    if (!selectedFood || isAdding) return;
    setIsAdding(true);
    try {
      let foodId = selectedFood.id;
      if (foodId.startsWith('off:')) {
        const cached = await cacheOpenFoodFactsProduct(selectedFood);
        foodId = cached.id;
      }
      const qty = parseFloat(quantity) || 0;
      const mult = qty / 100;
      const scaled = (val: string | null | undefined) =>
        val ? parseFloat(val) * mult : undefined;
      onAdd({
        foodId,
        customName: selectedFood.nameFr,
        mealType,
        quantity: qty,
        calories: scaled(selectedFood.calories),
        protein: scaled(selectedFood.protein),
        carbohydrates: scaled(selectedFood.carbohydrates),
        fat: scaled(selectedFood.fat),
      });
      setAddedSnackbar(selectedFood.nameFr);
      setSelectedFood(null);
      setQuantity('100');
    } catch {
      setAddedSnackbar(null);
    } finally {
      setIsAdding(false);
    }
  };

  // Food detail view
  if (selectedFood) {
    return (
      <FoodDetail
        food={selectedFood}
        quantity={quantity}
        isAdding={isAdding}
        d={d}
        onBack={() => setSelectedFood(null)}
        onQuantityChange={setQuantity}
        onAdd={handleAdd}
      />
    );
  }

  // Search list view
  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
        <Stack direction="row" alignItems="center" sx={{ mb: 1.5 }}>
          <IconButton onClick={onClose} size="small" sx={{ color: tc.m(d), mr: 1 }}>
            <ArrowLeft size={20} weight={W} />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: tc.h(d) }}>
            Rechercher
          </Typography>
        </Stack>

        {/* Search input */}
        <Box
          sx={card(d, {
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.25,
          })}
        >
          <MagnifyingGlass size={18} weight={W} style={{ color: tc.f(d), marginRight: 8, flexShrink: 0 }} />
          <Box
            component="input"
            type="text"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            autoFocus
            placeholder="Poulet, riz, pomme..."
            sx={{
              flex: 1,
              py: 1,
              border: 'none',
              bgcolor: 'transparent',
              color: tc.h(d),
              fontSize: '0.85rem',
              fontFamily: 'inherit',
              outline: 'none',
              '&::placeholder': { color: tc.f(d) },
            }}
          />
          {isSearching && <CircularProgress size={16} sx={{ color: GOLD, ml: 1 }} />}
        </Box>
      </Box>

      {/* Results */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 12 }}>
        {!isSearching && results.length === 0 && !isSearchingOff ? (
          <Typography sx={{ textAlign: 'center', color: tc.f(d), fontSize: '0.8rem', py: 6 }}>
            {query.length >= 2 ? 'Aucun resultat' : 'Tape au moins 2 caracteres'}
          </Typography>
        ) : results.length > 0 ? (
          <Box sx={card(d, { overflow: 'hidden' })}>
            {results.map((food, i) => (
              <Box
                key={food.id}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedFood(food);
                  const serving = food.servingSize ? Math.round(parseFloat(food.servingSize)) : 100;
                  setQuantity(String(serving !== 100 ? serving : 100));
                }}
                sx={{
                  px: 2,
                  py: 1.5,
                  cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid' : 'none',
                  borderColor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
                  transition: 'background-color 0.15s ease',
                  '&:active': { bgcolor: d ? alpha('#ffffff', 0.04) : alpha('#000000', 0.02) },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      color: tc.h(d),
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {food.nameFr}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.2 }}>
                      {food.calories && (
                        <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), fontVariantNumeric: 'tabular-nums' }}>
                          {Math.round(parseFloat(food.calories))} kcal/100g
                        </Typography>
                      )}
                      {food.brand && (
                        <Typography sx={{ fontSize: '0.65rem', color: tc.f(d) }}>
                          {food.brand}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  {food.id.startsWith('off:') && (
                    <Typography sx={{
                      fontSize: '0.5rem',
                      fontWeight: 700,
                      color: GOLD,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      px: 0.75,
                      py: 0.25,
                      borderRadius: '6px',
                      bgcolor: alpha(GOLD, 0.1),
                      flexShrink: 0,
                    }}>
                      OFF
                    </Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Box>
        ) : null}

        {isSearchingOff && (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ py: 3 }}>
            <CircularProgress size={14} sx={{ color: GOLD }} />
            <Typography sx={{ fontSize: '0.7rem', color: tc.f(d) }}>
              Open Food Facts...
            </Typography>
          </Stack>
        )}
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={!!addedSnackbar}
        autoHideDuration={2000}
        onClose={() => setAddedSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Box sx={{
          ...card(d, { px: 2.5, py: 1.5 }),
          bgcolor: d ? alpha('#ffffff', 0.12) : '#ffffff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: tc.h(d) }}>
            {addedSnackbar} ajoute
          </Typography>
        </Box>
      </Snackbar>
    </Box>
  );
}

// ─── Food Detail View ───────────────────────────────────────────────

function FoodDetail({
  food,
  quantity,
  isAdding,
  d,
  onBack,
  onQuantityChange,
  onAdd,
}: {
  food: FoodData;
  quantity: string;
  isAdding: boolean;
  d: boolean;
  onBack: () => void;
  onQuantityChange: (v: string) => void;
  onAdd: () => void;
}) {
  const multiplier = (parseFloat(quantity) || 0) / 100;
  const calories = food.calories ? parseFloat(food.calories) * multiplier : 0;
  const protein = food.protein ? parseFloat(food.protein) * multiplier : 0;
  const carbs = food.carbohydrates ? parseFloat(food.carbohydrates) * multiplier : 0;
  const fat = food.fat ? parseFloat(food.fat) * multiplier : 0;

  const portions = useMemo(
    () => getPortions(food.nameFr, food.servingSize ? parseFloat(food.servingSize) : null),
    [food.nameFr, food.servingSize],
  );

  const isValid = (parseFloat(quantity) || 0) > 0;

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, pt: 1, pb: 1 }}>
        <Stack direction="row" alignItems="center">
          <IconButton onClick={onBack} size="small" sx={{ color: tc.m(d), mr: 1 }}>
            <ArrowLeft size={20} weight={W} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              color: tc.h(d),
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {food.nameFr}
            </Typography>
            {food.brand && (
              <Typography sx={{ fontSize: '0.65rem', color: tc.f(d), mt: -0.2 }}>
                {food.brand}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Scrollable content with sticky button inside */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2.5 }}>
        <Stack spacing={2}>

          {/* Calorie hero + macros */}
          <Box sx={card(d, { p: 2.5, textAlign: 'center' })}>
            <Typography sx={{
              fontSize: '2.4rem',
              fontWeight: 800,
              color: GOLD,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {Math.round(calories)}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: tc.m(d), mt: 0.5 }}>
              kcal pour {quantity || 0}g
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1.5 }}>
              {[
                { label: 'Prot', value: Math.round(protein), color: MACRO_COLORS.protein },
                { label: 'Gluc', value: Math.round(carbs), color: MACRO_COLORS.carbs },
                { label: 'Lip', value: Math.round(fat), color: MACRO_COLORS.fat },
              ].map((m) => (
                <Stack key={m.label} direction="row" alignItems="center" spacing={0.5}>
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: m.color, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.65rem', color: tc.m(d) }}>
                    {m.label}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.h(d), fontVariantNumeric: 'tabular-nums' }}>
                    {m.value}g
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Quantity input + portion presets */}
          <Box sx={card(d, { p: 2 })}>
            <Box sx={{ position: 'relative', mb: portions.length > 0 ? 1.5 : 0 }}>
              <Box
                component="input"
                type="number"
                inputMode="decimal"
                value={quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onQuantityChange(e.target.value)}
                sx={{
                  width: '100%',
                  py: 1.5,
                  px: 1,
                  textAlign: 'center',
                  borderRadius: '14px',
                  border: '1px solid',
                  borderColor: quantity ? (d ? alpha('#ffffff', 0.12) : alpha('#000000', 0.1)) : (d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04)),
                  bgcolor: 'transparent',
                  color: tc.h(d),
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  fontVariantNumeric: 'tabular-nums',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  '&:focus': { borderColor: GOLD },
                  '&::placeholder': { color: tc.f(d), fontWeight: 400, fontSize: '0.8rem' },
                  '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                  MozAppearance: 'textfield',
                }}
                placeholder="Grammes"
              />
              <Typography sx={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.7rem',
                color: tc.f(d),
                pointerEvents: 'none',
              }}>
                g
              </Typography>
            </Box>

            {portions.length > 0 && (
              <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
                {portions.map((p) => {
                  const selected = quantity === String(p.grams);
                  return (
                    <Box
                      key={p.label}
                      onClick={() => { triggerHaptic('light'); onQuantityChange(String(p.grams)); }}
                      sx={{
                        px: 1.5,
                        py: 0.6,
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor: selected ? GOLD : d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
                        bgcolor: selected ? alpha(GOLD, 0.1) : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Typography sx={{
                        fontSize: '0.65rem',
                        fontWeight: selected ? 600 : 500,
                        color: selected ? GOLD : tc.m(d),
                        whiteSpace: 'nowrap',
                      }}>
                        {p.label} ({p.grams}g)
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>
        </Stack>

        {/* Add button — sticky at bottom of scroll area, above BottomNav */}
        <Box sx={{
          position: 'sticky',
          bottom: 0,
          pt: 2,
          pb: 10,
          background: d
            ? `linear-gradient(transparent, rgba(10,10,9,0.95) 20%)`
            : `linear-gradient(transparent, rgba(243,241,236,0.95) 20%)`,
        }}>
          <Box
            onClick={isValid && !isAdding ? onAdd : undefined}
            sx={{
              py: 1.5,
              textAlign: 'center',
              bgcolor: !isValid || isAdding ? (d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06)) : GOLD,
              color: !isValid || isAdding ? tc.f(d) : '#1a1715',
              borderRadius: '14px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: !isValid || isAdding ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              ...((isValid && !isAdding) && {
                boxShadow: `0 4px 16px ${alpha(GOLD, 0.3)}`,
                '&:active': { transform: 'scale(0.97)' },
              }),
            }}
          >
            {isAdding ? 'Ajout...' : 'Ajouter'}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
