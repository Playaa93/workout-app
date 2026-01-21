'use client';

import { useState, useEffect } from 'react';
import Model, { type Muscle, type IExerciseData } from 'react-body-highlighter';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Close from '@mui/icons-material/Close';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { getExerciseImages } from '@/lib/exercise-images';

// Mapping from our muscle names to react-body-highlighter muscle names
const MUSCLE_MAPPING: Record<string, string[]> = {
  // Pectoraux
  pec_major_sternal: ['chest'],
  pec_major_clavicular: ['chest'],
  pec_major_abdominal: ['chest'],
  chest: ['chest'],

  // Dos
  latissimus_dorsi: ['upper-back'],
  teres_major: ['upper-back'],
  rhomboids: ['upper-back'],
  trapezius_mid: ['trapezius'],
  trapezius_upper: ['trapezius'],
  erector_spinae: ['lower-back'],
  back: ['upper-back', 'lower-back'],

  // Épaules
  anterior_delt: ['front-deltoids'],
  lateral_delt: ['front-deltoids'], // Visible principalement de face
  posterior_delt: ['back-deltoids'],
  infraspinatus: ['back-deltoids'],
  teres_minor: ['back-deltoids'], // Coiffe des rotateurs
  shoulders: ['front-deltoids', 'back-deltoids'],

  // Bras
  biceps_long_head: ['biceps'],
  biceps_short_head: ['biceps'],
  brachialis: ['biceps'],
  brachioradialis: ['forearm'],
  triceps_long_head: ['triceps'],
  triceps_lateral_head: ['triceps'],
  triceps_medial_head: ['triceps'],
  forearm_flexors: ['forearm'],
  forearm_extensors: ['forearm'],
  arms: ['biceps', 'triceps', 'forearm'],

  // Jambes
  quadriceps_rectus_femoris: ['quadriceps'],
  quadriceps_vastus_lateralis: ['quadriceps'],
  quadriceps_vastus_medialis: ['quadriceps'],
  gluteus_maximus: ['gluteal'],
  gluteus_medius: ['gluteal'],
  hamstrings_biceps_femoris: ['hamstring'],
  hamstrings_semitendinosus: ['hamstring'],
  calves_gastrocnemius: ['calves'],
  calves_soleus: ['calves'],
  hip_flexors: ['quadriceps'], // Inclut le rectus femoris
  tensor_fasciae_latae: ['gluteal'], // TFL - côté de la hanche
  adductors: ['adductor'],
  legs: ['quadriceps', 'hamstring', 'gluteal', 'calves'],

  // Core
  rectus_abdominis: ['abs'],
  obliques: ['obliques'],
  obliques_external: ['obliques'],
  obliques_internal: ['obliques'],
  transverse_abdominis: ['abs'],
  serratus_anterior: ['obliques'], // Dentelé - côté du torse
  core: ['abs', 'obliques'],
};

