'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import ArrowBack from '@mui/icons-material/ArrowBack';
import type { CravingData, MealType } from './shared';

export default function CravingsView({
  cravings,
  mealType,
  onSelect,
  onClose,
}: {
  cravings: CravingData[];
  mealType: MealType;
  onSelect: (id: string, mealType: MealType) => void;
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
                    <CardActionArea
                      onClick={() => onSelect(craving.id, mealType)}
                      sx={{ p: 1.5, textAlign: 'center' }}
                    >
                      <Typography variant="h5" sx={{ mb: 0.5 }}>
                        {craving.icon || '🍽️'}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {craving.nameFr}
                      </Typography>
                      {craving.estimatedCalories && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.6rem' }}
                        >
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
