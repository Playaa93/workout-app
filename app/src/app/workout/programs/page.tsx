'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getTemplates,
  startWorkoutFromTemplate,
  deleteTemplate,
  type WorkoutTemplate,
} from '../actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import ArrowBack from '@mui/icons-material/ArrowBack';
import PlayArrow from '@mui/icons-material/PlayArrow';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';
import Delete from '@mui/icons-material/Delete';
import Add from '@mui/icons-material/Add';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import Timer from '@mui/icons-material/Timer';

export default function ProgramsPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getTemplates();
      setTemplates(data);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleStartFromTemplate = async (templateId: string) => {
    setStartingTemplateId(templateId);
    try {
      const { sessionId } = await startWorkoutFromTemplate(templateId);
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting from template:', error);
      setStartingTemplateId(null);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Supprimer ce programme ?')) return;
    try {
      await deleteTemplate(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <IconButton component={Link} href="/workout" size="small">
              <ArrowBack />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600}>
              Programmes
            </Typography>
          </Stack>
          <IconButton
            component={Link}
            href="/workout/program"
            size="small"
            color="primary"
            sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            <Add />
          </IconButton>
        </Stack>
      </Paper>

      {/* Content */}
      <Box sx={{ flex: 1, p: 2 }}>
        {isLoading ? (
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 2 }} />
            ))}
          </Stack>
        ) : templates.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <CardContent>
              <Typography variant="h1" sx={{ mb: 2 }}>📋</Typography>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Aucun programme
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Crée ton premier programme personnalisé basé sur ta morphologie
              </Typography>
              <Button
                component={Link}
                href="/workout/program"
                variant="contained"
                startIcon={<Add />}
              >
                Créer un programme
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {templates.map((template) => (
              <ProgramCard
                key={template.id}
                template={template}
                onStart={() => handleStartFromTemplate(template.id)}
                onDelete={() => handleDeleteTemplate(template.id)}
                isStarting={startingTemplateId === template.id}
              />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

// Traduction des muscles
const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  arms: 'Bras',
  legs: 'Jambes',
  core: 'Abdos',
  full_body: 'Full Body',
};

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

  const translateMuscle = (muscle: string) => MUSCLE_LABELS[muscle.toLowerCase()] || muscle;

  return (
    <Card>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {template.name}
            </Typography>
            {template.description && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {template.description}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={onDelete} sx={{ color: 'text.secondary', ml: 1 }}>
            <Delete fontSize="small" />
          </IconButton>
        </Stack>

        {/* Stats + Muscles inline */}
        <Stack direction="row" spacing={2} sx={{ mt: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="caption" color="text.secondary">
            {template.exercises.length} exos
          </Typography>
          {template.estimatedDuration && (
            <Typography variant="caption" color="text.secondary">
              ~{template.estimatedDuration} min
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
            {template.targetMuscles.slice(0, 3).map((muscle) => (
              <Chip key={muscle} label={translateMuscle(muscle)} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            ))}
            {template.targetMuscles.length > 3 && (
              <Chip label={`+${template.targetMuscles.length - 3}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
            )}
          </Stack>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={isStarting ? <CircularProgress size={14} color="inherit" /> : <PlayArrow fontSize="small" />}
            onClick={onStart}
            disabled={isStarting}
            sx={{ flex: 1, fontSize: '0.8rem' }}
          >
            {isStarting ? '...' : 'Démarrer'}
          </Button>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ border: 1, borderColor: 'divider' }}
          >
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </Stack>
      </CardContent>

      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover' }}>
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
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
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
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {ex.exerciseName}
                  </Typography>
                </Stack>
                <Chip
                  label={`${ex.targetSets} × ${ex.targetReps}`}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem', ml: 1 }}
                />
              </Stack>
            ))}
          </Stack>
        </Box>
      </Collapse>
    </Card>
  );
}