// Muscle group labels for display
const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  'upper-back': 'Haut du dos',
  'lower-back': 'Lombaires',
  trapezius: 'Trapèzes',
  'front-deltoids': 'Épaules avant',
  'back-deltoids': 'Épaules arrière',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Avant-bras',
  abs: 'Abdominaux',
  obliques: 'Obliques',
  quadriceps: 'Quadriceps',
  hamstring: 'Ischio-jambiers',
  gluteal: 'Fessiers',
  calves: 'Mollets',
  adductor: 'Adducteurs',
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
  const [viewSide, setViewSide] = useState<'anterior' | 'posterior'>('anterior');

  if (!exercise) return null;

  // Convert our muscles to react-body-highlighter format
  const getMappedMuscles = (muscles: string[] | null): string[] => {
    if (!muscles) return [];
    const mapped = new Set<string>();
    muscles.forEach(muscle => {
      const mappings = MUSCLE_MAPPING[muscle] || MUSCLE_MAPPING[muscle.toLowerCase()];
      if (mappings) {
        mappings.forEach(m => mapped.add(m));
      }
    });
    return Array.from(mapped);
  };

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

  // Check which view has muscles to show
  const anteriorMuscles = ['chest', 'abs', 'obliques', 'quadriceps', 'biceps', 'forearm', 'front-deltoids', 'adductor'];
  const posteriorMuscles = ['upper-back', 'lower-back', 'trapezius', 'back-deltoids', 'triceps', 'hamstring', 'gluteal', 'calves'];

  const allMuscles = [...primaryMusclesMapped, ...secondaryMusclesMapped];
  const hasAnterior = allMuscles.some(m => anteriorMuscles.includes(m));
  const hasPosterior = allMuscles.some(m => posteriorMuscles.includes(m));

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: 'background.default',
          maxHeight: '90vh',
        },
      }}
    >
      <Box sx={{ p: 2, pb: 4 }}>
        {/* Handle */}
        <Box
          sx={{
            width: 48,
            height: 4,
            bgcolor: 'action.hover',
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
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' },
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {exercise.nameFr}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled' }}>
            <Close sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>

        {/* Exercise Images */}
        <ExerciseImageCarousel nameEn={exercise.nameEn} />

        {/* Muscle Tags */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block' }}>
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
            bgcolor: 'background.paper',
            borderRadius: 3,
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
                color: viewSide === 'anterior' ? 'text.primary' : 'text.disabled',
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
                color: viewSide === 'posterior' ? 'text.primary' : 'text.disabled',
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
              <Typography variant="caption" color="text.secondary">Principal</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f97316' }} />
              <Typography variant="caption" color="text.secondary">Secondaire</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Equipment */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block' }}>
              Équipement
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {exercise.equipment.map(eq => (
                <Chip
                  key={eq}
                  label={eq}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {/* Difficulty */}
        {exercise.difficulty && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.disabled" sx={{ mb: 1, display: 'block' }}>
              Difficulté
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', textTransform: 'capitalize' }}>
              {exercise.difficulty === 'beginner' && '🟢 Débutant'}
              {exercise.difficulty === 'intermediate' && '🟡 Intermédiaire'}
              {exercise.difficulty === 'expert' && '🔴 Expert'}
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
            Sélectionner cet exercice
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

// Animated image component for exercise demonstration
function ExerciseImageCarousel({ nameEn }: { nameEn: string | null }) {
  const [currentImage, setCurrentImage] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>([]);
  const images = getExerciseImages(nameEn);

  // Auto-animate between images
  useEffect(() => {
    if (!isPlaying || images.length < 2 || imageError) return;

    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 800); // Switch every 800ms for smooth animation effect

    return () => clearInterval(interval);
  }, [isPlaying, images.length, imageError]);

  // Preload images
  useEffect(() => {
    if (images.length === 0) return;

    const loadStates: boolean[] = new Array(images.length).fill(false);

    images.forEach((src, index) => {
      const img = new window.Image();
      img.onload = () => {
        loadStates[index] = true;
        setImagesLoaded([...loadStates]);
      };
      img.onerror = () => {
        setImageError(true);
      };
      img.src = src;
    });
  }, [images]);

  // No images available
  if (images.length === 0 || imageError) {
    return (
      <Box
        sx={{
          height: 180,
          bgcolor: 'action.hover',
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        <Stack alignItems="center" spacing={1}>
          <FitnessCenterIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled">
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
          bgcolor: '#1a1a1a',
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
            {isPlaying ? '❚❚' : '▶'}
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
                bgcolor: 'primary.main',
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
        color="text.disabled"
        sx={{
          display: 'block',
          textAlign: 'center',
          mt: 1,
          fontSize: '0.7rem',
        }}
      >
        Tap pour {isPlaying ? 'pause' : 'play'} • Position {currentImage + 1}/{images.length}
      </Typography>
    </Box>
  );
}
