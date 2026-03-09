'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/powersync/auth-context';
import { useQuery } from '@powersync/react';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJsonArray } from '@/powersync/helpers';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import ExerciseDetailModal, { type ExerciseDetail } from '@/components/workout/ExerciseDetailModal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Paper from '@mui/material/Paper';
import ArrowBack from '@mui/icons-material/ArrowBack';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Delete from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Timer from '@mui/icons-material/Timer';

function formatRestTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function ProgramDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('id') ?? '';
  const mutations = useWorkoutMutations();

  const { data: templateRows, isLoading } = useQuery(
    templateId
      ? `SELECT * FROM workout_templates WHERE id = ?`
      : `SELECT * FROM workout_templates WHERE 0`,
    [templateId]
  );
  const { data: exerciseRows } = useQuery<Record<string, unknown>>(
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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">ID manquant</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!template) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">Programme introuvable</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', borderRadius: 0, position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper' }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={() => router.back()} edge="start">
            <ArrowBack />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }} noWrap>
            {template.name}
          </Typography>
          <IconButton onClick={() => router.push(`/workout/program/manual?id=${templateId}`)} size="small">
            <EditIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Paper>

      <Box sx={{ p: 2 }}>
        {/* Info */}
        <Box sx={{ mb: 3 }}>
          {template.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {template.description}
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {template.targetMuscles.map((m) => (
              <Chip key={m} label={MUSCLE_LABELS[m] || m} size="small" sx={{ height: 24, fontSize: '0.7rem' }} />
            ))}
          </Stack>
          {template.estimatedDuration && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                ~{template.estimatedDuration} min
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Exercises */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
          {exerciseRows.length} exercice{exerciseRows.length > 1 ? 's' : ''}
        </Typography>

        <Stack spacing={1}>
          {exerciseRows.map((ex, i) => (
            <Paper
              key={ex.id as string}
              variant="outlined"
              sx={{ px: 2, py: 1.5, borderRadius: 2 }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', flexShrink: 0,
                }}>
                  {i + 1}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {ex.exercise_name as string}
                  </Typography>
                  <Stack direction="row" spacing={1.5} sx={{ mt: 0.25 }}>
                    <Typography variant="caption" color="text.secondary">
                      {ex.target_sets as number} × {ex.target_reps as string}
                    </Typography>
                    {((ex.rest_seconds as number) ?? 0) > 0 && (
                      <Typography variant="caption" color="text.disabled">
                        repos {formatRestTime(ex.rest_seconds as number)}
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDetailExercise({
                    id: ex.exercise_id as string,
                    nameFr: ex.exercise_name as string,
                    nameEn: (ex.name_en as string) || null,
                    muscleGroup: (ex.muscle_group as string) || '',
                    primaryMuscles: parseJsonArray<string>(ex.primary_muscles as string | null),
                    secondaryMuscles: parseJsonArray<string>(ex.secondary_muscles as string | null),
                    equipment: parseJsonArray<string>(ex.equipment as string | null),
                    difficulty: (ex.difficulty as string) || null,
                  })}
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                >
                  <InfoOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
              {(ex.notes as string) && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', pl: 5.5, fontStyle: 'italic' }}>
                  {ex.notes as string}
                </Typography>
              )}
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Actions */}
        <Stack spacing={1.5} sx={{ pb: 4 }}>
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={starting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <PlayArrow />}
            onClick={handleStart}
            disabled={starting}
            sx={{
              py: 1.5,
              background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
              fontWeight: 600,
            }}
          >
            Démarrer la séance
          </Button>
          <Button
            fullWidth
            color="error"
            startIcon={<Delete sx={{ fontSize: 18 }} />}
            onClick={() => setConfirmDelete(true)}
            sx={{ opacity: 0.5, fontSize: '0.8rem' }}
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
      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Supprimer ce programme ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Les séances déjà effectuées ne seront pas affectées.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDelete(false)} variant="outlined">Annuler</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function ProgramDetailPage() {
  const { userId, loading } = useAuth();
  if (loading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    }>
      <ProgramDetailContent />
    </Suspense>
  );
}
