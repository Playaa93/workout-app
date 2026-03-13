'use client';

import { useState, useEffect, useMemo } from 'react';
import { alpha } from '@mui/material/styles';
import Model, { type Muscle, type IExerciseData } from 'react-body-highlighter';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import { X, ArrowLeft, Barbell } from '@phosphor-icons/react';
import { getExerciseImages } from '@/lib/exercise-images';
import { GOLD, GOLD_CONTRAST, W, tc, card, panelBg, goldBtnSx } from '@/lib/design-tokens';
import { MUSCLE_MAPPING, MUSCLE_LABELS, ANTERIOR_MUSCLES, POSTERIOR_MUSCLES, getMappedMuscles } from '@/lib/muscle-mapping';
import { useThemeTokens } from '@/hooks/useDark';

// Equipment labels for display
const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  cable: 'Câble / Poulie',
  machine: 'Machine',
  bodyweight: 'Poids du corps',
  band: 'Élastique',
  kettlebell: 'Kettlebell',
  medicine_ball: 'Médecine ball',
  ez_bar: 'Barre EZ',
  smith_machine: 'Smith machine',
  bench: 'Banc',
  pull_up_bar: 'Barre de traction',
  dip_station: 'Barres à dips',
  suspension: 'Sangles de suspension',
  foam_roller: 'Rouleau',
  stability_ball: 'Swiss ball',
  other: 'Autre',
};

export type ExerciseDetail = {
  id: string;
  nameFr: string;
  nameEn: string | null;
  muscleGroup: string;
  primaryMuscles: string[] | null;
  secondaryMuscles: string[] | null;
  equipment: string[] | null;
  difficulty: string | null;
};

interface ExerciseDetailModalProps {
  exercise: ExerciseDetail | null;
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
}

