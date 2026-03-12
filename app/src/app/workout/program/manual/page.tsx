'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDark } from '@/hooks/useDark';
import type { Exercise } from '../../types';
import { useAuth } from '@/powersync/auth-context';
import { useExercises, useTemplateExercises } from '@/powersync/queries/workout-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJsonArray, parseJson } from '@/powersync/helpers';
import { useQuery } from '@powersync/react';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import { triggerHaptic } from '@/lib/haptic';
import { GOLD, GOLD_LIGHT, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldBtnSx, goldOutlinedBtnSx, goldFieldSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Plus, X, CaretUp, CaretDown, CaretDown as CaretDownIcon } from '@phosphor-icons/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';

type ManualExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
};

export default function ManualProgramPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return <FullScreenLoader />;
  }

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ManualProgramContent />
    </Suspense>
  );
}

function ManualProgramContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const mutations = useWorkoutMutations();
  const { data: exerciseRows } = useExercises();
  const d = useDark();

  // Load existing template if editing
  const { data: templateRows } = useQuery(
    editId ? `SELECT * FROM workout_templates WHERE id = ?` : `SELECT 1 WHERE 0`,
    editId ? [editId] : []
  );
  const { data: templateExRows } = useTemplateExercises(editId);

  const exercises = useMemo<Exercise[]>(() => {
    return exerciseRows.map((e: any) => ({
      id: e.id,
      nameFr: e.name_fr || '',
      nameEn: e.name_en,
      muscleGroup: e.muscle_group || '',
      primaryMuscles: parseJsonArray(e.primary_muscles as string | null),
      secondaryMuscles: parseJsonArray(e.secondary_muscles as string | null),
      equipment: parseJsonArray(e.equipment as string | null),
      difficulty: e.difficulty,
      morphotypeRecommendations: parseJson(e.morphotype_recommendations as string | null),
    }));
  }, [exerciseRows]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<ManualExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(!editId);

  useBackHandler(showPicker, () => setShowPicker(false), 'manual-picker');

  // Populate form from existing template when editing
  useEffect(() => {
    if (!editId || initialized) return;
    const t = templateRows?.[0] as Record<string, unknown> | undefined;
    if (!t || templateExRows.length === 0 || exercises.length === 0) return;

    const exerciseMap = new Map<string, Exercise>();
    for (const e of exercises) exerciseMap.set(e.id, e);

    setName((t.name as string) || '');
    setDescription((t.description as string) || '');
    setSelectedExercises(
      templateExRows.map((ex: any) => {
        const fullEx = exerciseMap.get(ex.exercise_id);
        return {
          exerciseId: ex.exercise_id,
          exerciseName: ex.exercise_name || fullEx?.nameFr || '',
          muscleGroup: fullEx?.muscleGroup || '',
          targetSets: ex.target_sets || 3,
          targetReps: (ex.target_reps as string) || '8-12',
          restSeconds: ex.rest_seconds || 90,
        };
      })
    );
    setInitialized(true);
  }, [editId, initialized, templateRows, templateExRows, exercises]);

  const isEdit = !!editId;
  const canSave = name.trim().length > 0 && selectedExercises.length > 0 && !saving;

  const handleAddExercise = (exercise: Exercise) => {
    if (selectedExercises.some(e => e.exerciseId === exercise.id)) {
      setShowPicker(false);
      return;
    }
    triggerHaptic('light');
    setSelectedExercises(prev => [...prev, {
      exerciseId: exercise.id,
      exerciseName: exercise.nameFr,
      muscleGroup: exercise.muscleGroup,
      targetSets: 3,
      targetReps: '8-12',
      restSeconds: 90,
    }]);
    setShowPicker(false);
  };

  const handleRemoveExercise = (index: number) => {
    triggerHaptic('light');
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
    if (expandedIndex === index) setExpandedIndex(null);
    else if (expandedIndex !== null && expandedIndex > index) setExpandedIndex(expandedIndex - 1);
  };

  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    triggerHaptic('light');
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;
    setSelectedExercises(prev => {
      const copy = [...prev];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
    if (expandedIndex === index) setExpandedIndex(newIndex);
    else if (expandedIndex === newIndex) setExpandedIndex(index);
  };

  const handleUpdateExercise = (index: number, field: keyof ManualExercise, value: string | number) => {
    setSelectedExercises(prev => prev.map((ex, i) => i === index ? { ...ex, [field]: value } : ex));
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit) {
        await mutations.updateTemplateWithExercises(editId, name.trim(), description.trim() || null, selectedExercises);
        router.push(`/workout/program/detail?id=${editId}`);
      } else {
        await mutations.createTemplateWithExercises(name.trim(), description.trim() || null, selectedExercises);
        router.push('/workout');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSaving(false);
    }
  };

  if (editId && !initialized) {
    return <FullScreenLoader />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surfaceBg(d), display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 10,
          borderBottom: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          bgcolor: panelBg(d),
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <IconButton onClick={() => router.back()} size="small" sx={{ mr: 1 }}>
            <ArrowLeft weight={W} size={22} color={tc.h(d)} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', color: tc.h(d) }}>
            {isEdit ? 'Modifier le programme' : 'Nouveau programme'}
          </Typography>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2, pb: 12 }}>
        <Stack spacing={2.5}>
          {/* Name */}
          <TextField
            label="Nom du programme"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            size="small"
            placeholder="Ex: Push Day, Full Body..."
            sx={goldFieldSx(d)}
          />

          {/* Description */}
          <TextField
            label="Description (optionnel)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            maxRows={4}
            size="small"
            placeholder="Notes sur ce programme..."
            sx={goldFieldSx(d)}
          />

          {/* Exercise List */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, color: tc.m(d) }}>
              Exercices ({selectedExercises.length})
            </Typography>

            {selectedExercises.length === 0 ? (
              <Box sx={{
                border: '1px dashed',
                borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12),
                borderRadius: '14px',
                py: 4,
                textAlign: 'center',
              }}>
                <Typography variant="body2" sx={{ color: tc.f(d) }}>
                  Aucun exercice ajouté
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {selectedExercises.map((ex, index) => (
                  <Box
                    key={`${ex.exerciseId}-${index}`}
                    sx={card(d, { overflow: 'hidden' })}
                  >
                    {/* Exercise header row */}
                    <Box
                      onClick={() => {
                        triggerHaptic('light');
                        setExpandedIndex(expandedIndex === index ? null : index);
                      }}
                      sx={{
                        px: 2, py: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:active': { bgcolor: d ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02) },
                      }}
                    >
                      {/* Order controls */}
                      <Stack sx={{ mr: 1 }}>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={(e) => { e.stopPropagation(); handleMoveExercise(index, 'up'); }}
                          sx={{ p: 0 }}
                        >
                          <CaretUp weight={W} size={18} color={index === 0 ? tc.f(d) : tc.m(d)} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === selectedExercises.length - 1}
                          onClick={(e) => { e.stopPropagation(); handleMoveExercise(index, 'down'); }}
                          sx={{ p: 0 }}
                        >
                          <CaretDown weight={W} size={18} color={index === selectedExercises.length - 1 ? tc.f(d) : tc.m(d)} />
                        </IconButton>
                      </Stack>

                      {/* Exercise info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 500, fontSize: '0.95rem', color: tc.h(d) }} noWrap>
                          {ex.exerciseName}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25 }}>
                          <Chip
                            label={MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              color: tc.m(d),
                              bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.05),
                            }}
                          />
                          <Typography variant="caption" sx={{ color: tc.f(d) }}>
                            {ex.targetSets}x{ex.targetReps} · {ex.restSeconds}s
                          </Typography>
                        </Stack>
                      </Box>

                      {/* Expand icon */}
                      <CaretDownIcon
                        weight={W}
                        size={20}
                        color={tc.f(d)}
                        style={{
                          transition: 'transform 0.2s',
                          transform: expandedIndex === index ? 'rotate(180deg)' : 'rotate(0deg)',
                          marginRight: 4,
                        }}
                      />

                      {/* Remove button */}
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleRemoveExercise(index); }}
                        sx={{ color: tc.f(d) }}
                      >
                        <X weight={W} size={18} />
                      </IconButton>
                    </Box>

                    {/* Expanded config */}
                    <Collapse in={expandedIndex === index}>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Stack direction="row" spacing={1.5}>
                          <TextField
                            label="Séries"
                            type="number"
                            size="small"
                            value={ex.targetSets}
                            onChange={(e) => handleUpdateExercise(index, 'targetSets', Math.max(1, parseInt(e.target.value) || 1))}
                            slotProps={{ htmlInput: { min: 1, max: 20 } }}
                            sx={{ width: 80, ...goldFieldSx(d) }}
                          />
                          <TextField
                            label="Reps"
                            size="small"
                            value={ex.targetReps}
                            onChange={(e) => handleUpdateExercise(index, 'targetReps', e.target.value)}
                            placeholder="8-12"
                            sx={{ width: 90, ...goldFieldSx(d) }}
                          />
                          <TextField
                            label="Repos (s)"
                            type="number"
                            size="small"
                            value={ex.restSeconds}
                            onChange={(e) => handleUpdateExercise(index, 'restSeconds', Math.max(0, parseInt(e.target.value) || 0))}
                            slotProps={{ htmlInput: { min: 0, max: 600, step: 15 } }}
                            sx={{ width: 100, ...goldFieldSx(d) }}
                          />
                        </Stack>
                      </Box>
                    </Collapse>
                  </Box>
                ))}
              </Stack>
            )}

            {/* Add exercise button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Plus weight="bold" size={18} />}
              onClick={() => setShowPicker(true)}
              sx={{ ...goldOutlinedBtnSx, mt: 1.5, borderStyle: 'dashed' }}
            >
              Ajouter un exercice
            </Button>
          </Box>
        </Stack>
      </Box>

      {/* Bottom save bar */}
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          p: 2, pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          borderTop: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          bgcolor: panelBg(d),
          zIndex: 10,
        }}
      >
        <Button
          fullWidth
          variant="contained"
          disabled={!canSave}
          onClick={handleSave}
          sx={{ ...goldBtnSx, py: 1.5, fontSize: '1rem' }}
        >
          {saving ? <CircularProgress size={24} sx={{ color: GOLD_CONTRAST }} /> : (isEdit ? 'Enregistrer' : 'Sauvegarder')}
        </Button>
      </Box>

      {/* Exercise Picker Drawer */}
      <Drawer
        anchor="bottom"
        open={showPicker}
        onClose={() => setShowPicker(false)}
        PaperProps={{
          sx: { height: '90vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: surfaceBg(d) },
        }}
      >
        <ExercisePicker
          exercises={exercises}
          onSelect={handleAddExercise}
          onClose={() => setShowPicker(false)}
        />
      </Drawer>
    </Box>
  );
}
