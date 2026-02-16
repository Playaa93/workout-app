'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import ArrowBack from '@mui/icons-material/ArrowBack';
import type { MealType } from './shared';

export default function QuickEntryView({
  mealType,
  onAdd,
  onClose,
}: {
  mealType: MealType;
  onAdd: (name: string, calories: number, mealType: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  const handleSubmit = () => {
    if (!name || !calories) return;
    onAdd(name, parseInt(calories), mealType);
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Entrée rapide</Typography>
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
