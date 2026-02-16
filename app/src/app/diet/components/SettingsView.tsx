'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ArrowBack from '@mui/icons-material/ArrowBack';
import type { NutritionProfileData, NutritionGoal, ActivityLevel } from './shared';

export default function SettingsView({
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
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    profile?.activityLevel || 'moderate'
  );
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
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Mon objectif
            </Typography>
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
                  <CardActionArea
                    onClick={() => setGoal(g.value)}
                    sx={{ p: 1.5, textAlign: 'center' }}
                  >
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      {g.emoji}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 500 }}>
                      {g.label}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.65rem' }}>
                      {g.desc}
                    </Typography>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Mes infos
            </Typography>
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

          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Niveau d&apos;activité
            </Typography>
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
                  <CardActionArea
                    onClick={() => setActivityLevel(level.value)}
                    sx={{ p: 1.5 }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {level.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {level.desc}
                    </Typography>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>

          <Card sx={{ bgcolor: 'action.hover' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary">
                Ces infos servent à estimer tes besoins. C&apos;est une base de départ, pas un
                objectif strict. Ce qui compte vraiment, c&apos;est ta moyenne sur 7 jours.
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
