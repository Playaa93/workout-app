'use client';

import { useState, useMemo, Suspense } from 'react';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeTokens } from '@/hooks/useDark';
import { useAuth } from '@/powersync/auth-context';
import { useQuery } from '@powersync/react';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJsonArray } from '@/powersync/helpers';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import { GOLD, GOLD_LIGHT, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldBtnSx, goldOutlinedBtnSx, dialogPaperSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Play, Trash, PencilSimple, Info, Timer } from '@phosphor-icons/react';
import ExerciseDetailModal, { type ExerciseDetail } from '@/components/workout/ExerciseDetailModal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

function formatRestTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

interface TemplateExerciseRow {
  id: string;
  exercise_id: string;
  exercise_name: string;
  name_en: string | null;
  muscle_group: string | null;
  primary_muscles: string | null;
  secondary_muscles: string | null;
  equipment: string | null;
  difficulty: string | null;
  target_sets: number;
  target_reps: string;
  rest_seconds: number | null;
  notes: string | null;
}

function toExerciseDetail(row: TemplateExerciseRow): ExerciseDetail {
  return {
    id: row.exercise_id,
    nameFr: row.exercise_name,
    nameEn: row.name_en,
    muscleGroup: row.muscle_group || '',
    primaryMuscles: parseJsonArray<string>(row.primary_muscles),
    secondaryMuscles: parseJsonArray<string>(row.secondary_muscles),
    equipment: parseJsonArray<string>(row.equipment),
    difficulty: row.difficulty,
  };
}

function ProgramDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id') ?? '';
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();

  const { data: templateRows, isLoading } = useQuery(
    templateId
      ? `SELECT * FROM workout_templates WHERE id = ?`
      : `SELECT * FROM workout_templates WHERE 0`,
    [templateId]
  );
  const { data: exerciseRows } = useQuery<TemplateExerciseRow>(
    templateId
      ? `SELECT wte.*, e.name_fr as exercise_name, e.name_en, e.muscle_group,
                e.primary_muscles, e.secondary_muscles, e.equipment, e.difficulty
         FROM workout_template_exercises wte
         LEFT JOIN exercises e ON wte.exercise_id = e.id
         WHERE wte.template_id = ?
         ORDER BY wte.order_index`
      : `SELECT * FROM workout_template_exercises WHERE 0`,
    [templateId]
  );

  const template = useMemo(() => {
    const t = templateRows?.[0] as Record<string, unknown> | undefined;
    if (!t) return null;
    return {
      id: t.id as string,
      name: (t.name as string) || '',
      description: (t.description as string) || null,
      targetMuscles: parseJsonArray<string>(t.target_muscles as string | null),
      estimatedDuration: t.estimated_duration as number | null,
    };
  }, [templateRows]);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [starting, setStarting] = useState(false);
  const [detailExercise, setDetailExercise] = useState<ExerciseDetail | null>(null);

  useBackHandler(confirmDelete, () => setConfirmDelete(false), 'detail-delete');

  const handleStart = async () => {
    setStarting(true);
    try {
      const sessionId = await mutations.startWorkoutSession(templateId);
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting session:', error);
      setStarting(false);
    }
  };

  const handleDelete = async () => {
    await mutations.deleteTemplate(templateId);
    router.push('/workout');
  };

  if (!templateId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: surfaceBg(t) }}>
        <Typography sx={{ color: tc.m(t) }}>ID manquant</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!template) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: surfaceBg(t) }}>
        <Typography sx={{ color: tc.m(t) }}>Programme introuvable</Typography>
        <Box
          onClick={() => router.push('/workout')}
          sx={{
            px: 3, py: 1, borderRadius: '14px', cursor: 'pointer',
            bgcolor: GOLD, color: GOLD_CONTRAST, fontWeight: 600, fontSize: '0.85rem',
            '&:active': { transform: 'scale(0.97)' },
          }}
        >
          Retour
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: surfaceBg(t) }}>
      {/* Header */}
      <Box
        sx={{
          px: 2, py: 1.5,
          borderBottom: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          borderRadius: 0,
          position: 'sticky', top: 0, zIndex: 10,
          bgcolor: panelBg(t),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => router.back()} edge="start">
            <ArrowLeft weight={W} size={22} color={tc.h(t)} />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, flex: 1, color: tc.h(t) }} noWrap>
            {template.name}
          </Typography>
          <IconButton onClick={() => router.push(`/workout/program/manual?id=${templateId}`)} size="small">
            <PencilSimple weight={W} size={20} color={tc.m(t)} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Info */}
        <Box sx={{ mb: 3 }}>
          {template.description && (
            <Typography variant="body2" sx={{ mb: 1.5, color: tc.m(t) }}>
              {template.description}
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {template.targetMuscles.map((m) => (
              <Chip
                key={m}
                label={MUSCLE_LABELS[m] || m}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  color: tc.m(t),
                  bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.05),
                }}
              />
            ))}
          </Stack>
          {template.estimatedDuration && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Timer weight={W} size={16} color={tc.m(t)} />
              <Typography variant="caption" sx={{ color: tc.m(t) }}>
                ~{template.estimatedDuration} min
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Exercises */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: tc.m(t) }}>
          {exerciseRows.length} exercice{exerciseRows.length > 1 ? 's' : ''}
        </Typography>

        <Stack spacing={1}>
          {exerciseRows.map((ex, i) => (
            <Box
              key={ex.id}
              sx={card(t, { px: 2, py: 1.5 })}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.05),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600, color: tc.m(t), flexShrink: 0,
                }}>
                  {i + 1}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: tc.h(t) }} noWrap>
                    {ex.exercise_name}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
                    <Typography variant="caption" sx={{ color: tc.m(t) }}>
                      {ex.target_sets} × {ex.target_reps}
                    </Typography>
                    {(ex.rest_seconds ?? 0) > 0 && (
                      <Typography variant="caption" sx={{ color: tc.f(t) }}>
                        repos {formatRestTime(ex.rest_seconds!)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDetailExercise(toExerciseDetail(ex))}
                  sx={{ color: tc.f(t), flexShrink: 0 }}
                >
                  <Info weight={W} size={18} />
                </IconButton>
              </Stack>
              {ex.notes && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', pl: 5.5, fontStyle: 'italic', color: tc.f(t) }}>
                  {ex.notes}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>

        <Box sx={{ my: 3 }} />

        {/* Actions */}
        <Stack spacing={1.5} sx={{ pb: 4 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={starting ? <CircularProgress size={20} sx={{ color: GOLD_CONTRAST }} /> : <Play weight="fill" size={20} />}
            onClick={handleStart}
            disabled={starting}
            sx={{ ...goldBtnSx, py: 1.5 }}
          >
            Démarrer la séance
          </Button>
          <Button
            fullWidth
            startIcon={<Trash weight={W} size={18} />}
            onClick={() => setConfirmDelete(true)}
            sx={{ opacity: 0.5, fontSize: '0.8rem', color: tc.f(t) }}
          >
            Supprimer ce programme
          </Button>
        </Stack>
      </Box>

      <ExerciseDetailModal
        exercise={detailExercise}
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
      />

      {/* Delete confirmation */}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: dialogPaperSx(t) }}
      >
        <DialogTitle sx={{ color: tc.h(t) }}>Supprimer ce programme ?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: tc.m(t) }}>
            Les séances déjà effectuées ne seront pas affectées.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setConfirmDelete(false)}
            variant="outlined"
            sx={{ ...goldOutlinedBtnSx, color: tc.m(t) }}
          >
            Annuler
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function ProgramDetailPage() {
  const { userId, loading } = useAuth();

  if (loading || !userId) {
    return <FullScreenLoader />;
  }
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ProgramDetailContent />
    </Suspense>
  );
}
