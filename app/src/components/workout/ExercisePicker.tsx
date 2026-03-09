'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import type { Exercise } from '@/app/workout/types';
import type { MorphotypeResult } from '@/app/morphology/types';
import {
  scoreExercise,
  getCategoryDefault,
  type MorphoRecommendation,
} from '@/lib/morpho-exercise-scoring';
import { MorphoScoreBadge } from '@/components/workout/MorphoTipsPanel';
import ExerciseDetailModal from '@/components/workout/ExerciseDetailModal';
import { triggerHaptic } from '@/lib/haptic';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Close from '@mui/icons-material/Close';
import Search from '@mui/icons-material/Search';
import ChevronRight from '@mui/icons-material/ChevronRight';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

// Mapping primary muscles to simplified subcategory names
const MUSCLE_TO_SUBCATEGORY: Record<string, string> = {
  // Jambes
  quadriceps_rectus_femoris: 'Quadriceps',
  quadriceps_vastus_lateralis: 'Quadriceps',
  quadriceps_vastus_medialis: 'Quadriceps',
  gluteus_maximus: 'Fessiers',
  hamstrings_biceps_femoris: 'Ischios',
  hamstrings_semitendinosus: 'Ischios',
  calves_gastrocnemius: 'Mollets',
  calves_soleus: 'Mollets',
  adductors: 'Adducteurs',
  hip_flexors: 'Adducteurs',
  // Bras
  biceps_long_head: 'Biceps',
  biceps_short_head: 'Biceps',
  brachialis: 'Biceps',
  brachioradialis: 'Biceps',
  triceps_long_head: 'Triceps',
  triceps_lateral_head: 'Triceps',
  triceps_medial_head: 'Triceps',
  forearm_flexors: 'Avant-bras',
  forearm_extensors: 'Avant-bras',
  // Épaules
  anterior_delt: 'Delt. avant',
  lateral_delt: 'Delt. latéral',
  posterior_delt: 'Delt. arrière',
  infraspinatus: 'Delt. arrière',
  // Dos
  latissimus_dorsi: 'Grand dorsal',
  teres_major: 'Grand dorsal',
  trapezius_mid: 'Trapèzes',
  trapezius_upper: 'Trapèzes',
  rhomboids: 'Trapèzes',
  erector_spinae: 'Lombaires',
  // Pectoraux
  pec_major_clavicular: 'Pec. haut',
  pec_major_sternal: 'Pec. milieu',
  pec_major_abdominal: 'Pec. bas',
  // Core
  rectus_abdominis: 'Abdos',
  transverse_abdominis: 'Abdos',
  obliques: 'Obliques',
};

function getExerciseSubcategory(primaryMuscles: string[] | null): string | null {
  if (!primaryMuscles || primaryMuscles.length === 0) return null;
  return MUSCLE_TO_SUBCATEGORY[primaryMuscles[0]] || null;
}

const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();


