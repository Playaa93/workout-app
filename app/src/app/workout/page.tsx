'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getRecentSessions,
  getTemplates,
  startWorkoutSession,
  startWorkoutFromTemplate,
  deleteSession,
  type WorkoutSession,
  type WorkoutTemplate,
} from './actions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Bolt from '@mui/icons-material/Bolt';
import Add from '@mui/icons-material/Add';
import ChevronRight from '@mui/icons-material/ChevronRight';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Delete from '@mui/icons-material/Delete';

export default function WorkoutPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [sessionsData, templatesData] = await Promise.all([
        getRecentSessions(),
        getTemplates(),
      ]);
      setSessions(sessionsData);
      setTemplates(templatesData);
      setIsLoading(false);
    }
    load();
  }, []);

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      const sessionId = await startWorkoutSession();
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsStarting(false);
    }
  };

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

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteSession(sessionToDelete);
      setSessions(sessions.filter(s => s.id !== sessionToDelete));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSessionToDelete(null);
  };

  // Separate in-progress and completed sessions
  const inProgressSessions = sessions.filter(s => !s.endedAt);
  const completedSessions = sessions.filter(s => !!s.endedAt);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* Header */}
      <Box sx={{
        px: 2.5, pt: 2.5, pb: 3,
        background: 'linear-gradient(180deg, rgba(103,80,164,0.1) 0%, transparent 100%)',
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton component={Link} href="/" size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
            Entraînement
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: 2.5, mt: -1 }}>
        <Stack spacing={2}>
          {/* Hero CTA - Séance libre */}
          <Card sx={{
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            color: 'white',
            borderRadius: 4,
          }}>
            <CardActionArea onClick={handleStartWorkout} disabled={isStarting}>
              <CardContent sx={{ py: 3.5, px: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {isStarting
                      ? <CircularProgress size={28} sx={{ color: 'white' }} />
                      : <Bolt sx={{ fontSize: 30 }} />
                    }
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      {isStarting ? 'Démarrage...' : 'Séance libre'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Choisis tes exercices au fur et à mesure
                    </Typography>
                  </Box>
                  <ChevronRight sx={{ opacity: 0.5 }} />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* Session en cours */}
          {inProgressSessions.map((session) => {
            const date = new Date(session.startedAt);
            return (
              <Card key={session.id} sx={{ border: '2px solid', borderColor: 'warning.main', bgcolor: 'rgba(255,152,0,0.05)' }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '50%',
                      bgcolor: 'rgba(255,152,0,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <PlayArrow sx={{ color: 'warning.main' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>Séance en cours</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Commencée à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Button
                        component={Link}
                        href={`/workout/active?id=${session.id}`}
                        size="small"
                        variant="contained"
                        color="warning"
                        sx={{ fontWeight: 600, textTransform: 'none', borderRadius: 2 }}
                      >
                        Reprendre
                      </Button>
                      <IconButton size="small" onClick={() => handleDeleteClick(session.id)} sx={{ color: 'text.secondary' }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}

          {/* Programmes */}
          {isLoading ? (
            <Stack spacing={1.5}>
              <Skeleton variant="rounded" height={70} sx={{ borderRadius: 2 }} />
              <Skeleton variant="rounded" height={70} sx={{ borderRadius: 2 }} />
            </Stack>
          ) : templates.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Mes Programmes
                </Typography>
                <Button
                  component={Link}
                  href="/workout/program"
                  size="small"
                  startIcon={<Add sx={{ fontSize: 16 }} />}
                  sx={{ fontSize: '0.75rem', textTransform: 'none', color: 'primary.main' }}
                >
                  Créer
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {templates.map((t) => (
                  <Card key={t.id}>
                    <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                          width: 50, height: 50, borderRadius: 3,
                          background: 'linear-gradient(135deg, rgba(187,134,252,0.15), rgba(103,80,164,0.08))',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <FitnessCenter sx={{ color: '#bb86fc', fontSize: 24 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body1" fontWeight={600} noWrap>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {t.targetMuscles.join(' · ')}{t.estimatedDuration ? ` · ~${t.estimatedDuration} min` : ''}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleStartFromTemplate(t.id)}
                          disabled={startingTemplateId === t.id}
                          startIcon={startingTemplateId === t.id
                            ? <CircularProgress size={14} />
                            : <PlayArrow sx={{ fontSize: 16 }} />
                          }
                          sx={{
                            borderRadius: 2.5, borderColor: 'divider', color: 'text.primary',
                            fontSize: '0.75rem', fontWeight: 600, textTransform: 'none',
                            minWidth: 'auto', px: 1.5, flexShrink: 0,
                          }}
                        >
                          Go
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}

          {/* Lien créer programme si aucun */}
          {!isLoading && templates.length === 0 && (
            <Card sx={{ border: '1px dashed', borderColor: 'divider' }}>
              <CardActionArea component={Link} href="/workout/program">
                <CardContent sx={{ py: 2.5, textAlign: 'center' }}>
                  <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                    <Add sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Créer un programme
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          )}

          {/* Historique - Style B (inline PR + stats bar) */}
          <Box sx={{ pb: 4 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Dernières séances
            </Typography>

            {isLoading ? (
              <Skeleton variant="rounded" height={200} sx={{ borderRadius: 2 }} />
            ) : completedSessions.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 5 }}>
                <CardContent>
                  <FitnessCenter sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                    Pas encore de séance
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ta première séance t&apos;attend !
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <Stack divider={<Divider />}>
                  {completedSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onDelete={() => handleDeleteClick(session.id)}
                    />
                  ))}
                </Stack>
              </Card>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Supprimer la séance ?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Cette action est irréversible. Toutes les données de cette séance seront perdues.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDeleteCancel} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SessionCard({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const date = new Date(session.startedAt);
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formattedTime = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;
  const [showDelete, setShowDelete] = useState(false);

  return (
    <Box
      sx={{ px: 2.5, py: 2 }}
      onClick={() => setShowDelete(!showDelete)}
    >
      {/* Row 1: Name + PR inline + date */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ textTransform: 'capitalize' }}>
            {formattedDate}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formattedTime}
          </Typography>
        </Stack>
        {showDelete ? (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ color: 'error.main', ml: 1 }}
          >
            <Delete fontSize="small" />
          </IconButton>
        ) : null}
      </Stack>

      {/* Row 2: Stats bar */}
      <Stack
        direction="row"
        spacing={0}
        sx={{
          mt: 1.5,
          bgcolor: 'action.hover',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ flex: 1, py: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {session.durationMinutes || 0} min
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            Durée
          </Typography>
        </Box>
        <Box sx={{ flex: 1, py: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            Volume
          </Typography>
        </Box>
        <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {session.caloriesBurned || 0}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
            kcal
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
