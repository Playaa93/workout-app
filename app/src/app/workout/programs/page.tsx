'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDark } from '@/hooks/useDark';
import Link from 'next/link';
import type { WorkoutTemplate } from '../types';
import { useAuth } from '@/powersync/auth-context';
import { useTemplates, useAllTemplateExercises } from '@/powersync/queries/workout-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJsonArray } from '@/powersync/helpers';
import { GOLD, GOLD_LIGHT, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldBtnSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
import { alpha } from '@mui/material/styles';
import { ArrowLeft, Play, CaretDown, CaretUp, Trash, Plus } from '@phosphor-icons/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Collapse from '@mui/material/Collapse';

export default function ProgramsPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return <FullScreenLoader />;
  }

  return <ProgramsContent />;
}

function ProgramsContent() {
  const router = useRouter();
  const d = useDark();
  const { data: templateRows, isLoading } = useTemplates();
  const { data: exerciseRows } = useAllTemplateExercises();
  const mutations = useWorkoutMutations();
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);

  const templates = useMemo<WorkoutTemplate[]>(() => {
    // Group exercises by template_id
    const exercisesByTemplate = new Map<string, WorkoutTemplate['exercises']>();
    for (const e of exerciseRows) {
      const tid = e.template_id as string;
      const list = exercisesByTemplate.get(tid) ?? [];
      list.push({
        exerciseId: e.exercise_id as string,
        exerciseName: (e as any).exercise_name || '',
        orderIndex: (e.order_index as number) || 0,
        targetSets: (e.target_sets as number) || 0,
        targetReps: (e.target_reps as string) || '',
        restSeconds: (e.rest_seconds as number) || 0,
        notes: e.notes ?? null,
      });
      exercisesByTemplate.set(tid, list);
    }

    return templateRows.map((t) => ({
      id: t.id,
      name: (t.name as string) || '',
      description: t.description ?? null,
      targetMuscles: parseJsonArray(t.target_muscles as string),
      estimatedDuration: t.estimated_duration ?? null,
      exercises: exercisesByTemplate.get(t.id) ?? [],
      createdAt: new Date((t.created_at as string) || Date.now()),
    }));
  }, [templateRows, exerciseRows]);

  const handleStartFromTemplate = async (templateId: string) => {
    setStartingTemplateId(templateId);
    try {
      const sessionId = await mutations.startWorkoutSession(templateId);
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting from template:', error);
      setStartingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Supprimer ce programme ?')) return;
    try {
      await mutations.deleteTemplate(templateId);
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(d) }}>
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          bgcolor: panelBg(d),
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton component={Link} href="/workout" size="small">
              <ArrowLeft weight={W} size={22} color={tc.h(d)} />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(d) }}>
              Programmes
            </Typography>
          </Stack>
          <IconButton
            component={Link}
            href="/workout/program"
            size="small"
            sx={{ bgcolor: GOLD, color: GOLD_CONTRAST, '&:hover': { bgcolor: GOLD_LIGHT } }}
          >
            <Plus weight="bold" size={20} />
          </IconButton>
        </Stack>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, p: 2 }}>
        {isLoading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: '14px' }} />
            ))}
          </Stack>
        ) : templates.length === 0 ? (
          <Box sx={{ ...card(d), textAlign: 'center', py: 8, px: 3 }}>
            <Typography variant="h1" sx={{ mb: 2 }}>📋</Typography>
            <Typography variant="h6" sx={{ mb: 1, color: tc.h(d) }}>
              Aucun programme
            </Typography>
            <Typography sx={{ mb: 3, color: tc.m(d) }}>
              Crée ton premier programme personnalisé basé sur ta morphologie
            </Typography>
            <Button
              component={Link}
              href="/workout/program"
              variant="contained"
              startIcon={<Plus weight="bold" size={18} />}
              sx={goldBtnSx}
            >
              Créer un programme
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {templates.map((template) => (
              <ProgramCard
                key={template.id}
                template={template}
                onStart={() => handleStartFromTemplate(template.id)}
                onDelete={() => handleDeleteTemplate(template.id)}
                isStarting={startingTemplateId !== null}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

import { MUSCLE_LABELS } from '@/lib/workout-constants';

function ProgramCard({
  template,
  onStart,
  onDelete,
  isStarting,
}: {
  template: WorkoutTemplate;
  onStart: () => void;
  onDelete: () => void;
  isStarting: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const d = useDark();

  const translateMuscle = (muscle: string) => MUSCLE_LABELS[muscle.toLowerCase()] || muscle;

  return (
    <Box sx={card(d)}>
      <Box sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(d) }} noWrap>
              {template.name}
            </Typography>
            {template.description && (
              <Typography variant="caption" sx={{ color: tc.m(d), display: 'block' }} noWrap>
                {template.description}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={onDelete} sx={{ color: tc.f(d), ml: 1 }}>
            <Trash weight={W} size={18} />
          </IconButton>
        </Stack>

        {/* Stats + Muscles inline */}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ color: tc.m(d) }}>
            {template.exercises.length} exos
          </Typography>
          {template.estimatedDuration && (
            <Typography variant="caption" sx={{ color: tc.m(d) }}>
              ~{template.estimatedDuration} min
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {template.targetMuscles.slice(0, 3).map((muscle) => (
              <Chip
                key={muscle}
                label={translateMuscle(muscle)}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  color: tc.m(d),
                  borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12),
                }}
              />
            ))}
            {template.targetMuscles.length > 3 && (
              <Chip
                label={`+${template.targetMuscles.length - 3}`}
                size="small"
                variant="outlined"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  color: tc.m(d),
                  borderColor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.12),
                }}
              />
            )}
          </Stack>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={isStarting ? <CircularProgress size={14} color="inherit" /> : <Play weight="fill" size={16} />}
            onClick={onStart}
            disabled={isStarting}
            sx={{
              ...goldBtnSx,
              flex: 1,
              fontSize: '0.8rem',
            }}
          >
            {isStarting ? '...' : 'Démarrer'}
          </Button>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ border: '1px solid', borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }}
          >
            {expanded ? <CaretUp weight={W} size={18} color={tc.m(d)} /> : <CaretDown weight={W} size={18} color={tc.m(d)} />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ mx: 2, mb: 2, borderTop: '1px solid', borderColor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.06) }} />
        <Box sx={{ px: 2, pb: 1.5, bgcolor: d ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02), borderRadius: '0 0 14px 14px' }}>
          <Stack spacing={0.75}>
            {template.exercises.map((ex, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: GOLD,
                      color: GOLD_CONTRAST,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{ flex: 1, color: tc.h(d) }}>
                    {ex.exerciseName}
                  </Typography>
                </Stack>
                <Chip
                  label={`${ex.targetSets} × ${ex.targetReps}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: '0.65rem',
                    ml: 1,
                    color: tc.m(d),
                    bgcolor: d ? alpha('#ffffff', 0.07) : alpha('#000000', 0.05),
                  }}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