export function ExercisePicker({
  exercises,
  morphotype,
  onSelect,
  onClose,
}: {
  exercises: Exercise[];
  morphotype?: MorphotypeResult | null;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sortByScore, setSortByScore] = useState(true);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [visibleCount, setVisibleCount] = useState(50);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setVisibleCount(50);
    }, 200);
  }, []);

  const muscleGroups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscleGroup))].filter(g => g !== 'full_body'),
    [exercises]
  );

  // Dynamically generate subcategories from exercises in selected muscle group
  const subcategories = useMemo(() => {
    if (!selectedMuscle) return [];
    const muscleExercises = exercises.filter(e => e.muscleGroup === selectedMuscle);
    const subs = new Set<string>();
    muscleExercises.forEach(ex => {
      const sub = getExerciseSubcategory(ex.primaryMuscles);
      if (sub) subs.add(sub);
    });
    return Array.from(subs).sort();
  }, [exercises, selectedMuscle]);

  // Calculate scores for all exercises
  const exercisesWithScores = useMemo(() => {
    if (!morphotype) return exercises.map((e) => ({ exercise: e, score: 70 }));

    return exercises.map((exercise) => {
      const rec = (exercise.morphotypeRecommendations as MorphoRecommendation | null)
        || getCategoryDefault(exercise.muscleGroup, exercise.nameFr);
      const result = scoreExercise(morphotype, rec);
      return { exercise, score: result.score };
    });
  }, [exercises, morphotype]);

  // Pre-compute normalized names once (not on every keystroke)
  const normalizedExercises = useMemo(() => {
    return exercisesWithScores.map((item) => ({
      ...item,
      normalizedName: normalize(item.exercise.nameFr),
    }));
  }, [exercisesWithScores]);

  const filteredExercises = useMemo(() => {
    const normalizedSearch = normalize(debouncedSearch);
    let filtered = normalizedExercises.filter(({ exercise, normalizedName }) => {
      const matchesSearch = !normalizedSearch || normalizedName.includes(normalizedSearch);
      const matchesMuscle = !selectedMuscle || exercise.muscleGroup === selectedMuscle;

      let matchesSubcategory = true;
      if (selectedSubcategory) {
        matchesSubcategory = getExerciseSubcategory(exercise.primaryMuscles) === selectedSubcategory;
      }

      return matchesSearch && matchesMuscle && matchesSubcategory;
    });

    if (sortByScore) {
      filtered = [...filtered].sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [normalizedExercises, debouncedSearch, selectedMuscle, selectedSubcategory, sortByScore]);

  const handleMuscleSelect = (muscle: string | null) => {
    triggerHaptic('light');
    setSelectedMuscle(muscle);
    setSelectedSubcategory(null);
    setVisibleCount(50);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2 }}>
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
            <Close sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Exercices
          </Typography>
          <Box sx={{ width: 32 }} />
        </Stack>
      </Box>

      {/* Search */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 1.5,
            py: 1,
          }}
        >
          <Search sx={{ fontSize: 20, color: 'text.disabled', mr: 1 }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '1rem',
              color: 'inherit',
            }}
          />
        </Box>
      </Box>

      {/* Muscle Filter */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 0.5 }}>
          <Typography
            onClick={() => handleMuscleSelect(null)}
            sx={{
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: !selectedMuscle ? 600 : 400,
              color: !selectedMuscle ? 'text.primary' : 'text.disabled',
              whiteSpace: 'nowrap',
              '&:active': { opacity: 0.5 },
            }}
          >
            Tous
          </Typography>
          {muscleGroups.map((muscle) => (
            <Typography
              key={muscle}
              onClick={() => handleMuscleSelect(muscle)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: selectedMuscle === muscle ? 600 : 400,
                color: selectedMuscle === muscle ? 'text.primary' : 'text.disabled',
                whiteSpace: 'nowrap',
                '&:active': { opacity: 0.5 },
              }}
            >
              {MUSCLE_LABELS[muscle] || muscle}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Subcategory Filter */}
      {selectedMuscle && subcategories.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto' }}>
            <Typography
              onClick={() => {
                triggerHaptic('light');
                setSelectedSubcategory(null);
                setVisibleCount(50);
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: !selectedSubcategory ? 600 : 400,
                color: !selectedSubcategory ? 'primary.main' : 'text.disabled',
                whiteSpace: 'nowrap',
              }}
            >
              Tous
            </Typography>
            {subcategories.map((sub) => (
              <Typography
                key={sub}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedSubcategory(sub);
                  setVisibleCount(50);
                }}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: selectedSubcategory === sub ? 600 : 400,
                  color: selectedSubcategory === sub ? 'primary.main' : 'text.disabled',
                  whiteSpace: 'nowrap',
                }}
              >
                {sub}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* Count + Sort */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.disabled">
            {filteredExercises.length} exercices
          </Typography>
          {morphotype && (
            <Typography
              onClick={() => {
                triggerHaptic('light');
                setSortByScore(!sortByScore);
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: sortByScore ? 'primary.main' : 'text.disabled',
                fontWeight: sortByScore ? 600 : 400,
              }}
            >
              {sortByScore ? '✓ Morpho' : 'Morpho'}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Exercise List */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
        <Stack spacing={1}>
          {filteredExercises.slice(0, visibleCount).map(({ exercise, score }) => (
            <Box
              key={exercise.id}
              onClick={() => {
                triggerHaptic('light');
                onSelect(exercise);
              }}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
                '&:active': {
                  bgcolor: 'action.hover',
                  transform: 'scale(0.98)',
                },
              }}
            >
              <MorphoScoreBadge score={score} size="small" />

              <Box sx={{ flex: 1, minWidth: 0, ml: 1.5 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {exercise.nameFr}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: 'text.disabled',
                    mt: 0.25,
                  }}
                >
                  {getExerciseSubcategory(exercise.primaryMuscles) || MUSCLE_LABELS[exercise.muscleGroup] || exercise.muscleGroup}
                </Typography>
              </Box>

              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setDetailExercise(exercise);
                }}
                sx={{
                  p: 0.75,
                  mr: 0.5,
                  borderRadius: 1,
                  color: 'text.disabled',
                  '&:active': { bgcolor: 'action.hover' },
                }}
              >
                <InfoOutlined sx={{ fontSize: 18 }} />
              </Box>

              <ChevronRight sx={{ fontSize: 20, color: 'text.disabled', opacity: 0.5 }} />
            </Box>
          ))}
          {filteredExercises.length > visibleCount && (
            <Typography
              onClick={() => setVisibleCount((c) => c + 50)}
              sx={{
                textAlign: 'center',
                py: 1.5,
                fontSize: '0.85rem',
                fontWeight: 500,
                color: 'primary.main',
                cursor: 'pointer',
                '&:active': { opacity: 0.5 },
              }}
            >
              Voir plus ({filteredExercises.length - visibleCount} restants)
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={detailExercise ? {
          id: detailExercise.id,
          nameFr: detailExercise.nameFr,
          nameEn: detailExercise.nameEn,
          muscleGroup: detailExercise.muscleGroup,
          primaryMuscles: detailExercise.primaryMuscles,
          secondaryMuscles: detailExercise.secondaryMuscles,
          equipment: detailExercise.equipment,
          difficulty: detailExercise.difficulty,
        } : null}
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        onSelect={() => {
          if (detailExercise) {
            onSelect(detailExercise);
          }
        }}
      />
    </Box>
  );
}
