'use client';

import { useState, useMemo, Suspense } from 'react';
import { useBackHandler, dismissAllOverlays } from '@/hooks/useBackHandler';
import { useRouter, useSearchParams } from 'next/navigation';
import { useThemeTokens } from '@/hooks/useDark';
import { useAuth } from '@/powersync/auth-context';
import { useQuery } from '@powersync/react';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJsonArray } from '@/powersync/helpers';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import { GOLD, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldOutlinedBtnSx, dialogPaperSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Play, Trash, PencilSimple, Info } from '@phosphor-icons/react';
import ExerciseDetailModal, { type ExerciseDetail } from '@/components/workout/ExerciseDetailModal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
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
    const row = templateRows?.[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    return {
      id: row.id as string,
      name: (row.name as string) || '',
      description: (row.description as string) || null,
      targetMuscles: parseJsonArray<string>(row.target_muscles as string | null),
      estimatedDuration: row.estimated_duration as number | null,
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
    dismissAllOverlays();
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
          <Typography sx={{ fontWeight: 800, flex: 1, color: tc.h(t), fontSize: '1.1rem', letterSpacing: '-0.02em' }} noWrap>
            {template.name}
          </Typography>
          <IconButton onClick={() => router.push(`/workout/program/manual?id=${templateId}`)} size="small">
            <PencilSimple weight={W} size={20} color={tc.m(t)} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 2, pt: 2, pb: 4 }}>
        <Stack spacing={1.5}>
          {/* Stats summary */}
          <Box sx={card(t, { p: 2.5 })}>
            <Stack direction="row" justifyContent="space-around" textAlign="center">
              {[
                { v: template.estimatedDuration ? String(template.estimatedDuration) : '—', u: 'min', l: 'Durée' },
                { v: String(exerciseRows.length), u: '', l: 'Exercices' },
                { v: String(exerciseRows.reduce((s, ex) => s + (ex.target_sets || 0), 0)), u: '', l: 'Séries' },
              ].map((s, i) => (
                <Box key={s.l} sx={i > 0 ? { borderLeft: 1, borderColor: d ? alpha('#fff', 0.06) : alpha('#000', 0.06), pl: 2.5 } : undefined}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tc.h(t), lineHeight: 1 }}>
                    {s.v}<Typography component="span" sx={{ fontSize: '0.55rem', color: tc.f(t), fontWeight: 500 }}>{s.u}</Typography>
                  </Typography>
                  <Typography sx={{ fontSize: '0.45rem', color: tc.f(t), mt: 0.3, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Muscles + description */}
          <Typography sx={{ fontSize: '0.65rem', color: tc.f(t) }}>
            {template.targetMuscles.map((m) => MUSCLE_LABELS[m] || m).join(' · ')}
          </Typography>
          {template.description && (
            <Typography sx={{ fontSize: '0.7rem', color: tc.m(t) }}>
              {template.description}
            </Typography>
          )}

          {/* CTA */}
          <Button
            fullWidth
            startIcon={starting ? <CircularProgress size={18} sx={{ color: surfaceBg(t) }} /> : <Play weight="fill" size={18} />}
            onClick={handleStart}
            disabled={starting}
            sx={{
              py: 1.5, borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700,
              bgcolor: tc.h(t), color: surfaceBg(t), textTransform: 'none',
              '&:hover': { bgcolor: tc.h(t), opacity: 0.9 },
              '&.Mui-disabled': { bgcolor: alpha(tc.h(t), 0.3), color: surfaceBg(t) },
            }}
          >
            Démarrer la séance
          </Button>

          {/* Exercise list */}
          <Box sx={card(t, { p: 2.5 })}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
              {exerciseRows.length} exercice{exerciseRows.length > 1 ? 's' : ''}
            </Typography>
            {exerciseRows.map((ex, i) => (
              <Stack
                key={ex.id}
                direction="row"
                alignItems="center"
                sx={{
                  py: 1,
                  borderBottom: i < exerciseRows.length - 1 ? '1px solid' : 'none',
                  borderColor: d ? alpha('#fff', 0.05) : alpha('#000', 0.05),
                }}
              >
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: tc.f(t), width: 16, flexShrink: 0 }}>
                  {i + 1}
                </Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: tc.h(t) }} noWrap>
                    {ex.exercise_name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.5rem', color: tc.f(t) }}>
                    {ex.target_sets} × {ex.target_reps}
                    {(ex.rest_seconds ?? 0) > 0 && ` · repos ${formatRestTime(ex.rest_seconds!)}`}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setDetailExercise(toExerciseDetail(ex))}
                  sx={{ color: tc.f(t), flexShrink: 0 }}
                >
                  <Info weight={W} size={16} />
                </IconButton>
              </Stack>
            ))}
          </Box>

          {/* Delete */}
          <Button
            fullWidth
            startIcon={<Trash weight={W} size={16} />}
            onClick={() => setConfirmDelete(true)}
            sx={{ opacity: 0.4, fontSize: '0.75rem', color: tc.f(t), textTransform: 'none' }}
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
