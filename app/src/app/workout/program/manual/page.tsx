'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeTokens } from '@/hooks/useDark';
import type { Exercise } from '../../types';
import { useAuth } from '@/powersync/auth-context';
import { useExercises, useTemplateExercises } from '@/powersync/queries/workout-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJsonArray, parseJson } from '@/powersync/helpers';
import { useQuery } from '@powersync/react';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import { triggerHaptic } from '@/lib/haptic';
import { GOLD, W, tc, card, surfaceBg, panelBg, goldFieldSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Plus, X, CaretUp, CaretDown } from '@phosphor-icons/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
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
  const { t, d } = useThemeTokens();

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
    if (!t || exercises.length === 0) return;

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

  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.1em', textTransform: 'uppercase' as const };
  const sepSx = { borderBottom: '1px solid', borderColor: d ? alpha('#fff', 0.05) : alpha('#000', 0.05) };
  const totalSets = selectedExercises.reduce((s, ex) => s + (ex.targetSets || 0), 0);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surfaceBg(t), display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 10,
          borderBottom: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          bgcolor: panelBg(t),
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ px: 2, py: 1.5 }}>
          <IconButton onClick={() => router.back()} size="small" sx={{ mr: 1 }}>
            <ArrowLeft weight={W} size={22} color={tc.h(t)} />
          </IconButton>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: tc.h(t), letterSpacing: '-0.02em', flex: 1 }}>
            {isEdit ? 'Modifier le programme' : 'Nouveau programme'}
          </Typography>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 2, pb: 12 }}>
        <Stack spacing={1.5}>
          {/* Name input in card */}
          <Box sx={card(t, { p: 2 })}>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              size="small"
              placeholder="Nom du programme *"
              variant="standard"
              slotProps={{ input: { disableUnderline: true } }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '1rem', fontWeight: 700, color: tc.h(t),
                  '&::placeholder': { color: tc.f(t), opacity: 1 },
                },
              }}
            />
            <TextField
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={1}
              maxRows={3}
              size="small"
              placeholder="Description (optionnel)"
              variant="standard"
              slotProps={{ input: { disableUnderline: true } }}
              sx={{
                mt: 0.5,
                '& .MuiInputBase-input': {
                  fontSize: '0.7rem', color: tc.m(t),
                  '&::placeholder': { color: tc.f(t), opacity: 1 },
                },
              }}
            />
          </Box>

          {/* Auto stats */}
          {selectedExercises.length > 0 && (
            <Stack direction="row" spacing={1}>
              {[
                { v: String(selectedExercises.length), l: 'Exercices' },
                { v: String(totalSets), l: 'Séries' },
              ].map((s) => (
                <Box key={s.l} sx={card(t, { flex: 1, py: 1.2, textAlign: 'center' })}>
                  <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: tc.h(t), lineHeight: 1 }}>{s.v}</Typography>
                  <Typography sx={{ fontSize: '0.4rem', color: tc.f(t), mt: 0.2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</Typography>
                </Box>
              ))}
            </Stack>
          )}

          {/* Exercise table */}
          {selectedExercises.length === 0 ? (
            <Box sx={{
              border: '1px dashed',
              borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
              borderRadius: '14px', py: 4, textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: '0.75rem', color: tc.f(t) }}>
                Aucun exercice ajouté
              </Typography>
            </Box>
          ) : (
            <Box sx={card(t, { overflow: 'hidden' })}>
              {/* Table header */}
              <Stack direction="row" alignItems="center" sx={{
                px: 2, py: 0.8,
                bgcolor: d ? alpha('#fff', 0.03) : alpha('#000', 0.02),
              }}>
                <Box sx={{ width: 24 }} />
                <Typography sx={{ fontSize: '0.45rem', color: tc.f(t), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>Exercice</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tc.f(t), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 50, textAlign: 'center' }}>Sets</Typography>
                <Typography sx={{ fontSize: '0.45rem', color: tc.f(t), fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', width: 40, textAlign: 'center' }}>Repos</Typography>
                <Box sx={{ width: 28 }} />
              </Stack>

              {selectedExercises.map((ex, index) => (
                <Box key={`${ex.exerciseId}-${index}`}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    onClick={() => {
                      triggerHaptic('light');
                      setExpandedIndex(expandedIndex === index ? null : index);
                    }}
                    sx={{
                      px: 2, py: 1, cursor: 'pointer',
                      ...(index < selectedExercises.length - 1 && expandedIndex !== index ? sepSx : {}),
                      '&:active': { bgcolor: d ? alpha('#fff', 0.02) : alpha('#000', 0.01) },
                    }}
                  >
                    {/* Order controls */}
                    <Stack sx={{ width: 24, flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        disabled={index === 0}
                        onClick={(e) => { e.stopPropagation(); handleMoveExercise(index, 'up'); }}
                        sx={{ p: 0 }}
                      >
                        <CaretUp weight={W} size={14} color={index === 0 ? tc.f(t) : tc.m(t)} />
                      </IconButton>
                      <IconButton
                        size="small"
                        disabled={index === selectedExercises.length - 1}
                        onClick={(e) => { e.stopPropagation(); handleMoveExercise(index, 'down'); }}
                        sx={{ p: 0 }}
                      >
                        <CaretDown weight={W} size={14} color={index === selectedExercises.length - 1 ? tc.f(t) : tc.m(t)} />
                      </IconButton>
                    </Stack>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: tc.h(t) }} noWrap>{ex.exerciseName}</Typography>
                      <Typography sx={{ fontSize: '0.42rem', color: tc.f(t) }}>{MUSCLE_LABELS[ex.muscleGroup] || ex.muscleGroup}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: tc.m(t), width: 50, textAlign: 'center' }}>
                      {ex.targetSets}×{ex.targetReps}
                    </Typography>
                    <Typography sx={{ fontSize: '0.6rem', color: tc.f(t), width: 40, textAlign: 'center' }}>
                      {ex.restSeconds}s
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleRemoveExercise(index); }}
                      sx={{ color: tc.f(t), p: 0.25, width: 28 }}
                    >
                      <X weight={W} size={14} />
                    </IconButton>
                  </Stack>

                  {/* Expanded config */}
                  <Collapse in={expandedIndex === index}>
                    <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
                      <Stack direction="row" spacing={1.5}>
                        <TextField
                          label="Séries"
                          type="number"
                          size="small"
                          value={ex.targetSets}
                          onChange={(e) => handleUpdateExercise(index, 'targetSets', Math.max(1, parseInt(e.target.value) || 1))}
                          slotProps={{ htmlInput: { min: 1, max: 20 } }}
                          sx={{ width: 80, ...goldFieldSx(t) }}
                        />
                        <TextField
                          label="Reps"
                          size="small"
                          value={ex.targetReps}
                          onChange={(e) => handleUpdateExercise(index, 'targetReps', e.target.value)}
                          placeholder="8-12"
                          sx={{ width: 90, ...goldFieldSx(t) }}
                        />
                        <TextField
                          label="Repos (s)"
                          type="number"
                          size="small"
                          value={ex.restSeconds}
                          onChange={(e) => handleUpdateExercise(index, 'restSeconds', Math.max(0, parseInt(e.target.value) || 0))}
                          slotProps={{ htmlInput: { min: 0, max: 600, step: 15 } }}
                          sx={{ width: 100, ...goldFieldSx(t) }}
                        />
                      </Stack>
                    </Box>
                  </Collapse>
                </Box>
              ))}
            </Box>
          )}

          {/* Add exercise */}
          <Box
            onClick={() => setShowPicker(true)}
            sx={{
              border: '1px dashed',
              borderColor: d ? alpha('#fff', 0.1) : alpha('#000', 0.08),
              borderRadius: '14px', py: 2, textAlign: 'center', cursor: 'pointer',
              '&:active': { bgcolor: alpha(GOLD, 0.05) },
            }}
          >
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={0.8}>
              <Plus size={16} weight={W} color={tc.f(t)} />
              <Typography sx={{ fontSize: '0.72rem', color: tc.f(t), fontWeight: 500 }}>Ajouter un exercice</Typography>
            </Stack>
          </Box>
        </Stack>
      </Box>

      {/* Bottom save bar */}
      <Box
        sx={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          p: 2, pb: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
          bgcolor: panelBg(t),
          zIndex: 10,
        }}
      >
        <Button
          fullWidth
          disabled={!canSave}
          onClick={handleSave}
          sx={{
            py: 1.5, borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700,
            bgcolor: tc.h(t), color: surfaceBg(t), textTransform: 'none',
            '&:hover': { bgcolor: tc.h(t), opacity: 0.9 },
            '&.Mui-disabled': { bgcolor: alpha(tc.h(t), 0.3), color: surfaceBg(t) },
          }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: surfaceBg(t) }} /> : (isEdit ? 'Enregistrer' : 'Sauvegarder')}
        </Button>
      </Box>

      {/* Exercise Picker Drawer */}
      <Drawer
        anchor="bottom"
        open={showPicker}
        onClose={() => setShowPicker(false)}
        PaperProps={{
          sx: { height: '90vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: surfaceBg(t) },
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
