'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Search from '@mui/icons-material/Search';
import { searchFoods, addFoodEntry } from '../actions';
import type { FoodData, MealType } from './shared';

// Portions courantes par mot-clé dans le nom
const PORTION_PRESETS: { keywords: string[]; portions: { label: string; grams: number }[] }[] = [
  { keywords: ['banane'], portions: [{ label: '1 banane', grams: 120 }, { label: '2 bananes', grams: 240 }] },
  { keywords: ['pomme'], portions: [{ label: '1 pomme', grams: 150 }, { label: '½ pomme', grams: 75 }] },
  { keywords: ['orange'], portions: [{ label: '1 orange', grams: 150 }] },
  { keywords: ['oeuf', 'œuf'], portions: [{ label: '1 oeuf', grams: 60 }, { label: '2 oeufs', grams: 120 }, { label: '3 oeufs', grams: 180 }] },
  { keywords: ['pain', 'baguette'], portions: [{ label: '1 tranche', grams: 30 }, { label: '½ baguette', grams: 125 }] },
  { keywords: ['yaourt', 'yogourt'], portions: [{ label: '1 pot', grams: 125 }] },
  { keywords: ['lait'], portions: [{ label: '1 verre', grams: 200 }, { label: '1 bol', grams: 300 }] },
  { keywords: ['fromage'], portions: [{ label: '1 portion', grams: 30 }] },
  { keywords: ['beurre'], portions: [{ label: '1 noix', grams: 10 }, { label: '1 tartine', grams: 15 }] },
  { keywords: ['huile'], portions: [{ label: '1 c. à soupe', grams: 10 }, { label: '1 filet', grams: 5 }] },
  { keywords: ['riz', 'pâtes', 'spaghetti', 'nouille', 'semoule', 'quinoa'], portions: [{ label: '1 portion cuit', grams: 200 }, { label: '1 portion cru', grams: 80 }] },
  { keywords: ['poulet', 'dinde', 'boeuf', 'bœuf', 'veau', 'porc', 'agneau', 'steak', 'escalope', 'filet'], portions: [{ label: '1 portion', grams: 150 }, { label: '1 gros', grams: 200 }] },
  { keywords: ['saumon', 'thon', 'cabillaud', 'poisson', 'truite', 'sardine'], portions: [{ label: '1 filet', grams: 150 }, { label: '1 boîte', grams: 120 }] },
  { keywords: ['tomate'], portions: [{ label: '1 tomate', grams: 120 }] },
  { keywords: ['carotte'], portions: [{ label: '1 carotte', grams: 80 }] },
  { keywords: ['pomme de terre', 'patate'], portions: [{ label: '1 moyenne', grams: 150 }, { label: '1 grosse', grams: 250 }] },
  { keywords: ['avocat'], portions: [{ label: '½ avocat', grams: 80 }, { label: '1 avocat', grams: 160 }] },
  { keywords: ['amande', 'noix', 'noisette', 'cacahuète'], portions: [{ label: '1 poignée', grams: 30 }] },
  { keywords: ['miel', 'confiture', 'sucre'], portions: [{ label: '1 c. à café', grams: 8 }, { label: '1 c. à soupe', grams: 20 }] },
  { keywords: ['chocolat'], portions: [{ label: '2 carrés', grams: 20 }, { label: '1 barre', grams: 40 }] },
  { keywords: ['crème'], portions: [{ label: '1 c. à soupe', grams: 15 }] },
];

function getPortions(foodName: string, servingSize?: number | null) {
  // D'abord, vérifier les presets manuels par mot-clé
  const lower = foodName.toLowerCase();
  for (const preset of PORTION_PRESETS) {
    if (preset.keywords.some(k => lower.includes(k))) {
      return preset.portions;
    }
  }

  // Sinon, si on a un serving_size != 100, générer "1 X", "2 X"
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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodData[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodData | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [mealType, setMealType] = useState<string>(initialMealType);
  const [isSearching, setIsSearching] = useState(false);
  const [addedSnackbar, setAddedSnackbar] = useState<string | null>(null);

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
    const name = selectedFood.nameFr;
    onAdd({
      foodId: selectedFood.id,
      mealType,
      quantity: parseFloat(quantity),
    });
    setAddedSnackbar(name);
    setSelectedFood(null);
    setQuantity('100');
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

        <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
          {selectedFood.nameFr}
        </Typography>
        {selectedFood.brand && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {selectedFood.brand}
          </Typography>
        )}

        <Stack spacing={3} sx={{ flex: 1 }}>
          <Box>
            <TextField
              label="Quantité (g)"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              fullWidth
            />
            {(() => {
              const portions = getPortions(selectedFood.nameFr, selectedFood.servingSize ? parseFloat(selectedFood.servingSize) : null);
              if (portions.length === 0) return null;
              return (
                <Stack direction="row" spacing={0.75} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.75 }}>
                  {portions.map((p) => (
                    <Chip
                      key={p.label}
                      label={`${p.label} (${p.grams}g)`}
                      size="small"
                      variant={quantity === String(p.grams) ? 'filled' : 'outlined'}
                      color={quantity === String(p.grams) ? 'primary' : 'default'}
                      onClick={() => setQuantity(String(p.grams))}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Stack>
              );
            })()}
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Repas
            </Typography>
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
              <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
                {Math.round(calories)} kcal
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Protéines
                  </Typography>
                  <Typography variant="body2">
                    {selectedFood.protein
                      ? Math.round(parseFloat(selectedFood.protein) * multiplier)
                      : 0}
                    g
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Glucides
                  </Typography>
                  <Typography variant="body2">
                    {selectedFood.carbohydrates
                      ? Math.round(parseFloat(selectedFood.carbohydrates) * multiplier)
                      : 0}
                    g
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Lipides
                  </Typography>
                  <Typography variant="body2">
                    {selectedFood.fat
                      ? Math.round(parseFloat(selectedFood.fat) * multiplier)
                      : 0}
                    g
                  </Typography>
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
      <Box sx={{ pt: 1.5, pb: 1, px: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
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
                <CardActionArea onClick={() => {
                  setSelectedFood(food);
                  const serving = food.servingSize ? Math.round(parseFloat(food.servingSize)) : 100;
                  setQuantity(String(serving !== 100 ? serving : 100));
                }} sx={{ p: 2 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {food.nameFr}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {food.calories ? `${food.calories} kcal/100g` : ''}{' '}
                    {food.brand ? `• ${food.brand}` : ''}
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      <Snackbar
        open={!!addedSnackbar}
        autoHideDuration={2000}
        onClose={() => setAddedSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          {addedSnackbar} ajouté
        </Alert>
      </Snackbar>
    </Box>
  );
}
