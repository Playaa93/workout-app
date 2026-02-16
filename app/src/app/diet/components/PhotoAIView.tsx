'use client';

import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import ArrowBack from '@mui/icons-material/ArrowBack';
import CameraAlt from '@mui/icons-material/CameraAlt';
import { addAIFoodEntry } from '../actions';
import { triggerHaptic, MEAL_CONFIG } from './shared';
import type { MealType } from './shared';

type RecognizedFood = {
  name: string;
  portionGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  selected: boolean;
};

type AIState = 'capture' | 'analyzing' | 'results' | 'error';

async function compressImage(file: File, maxSize: number = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoAIView({
  mealType,
  onDone,
  onClose,
}: {
  mealType: MealType;
  onDone: () => Promise<void>;
  onClose: () => void;
}) {
  const [state, setState] = useState<AIState>('capture');
  const [foods, setFoods] = useState<RecognizedFood[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const meal = MEAL_CONFIG[mealType];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setState('analyzing');
    triggerHaptic('light');

    try {
      const base64 = await compressImage(file);
      setPreview(base64);

      const res = await fetch('/api/recognize-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erreur serveur' }));
        throw new Error(err.error || 'Erreur serveur');
      }

      const data = await res.json();
      if (!data.foods || data.foods.length === 0) {
        throw new Error('Aucun aliment reconnu dans cette image');
      }

      setFoods(
        data.foods.map((f: RecognizedFood) => ({
          ...f,
          selected: true,
        }))
      );
      setState('results');
      triggerHaptic('medium');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erreur inconnue');
      setState('error');
    }
  };

  const toggleFood = (idx: number) => {
    setFoods((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, selected: !f.selected } : f))
    );
  };

  const selectedFoods = foods.filter((f) => f.selected);
  const totalCals = selectedFoods.reduce((s, f) => s + f.calories, 0);

  const handleAddAll = async () => {
    setIsAdding(true);
    try {
      for (const food of selectedFoods) {
        await addAIFoodEntry({
          customName: food.name,
          mealType,
          calories: food.calories,
          protein: food.protein,
          carbohydrates: food.carbs,
          fat: food.fat,
          aiConfidence: food.confidence,
        });
      }
      triggerHaptic('heavy');
      await onDone();
    } catch {
      setErrorMsg("Erreur lors de l'ajout");
      setState('error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>Photo IA</Typography>
          <Chip
            label={meal.label}
            size="small"
            sx={{ bgcolor: `${meal.color}15`, color: meal.color, fontWeight: 600 }}
          />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 2 }}>
        {/* Hidden file input */}
        <input
          ref={fileRef}
          id="photo-ai-camera"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {state === 'capture' && (
          <Stack spacing={3} sx={{ alignItems: 'center', py: 4 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'rgba(245,158,11,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CameraAlt sx={{ fontSize: 48, color: '#f59e0b' }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              Prends en photo ton repas
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              L&apos;IA va analyser l&apos;image et estimer les calories et macros de chaque
              aliment détecté.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<CameraAlt />}
              onClick={() => {
                triggerHaptic('light');
                fileRef.current?.click();
              }}
              sx={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Prendre une photo
            </Button>
          </Stack>
        )}

        {state === 'analyzing' && (
          <Stack spacing={3} sx={{ alignItems: 'center', py: 6 }}>
            {preview && (
              <Box
                component="img"
                src={preview}
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  borderRadius: 3,
                  opacity: 0.7,
                }}
              />
            )}
            <CircularProgress sx={{ color: '#f59e0b' }} />
            <Typography variant="body2" color="text.secondary">
              Analyse en cours...
            </Typography>
          </Stack>
        )}

        {state === 'results' && (
          <Stack spacing={2}>
            {preview && (
              <Box
                component="img"
                src={preview}
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  mx: 'auto',
                  borderRadius: 3,
                }}
              />
            )}

            <Typography variant="subtitle2" color="text.secondary">
              {foods.length} aliment{foods.length > 1 ? 's' : ''} reconnu
              {foods.length > 1 ? 's' : ''}
            </Typography>

            {foods.map((food, idx) => (
              <Card key={idx} variant="outlined">
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Checkbox
                      checked={food.selected}
                      onChange={() => toggleFood(idx)}
                      size="small"
                    />
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" fontWeight={600}>
                          {food.name}
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {food.calories} kcal
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.25 }}>
                        <Typography variant="caption" sx={{ color: '#3b82f6', fontSize: '0.7rem' }}>
                          P{food.protein}g
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#f59e0b', fontSize: '0.7rem' }}>
                          G{food.carbs}g
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#ef4444', fontSize: '0.7rem' }}>
                          L{food.fat}g
                        </Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                          ~{food.portionGrams}g
                        </Typography>
                      </Stack>
                    </Box>
                    <Chip
                      label={`${Math.round(food.confidence * 100)}%`}
                      size="small"
                      sx={{
                        fontSize: '0.65rem',
                        bgcolor: food.confidence > 0.7 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: food.confidence > 0.7 ? '#10b981' : '#f59e0b',
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}

            <Card sx={{ bgcolor: 'rgba(103,80,164,0.08)' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight={600}>
                    Total ({selectedFoods.length} aliment{selectedFoods.length > 1 ? 's' : ''})
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {totalCals} kcal
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setState('capture');
                  setFoods([]);
                  setPreview(null);
                }}
                sx={{ flex: 1 }}
              >
                Reprendre
              </Button>
              <Box
                onClick={selectedFoods.length > 0 && !isAdding ? handleAddAll : undefined}
                sx={{
                  flex: 2,
                  py: 1.5,
                  textAlign: 'center',
                  bgcolor:
                    selectedFoods.length === 0 || isAdding ? 'action.disabled' : 'text.primary',
                  color: 'background.default',
                  borderRadius: 2,
                  fontWeight: 600,
                  cursor: selectedFoods.length > 0 && !isAdding ? 'pointer' : 'default',
                  '&:active':
                    selectedFoods.length > 0 && !isAdding
                      ? { opacity: 0.8, transform: 'scale(0.98)' }
                      : {},
                }}
              >
                {isAdding ? 'Ajout en cours...' : `Ajouter ${selectedFoods.length} aliment${selectedFoods.length > 1 ? 's' : ''}`}
              </Box>
            </Stack>
          </Stack>
        )}

        {state === 'error' && (
          <Stack spacing={3} sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5">😕</Typography>
            <Typography variant="h6" fontWeight={600}>
              Erreur
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMsg}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setState('capture');
                setErrorMsg('');
                setPreview(null);
              }}
            >
              Réessayer
            </Button>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