export default function ExerciseDetailModal({
  exercise,
  open,
  onClose,
  onSelect,
}: ExerciseDetailModalProps) {
  const { t, d } = useThemeTokens();

  const [viewSide, setViewSide] = useState<'anterior' | 'posterior'>('anterior');

  // Auto-select the correct body view when exercise changes
  useEffect(() => {
    if (!exercise) return;
    const primary = getMappedMuscles(exercise.primaryMuscles);
    if (primary.length === 0) {
      const groupMapping = MUSCLE_MAPPING[exercise.muscleGroup];
      if (groupMapping) groupMapping.forEach(m => primary.push(m));
    }
    const secondary = getMappedMuscles(exercise.secondaryMuscles).filter(m => !primary.includes(m));
    const all = [...primary, ...secondary];
    const hasAnt = all.some(m => ANTERIOR_MUSCLES.includes(m));
    const hasPost = all.some(m => POSTERIOR_MUSCLES.includes(m));
    if (hasPost && !hasAnt) {
      setViewSide('posterior');
    } else {
      setViewSide('anterior');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise?.id]);

  if (!exercise) return null;

  const primaryMusclesMapped = getMappedMuscles(exercise.primaryMuscles);

  // Also map from muscle group if no primary muscles
  if (primaryMusclesMapped.length === 0) {
    const groupMapping = MUSCLE_MAPPING[exercise.muscleGroup];
    if (groupMapping) {
      groupMapping.forEach(m => primaryMusclesMapped.push(m));
    }
  }

  // Filter secondary muscles to exclude any that are already in primary
  const primarySet = new Set(primaryMusclesMapped);
  const secondaryMusclesMapped = getMappedMuscles(exercise.secondaryMuscles)
    .filter(m => !primarySet.has(m));

  // Build data for Model component
  const modelData: IExerciseData[] = [
    ...primaryMusclesMapped.map(muscle => ({
      name: exercise.nameFr,
      muscles: [muscle] as Muscle[],
      frequency: 2, // Higher intensity for primary
    })),
    ...secondaryMusclesMapped.map(muscle => ({
      name: exercise.nameFr,
      muscles: [muscle] as Muscle[],
      frequency: 1, // Lower intensity for secondary
    })),
  ];

  const allMuscles = [...primaryMusclesMapped, ...secondaryMusclesMapped];
  const hasAnterior = allMuscles.some(m => ANTERIOR_MUSCLES.includes(m));
  const hasPosterior = allMuscles.some(m => POSTERIOR_MUSCLES.includes(m));

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: panelBg(t),
          maxHeight: '90vh',
        },
      }}
    >
      <Box sx={{ p: 2, pb: 4 }}>
        {/* Handle */}
        <Box
          sx={{
            width: 40,
            height: 4,
            bgcolor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12),
            borderRadius: 2,
            mx: 'auto',
            mb: 2,
          }}
        />

        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.05),
                color: tc.m(t),
                '&:hover': { bgcolor: d ? alpha('#ffffff', 0.12) : alpha('#000000', 0.08) },
              }}
            >
              <ArrowLeft size={20} weight={W} />
            </IconButton>
            <Typography sx={{ fontWeight: 600, fontSize: '1.1rem', color: tc.h(t) }}>
              {exercise.nameFr}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: tc.f(t) }}>
            <X size={20} weight={W} />
          </IconButton>
        </Stack>

        {/* Exercise Images */}
        <ExerciseImageCarousel nameEn={exercise.nameEn} />

        {/* Muscle Tags */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ mb: 1, display: 'block', color: tc.f(t) }}>
            Muscles ciblés
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {primaryMusclesMapped.map(muscle => (
              <Chip
                key={`primary-${muscle}`}
                label={MUSCLE_LABELS[muscle] || muscle}
                size="small"
                sx={{
                  bgcolor: '#dc2626', // Red for primary
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            ))}
            {secondaryMusclesMapped.map(muscle => (
              <Chip
                key={`secondary-${muscle}`}
                label={MUSCLE_LABELS[muscle] || muscle}
                size="small"
                sx={{
                  bgcolor: '#f59e0b', // Amber/Orange for secondary
                  color: 'white',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* Body Model */}
        <Box
          sx={{
            ...card(t),
            p: 2,
            mb: 2,
          }}
        >
          {/* View Toggle */}
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mb: 1 }}>
            <Typography
              onClick={() => setViewSide('anterior')}
              sx={{
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: viewSide === 'anterior' ? 600 : 400,
                color: viewSide === 'anterior' ? tc.h(t) : tc.f(t),
                opacity: hasAnterior ? 1 : 0.3,
              }}
            >
              Face avant
            </Typography>
            <Typography
              onClick={() => setViewSide('posterior')}
              sx={{
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: viewSide === 'posterior' ? 600 : 400,
                color: viewSide === 'posterior' ? tc.h(t) : tc.f(t),
                opacity: hasPosterior ? 1 : 0.3,
              }}
            >
              Face arrière
            </Typography>
          </Stack>

          {/* Body SVG */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              '& svg': {
                maxHeight: 280,
                width: 'auto',
              },
            }}
          >
            <Model
              data={modelData}
              style={{ width: '100%', maxWidth: 200 }}
              highlightedColors={['#f97316', '#ef4444']} // Orange for secondary (freq 1), Red for primary (freq 2)
              bodyColor="#3f3f46"
              type={viewSide}
            />
          </Box>

          {/* Legend */}
          <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#ef4444' }} />
              <Typography variant="caption" sx={{ color: tc.m(t) }}>Principal</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f97316' }} />
              <Typography variant="caption" sx={{ color: tc.m(t) }}>Secondaire</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Equipment */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: tc.f(t) }}>
              Équipement
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {exercise.equipment.map(eq => (
                <Chip
                  key={eq}
                  label={EQUIPMENT_LABELS[eq] || eq}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem', borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12), color: tc.m(t) }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Difficulty */}
        {exercise.difficulty && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block', color: tc.f(t) }}>
              Difficulté
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', textTransform: 'capitalize', color: tc.h(t) }}>
              {exercise.difficulty === 'beginner' && 'Débutant'}
              {exercise.difficulty === 'intermediate' && 'Intermédiaire'}
              {exercise.difficulty === 'expert' && 'Expert'}
              {!['beginner', 'intermediate', 'expert'].includes(exercise.difficulty) && exercise.difficulty}
            </Typography>
          </Box>
        )}

        {/* Select Button */}
        {onSelect && (
          <Box
            onClick={() => {
              onSelect();
              onClose();
            }}
            sx={{
              ...goldBtnSx,
              py: 1.5,
              textAlign: 'center',
              cursor: 'pointer',
              '&:active': { opacity: 0.8, transform: 'scale(0.98)' },
            }}
          >
            Sélectionner cet exercice
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// Animated image component for exercise demonstration
function ExerciseImageCarousel({ nameEn }: { nameEn: string | null }) {
  const { t, d } = useThemeTokens();

  const [currentImage, setCurrentImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const images = useMemo(() => getExerciseImages(nameEn), [nameEn]);

  // Reset state when exercise changes
  useEffect(() => {
    setCurrentImage(0);
    setImageError(false);
    setIsPlaying(true);
  }, [nameEn]);

  // Auto-animate between images
  useEffect(() => {
    if (!isPlaying || images.length < 2 || imageError) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isPlaying, images.length, imageError]);

  // No images available
  if (images.length === 0 || imageError) {
    return (
      <Box
        sx={{
          height: 180,
          bgcolor: d ? alpha('#ffffff', 0.05) : alpha('#000000', 0.04),
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <Box sx={{ color: tc.f(t) }}>
            <Barbell size={48} weight={W} />
          </Box>
          <Typography variant="caption" sx={{ color: tc.f(t) }}>
            Image non disponible
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      {/* Animated image container */}
      <Box
        onClick={() => setIsPlaying(!isPlaying)}
        sx={{
          height: 220,
          bgcolor: GOLD_CONTRAST,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Stack both images with crossfade */}
        {images.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt={`${nameEn || 'Exercise'} - position ${index + 1}`}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
              opacity: currentImage === index ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          />
        ))}

        {/* Play/Pause indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.5)',
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          <Typography sx={{ fontSize: '0.65rem', color: 'white', opacity: 0.8 }}>
            {isPlaying ? '||' : '>'}
          </Typography>
        </Box>

        {/* Animation progress bar */}
        {images.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              bgcolor: 'rgba(255,255,255,0.2)',
            }}
          >
            <Box
              sx={{
                height: '100%',
                bgcolor: GOLD,
                width: `${((currentImage + 1) / images.length) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </Box>
        )}
      </Box>

      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          fontSize: '0.7rem',
          color: tc.f(t),
        }}
      >
        Tap pour {isPlaying ? 'pause' : 'play'} - Position {currentImage + 1}/{images.length}
      </Typography>
    </Box>
  );
}
