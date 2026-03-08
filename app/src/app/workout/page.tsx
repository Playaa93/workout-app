'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  WorkoutSession,
  WorkoutTemplate,
  ExportSessionData,
} from './types';
import { importCardioSession } from './cardio-actions';
import { useAuth } from '@/powersync/auth-context';
import {
  useRecentSessions,
  useTemplates,
  useAllSessionsForExport,
  useAllSetsForExport,
} from '@/powersync/queries/workout-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import { compressImage } from '@/lib/image-utils';
import type { CardioActivity } from '@/db/schema';
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
import Drawer from '@mui/material/Drawer';
import SwipeableDrawer from '@mui/material/SwipeableDrawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBack from '@mui/icons-material/ArrowBack';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Bolt from '@mui/icons-material/Bolt';
import Add from '@mui/icons-material/Add';
import ChevronRight from '@mui/icons-material/ChevronRight';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import FileDownload from '@mui/icons-material/FileDownload';
import Description from '@mui/icons-material/Description';
import DataObject from '@mui/icons-material/DataObject';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Watch from '@mui/icons-material/Watch';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import { parseJsonArray } from '@/powersync/helpers';
import BottomNav from '@/components/BottomNav';
import { downloadFile, fmtDateFR, fmtTimeFR, formatDuration, escapeHtml, writeExcelFile, openPrintableHtml } from '@/lib/export-utils';

export default function WorkoutPage() {
  const { userId, loading: authLoading } = useAuth();

  if (authLoading || !userId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <WorkoutContent />;
}

function WorkoutContent() {
  const router = useRouter();
  const mutations = useWorkoutMutations();

  // PowerSync reactive hooks
  const { data: sessionRows, isLoading: sessionsLoading } = useRecentSessions();
  const { data: templateRows, isLoading: templatesLoading } = useTemplates();
  const isLoading = sessionsLoading || templatesLoading;

  // Map sessions
  const sessions = useMemo<WorkoutSession[]>(() => {
    return sessionRows.map((s: any) => ({
      id: s.id,
      startedAt: new Date(s.started_at),
      endedAt: s.ended_at ? new Date(s.ended_at) : null,
      durationMinutes: s.duration_minutes,
      totalVolume: s.total_volume,
      caloriesBurned: s.calories_burned,
      notes: s.notes,
      sessionType: s.session_type,
      cardioActivity: s.cardio_activity,
      distanceMeters: s.distance_meters,
      avgPaceSecondsPerKm: s.avg_pace_seconds_per_km,
      avgSpeedKmh: s.avg_speed_kmh,
    }));
  }, [sessionRows]);

  // Map templates
  const templates = useMemo<WorkoutTemplate[]>(() => {
    return templateRows.map((t: any) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      targetMuscles: parseJsonArray<string>(t.target_muscles),
      estimatedDuration: t.estimated_duration,
      exercises: [],
      createdAt: new Date(t.created_at),
    }));
  }, [templateRows]);

  const [isStarting, setIsStarting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [showNewSessionDrawer, setShowNewSessionDrawer] = useState(false);
  const [drawerView, setDrawerView] = useState<'main' | 'cardio'>('main');
  const [startingCardio, setStartingCardio] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importData, setImportData] = useState<{
    activity: string;
    durationMinutes: number | null;
    distanceMeters: number | null;
    avgPaceSecondsPerKm: number | null;
    avgHeartRate: number | null;
    maxHeartRate: number | null;
    caloriesBurned: number | null;
    dateTime: string | null;
    confidence: number;
  } | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const handleStartWorkout = async () => {
    setIsStarting(true);
    try {
      const sessionId = await mutations.startWorkoutSession();
      router.push(`/workout/active?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsStarting(false);
    }
  };


  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionToDelete) return;
    try {
      await mutations.deleteSession(sessionToDelete);
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

  const handleStartCardio = async (activity: CardioActivity) => {
    setStartingCardio(true);
    try {
      const sessionId = await mutations.startCardioSession(activity);
      router.push(`/workout/cardio?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting cardio:', error);
      setStartingCardio(false);
      setShowNewSessionDrawer(false);
    }
  };

  const handleImportScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImportLoading(true);
    setShowNewSessionDrawer(false);
    try {
      const imageBase64 = await compressImage(file);
      const res = await fetch('/api/recognize-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      const json = await res.json();
      if (!res.ok || !json.workout) {
        setSnackbar({ open: true, message: json.error || 'Erreur de reconnaissance', severity: 'error' });
        return;
      }
      setImportData(json.workout);
      setImportDialogOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors de l\'import', severity: 'error' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importData || !importData.durationMinutes) return;
    setImportSaving(true);
    try {
      const result = await importCardioSession({
        activity: importData.activity as CardioActivity,
        durationMinutes: importData.durationMinutes,
        distanceMeters: importData.distanceMeters ?? undefined,
        avgPaceSecondsPerKm: importData.avgPaceSecondsPerKm ?? undefined,
        avgHeartRate: importData.avgHeartRate ?? undefined,
        maxHeartRate: importData.maxHeartRate ?? undefined,
        caloriesBurned: importData.caloriesBurned ?? undefined,
        dateTime: importData.dateTime ?? undefined,
      });
      setImportDialogOpen(false);
      setImportData(null);
      setSnackbar({ open: true, message: `Séance importée ! +${result.xpEarned} XP`, severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde', severity: 'error' });
    } finally {
      setImportSaving(false);
    }
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
          {/* CTA Nouvelle séance */}
          <Card sx={{
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            color: 'white',
            borderRadius: 3,
          }}>
            <CardActionArea onClick={() => { setDrawerView('main'); setShowNewSessionDrawer(true); }}>
              <CardContent sx={{ py: 2, px: 2.5, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Add sx={{ fontSize: 24 }} />
                  </Box>
                  <Typography variant="body1" fontWeight={700} sx={{ flex: 1 }}>
                    Nouvelle séance
                  </Typography>
                  <ChevronRight sx={{ opacity: 0.5 }} />
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* Session en cours */}
          {inProgressSessions.map((session) => {
            const date = new Date(session.startedAt);
            const isCardio = session.sessionType === 'cardio';
            const resumeHref = isCardio
              ? `/workout/cardio?id=${session.id}`
              : `/workout/active?id=${session.id}`;
            const activityInfo = isCardio && session.cardioActivity
              ? CARDIO_ACTIVITIES[session.cardioActivity as CardioActivity]
              : null;
            return (
              <Card key={session.id} sx={{ border: '2px solid', borderColor: 'warning.main', bgcolor: 'rgba(255,152,0,0.05)' }}>
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: '50%',
                      bgcolor: 'rgba(255,152,0,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: activityInfo ? '1.2rem' : undefined,
                    }}>
                      {activityInfo ? activityInfo.emoji : <PlayArrow sx={{ color: 'warning.main' }} />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {isCardio ? `Cardio en cours — ${activityInfo?.label || 'Cardio'}` : 'Séance en cours'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Commencée à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Button
                        component={Link}
                        href={resumeHref}
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
                  <Card key={t.id} component={Link} href={`/workout/program/detail?id=${t.id}`} sx={{ textDecoration: 'none', color: 'inherit', '&:active': { opacity: 0.8 } }}>
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
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            {t.targetMuscles.map((m) => (
                              <Chip
                                key={m}
                                label={MUSCLE_LABELS[m] || m}
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem', fontWeight: 500 }}
                              />
                            ))}
                          </Stack>
                        </Box>
                        <ChevronRight sx={{ color: 'text.disabled', flexShrink: 0 }} />
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
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Dernières séances
              </Typography>
              {completedSessions.length > 0 && (
                <IconButton size="small" onClick={() => setShowExport(true)} sx={{ color: 'text.secondary' }}>
                  <FileDownload fontSize="small" />
                </IconButton>
              )}
            </Stack>

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
                    />
                  ))}
                </Stack>
              </Card>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />

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

      {/* New Session Drawer */}
      <Drawer
        anchor="bottom"
        open={showNewSessionDrawer}
        onClose={() => { setShowNewSessionDrawer(false); setDrawerView('main'); }}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: 'background.paper', maxHeight: '70vh' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            {drawerView === 'cardio' ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => setDrawerView('main')}>
                  <ArrowBack fontSize="small" />
                </IconButton>
                <Typography variant="h6" fontWeight={600}>
                  Choisir une activité
                </Typography>
              </Stack>
            ) : (
              <Typography variant="h6" fontWeight={600}>
                Nouvelle séance
              </Typography>
            )}
            <IconButton onClick={() => { setShowNewSessionDrawer(false); setDrawerView('main'); }}>
              <Close />
            </IconButton>
          </Stack>

          {isStarting || startingCardio || importLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1 }}>
              <CircularProgress />
              {importLoading && (
                <Typography variant="body2" color="text.secondary">
                  Analyse du screenshot...
                </Typography>
              )}
            </Box>
          ) : drawerView === 'main' ? (
            <List>
              <ListItemButton
                onClick={handleStartWorkout}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <Box sx={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mr: 2,
                }}>
                  <Bolt sx={{ color: 'white', fontSize: 22 }} />
                </Box>
                <ListItemText
                  primary="Séance libre"
                  secondary="Choisis tes exercices au fur et à mesure"
                />
                <ChevronRight sx={{ color: 'text.disabled' }} />
              </ListItemButton>
              <ListItemButton
                onClick={() => setDrawerView('cardio')}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <Box sx={{
                  width: 40, height: 40, borderRadius: '50%',
                  bgcolor: 'action.hover',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mr: 2, fontSize: '1.2rem',
                }}>
                  🏃
                </Box>
                <ListItemText
                  primary="Séance cardio"
                  secondary="Course, vélo, rameur..."
                />
                <ChevronRight sx={{ color: 'text.disabled' }} />
              </ListItemButton>
            </List>
          ) : (
            <>
              <List>
                {(Object.entries(CARDIO_ACTIVITIES) as [CardioActivity, { label: string; emoji: string }][]).map(
                  ([key, { label, emoji }]) => (
                    <ListItemButton
                      key={key}
                      onClick={() => handleStartCardio(key)}
                      sx={{ borderRadius: 2, mb: 0.5 }}
                    >
                      <Typography sx={{ fontSize: '1.3rem', mr: 2 }}>{emoji}</Typography>
                      <ListItemText primary={label} />
                      <ChevronRight sx={{ color: 'text.disabled' }} />
                    </ListItemButton>
                  )
                )}
              </List>
              <Divider sx={{ my: 1 }} />
              <Button
                component="label"
                size="small"
                fullWidth
                startIcon={<PhotoCamera />}
                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500 }}
              >
                Importer depuis un screenshot
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImportScreenshot}
                />
              </Button>
              <Button
                size="small"
                fullWidth
                startIcon={<Watch />}
                onClick={async () => {
                  setShowNewSessionDrawer(false);
                  setImportLoading(true);
                  try {
                    const res = await fetch('/api/huawei/sync', { method: 'POST' });
                    const data = await res.json();
                    if (!res.ok) {
                      setSnackbar({ open: true, message: data.error || 'Erreur sync Huawei', severity: 'error' });
                      return;
                    }
                    setSnackbar({
                      open: true,
                      message: data.imported > 0
                        ? `${data.imported} séance(s) Huawei importée(s) ! +${data.totalXp} XP`
                        : 'Aucune nouvelle séance Huawei',
                      severity: 'success',
                    });
                    // Data will auto-update via PowerSync sync
                  } catch {
                    setSnackbar({ open: true, message: 'Erreur sync Huawei', severity: 'error' });
                  } finally {
                    setImportLoading(false);
                  }
                }}
                sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 500 }}
              >
                Sync Huawei Health
              </Button>
            </>
          )}
        </Box>
      </Drawer>
      {/* Import Confirmation Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={() => { setImportDialogOpen(false); setImportData(null); }}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Confirmer l&apos;import</DialogTitle>
        <DialogContent>
          {importData && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Activité"
                select
                value={importData.activity}
                onChange={(e) => setImportData({ ...importData, activity: e.target.value })}
                size="small"
                SelectProps={{ native: true }}
              >
                {(Object.entries(CARDIO_ACTIVITIES) as [string, { label: string }][]).map(
                  ([key, { label }]) => (
                    <option key={key} value={key}>{label}</option>
                  )
                )}
              </TextField>
              <TextField
                label="Durée (min)"
                type="number"
                value={importData.durationMinutes ?? ''}
                onChange={(e) => setImportData({ ...importData, durationMinutes: e.target.value ? Number(e.target.value) : null })}
                size="small"
              />
              <TextField
                label="Distance (m)"
                type="number"
                value={importData.distanceMeters ?? ''}
                onChange={(e) => setImportData({ ...importData, distanceMeters: e.target.value ? Number(e.target.value) : null })}
                size="small"
              />
              <TextField
                label="Allure (sec/km)"
                type="number"
                value={importData.avgPaceSecondsPerKm ?? ''}
                onChange={(e) => setImportData({ ...importData, avgPaceSecondsPerKm: e.target.value ? Number(e.target.value) : null })}
                size="small"
              />
              <Stack direction="row" spacing={1}>
                <TextField
                  label="FC moy (bpm)"
                  type="number"
                  value={importData.avgHeartRate ?? ''}
                  onChange={(e) => setImportData({ ...importData, avgHeartRate: e.target.value ? Number(e.target.value) : null })}
                  size="small"
                  fullWidth
                />
                <TextField
                  label="FC max (bpm)"
                  type="number"
                  value={importData.maxHeartRate ?? ''}
                  onChange={(e) => setImportData({ ...importData, maxHeartRate: e.target.value ? Number(e.target.value) : null })}
                  size="small"
                  fullWidth
                />
              </Stack>
              <TextField
                label="Calories"
                type="number"
                value={importData.caloriesBurned ?? ''}
                onChange={(e) => setImportData({ ...importData, caloriesBurned: e.target.value ? Number(e.target.value) : null })}
                size="small"
              />
              {importData.confidence < 0.7 && (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  Confiance faible ({Math.round(importData.confidence * 100)}%) — vérifie les données
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setImportDialogOpen(false); setImportData(null); }} color="inherit">
            Annuler
          </Button>
          <Button
            onClick={handleImportConfirm}
            variant="contained"
            disabled={importSaving || !importData?.durationMinutes}
          >
            {importSaving ? <CircularProgress size={20} /> : 'Importer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Drawer */}
      {showExport && <WorkoutExportDrawer open={showExport} onClose={() => setShowExport(false)} />}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}


function SessionCard({ session }: { session: WorkoutSession }) {
  const router = useRouter();
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

  const isCardio = session.sessionType === 'cardio';
  const activityInfo = isCardio && session.cardioActivity
    ? CARDIO_ACTIVITIES[session.cardioActivity as CardioActivity]
    : null;
  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;
  const distanceM = session.distanceMeters ? parseFloat(session.distanceMeters) : 0;

  const mins = session.durationMinutes || 0;
  const durationFormatted = formatDuration(mins);

  return (
    <Box
      sx={{ px: 2.5, py: 2, cursor: 'pointer', '&:active': { bgcolor: 'action.hover' } }}
      onClick={() => router.push(`/workout/session?id=${session.id}`)}
    >
      {/* Row 1: Name + date */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
          {isCardio && activityInfo ? (
            <>
              <Typography component="span" sx={{ fontSize: '1rem' }}>{activityInfo.emoji}</Typography>
              <Typography variant="body2" fontWeight={600} noWrap>
                {activityInfo.label}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" fontWeight={600} noWrap sx={{ textTransform: 'capitalize' }}>
              {formattedDate}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {isCardio ? formattedDate : formattedTime}
          </Typography>
          <Chip label={durationFormatted} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
        </Stack>
        <ChevronRight sx={{ color: 'text.disabled', fontSize: 20 }} />
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
        {isCardio ? (
          <>
            <Box sx={{ flex: 1, py: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {distanceM > 0 ? formatDistance(distanceM) : '—'}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                Distance
              </Typography>
            </Box>
            <Box sx={{ flex: 1, py: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {session.avgPaceSecondsPerKm ? formatPace(session.avgPaceSecondsPerKm) : '—'}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                Allure
              </Typography>
            </Box>
            <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {session.caloriesBurned || '—'}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                kcal
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Box sx={{ flex: 1, py: 1, textAlign: 'center', borderRight: 1, borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                Volume
              </Typography>
            </Box>
            {session.caloriesBurned != null && session.caloriesBurned > 0 && (
              <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
                <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {session.caloriesBurned}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                  kcal
                </Typography>
              </Box>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}

// =========================================================
// Export Drawer
// =========================================================
function WorkoutExportDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: sessionExportRows } = useAllSessionsForExport();
  const { data: setExportRows } = useAllSetsForExport();

  const sessions = useMemo<ExportSessionData[]>(() => {
    // Group sets by session
    const setsBySession = new Map<string, any[]>();
    for (const s of setExportRows as any[]) {
      const list = setsBySession.get(s.session_id) || [];
      list.push(s);
      setsBySession.set(s.session_id, list);
    }

    return sessionExportRows.map((s: any) => ({
      id: s.id,
      startedAt: new Date(s.started_at),
      endedAt: s.ended_at ? new Date(s.ended_at) : null,
      durationMinutes: s.duration_minutes,
      totalVolume: s.total_volume,
      caloriesBurned: s.calories_burned,
      perceivedDifficulty: s.perceived_difficulty,
      energyLevel: s.energy_level,
      notes: s.notes,
      sessionType: s.session_type,
      cardioActivity: s.cardio_activity,
      distanceMeters: s.distance_meters,
      avgPaceSecondsPerKm: s.avg_pace_seconds_per_km,
      sets: (setsBySession.get(s.id) || []).map((set: any) => ({
        exerciseId: set.exercise_id,
        exerciseName: set.exercise_name || '',
        muscleGroup: set.muscle_group || '',
        setNumber: set.set_number,
        reps: set.reps,
        weight: set.weight,
        rpe: set.rpe,
        isWarmup: !!set.is_warmup,
        isPr: !!set.is_pr,
      })),
    }));
  }, [sessionExportRows, setExportRows]);

  const exportExcel = () => {
    const headers = [
      'Date', 'Heure', 'Type', 'Activité', 'Durée (min)', 'Volume total (kg)',
      'Distance (m)', 'Allure (s/km)', 'Calories (kcal)', 'Difficulté', 'Énergie',
      'Exercice', 'Groupe musculaire', 'Série', 'Reps', 'Poids (kg)', 'RPE',
      'Échauffement', 'Record', 'Notes',
    ];
    const rows: (string | number | null)[][] = [];
    for (const s of sessions) {
      const base: (string | number | null)[] = [
        fmtDateFR(s.startedAt), fmtTimeFR(s.startedAt),
        s.sessionType === 'cardio' ? 'Cardio' : 'Musculation',
        s.cardioActivity || '', s.durationMinutes ?? null,
        s.totalVolume ? parseFloat(s.totalVolume) : null, s.distanceMeters ? parseFloat(s.distanceMeters) : null,
        s.avgPaceSecondsPerKm ?? null, s.caloriesBurned ?? null,
        s.perceivedDifficulty ?? null, s.energyLevel ?? null,
      ];
      const notes = s.notes || '';
      if (s.sets.length === 0) {
        rows.push([...base, '', '', null, null, null, null, '', '', notes]);
      } else {
        for (const set of s.sets) {
          rows.push([
            ...base, set.exerciseName, set.muscleGroup, set.setNumber,
            set.reps ?? null, set.weight ? parseFloat(set.weight) : null, set.rpe ?? null,
            set.isWarmup ? 'Oui' : 'Non', set.isPr ? 'Oui' : 'Non', notes,
          ]);
        }
      }
    }
    writeExcelFile(headers, rows, 'Séances', `seances_${new Date().toISOString().split('T')[0]}.xlsx`);
    onClose();
  };

  const exportJSON = () => {
    const out = sessions.map(s => {
      const exerciseMap = new Map<string, { nom: string; groupe: string; series: { serie: number; reps: number | null; poids: string | null; rpe: number | null; echauffement: boolean; record: boolean }[] }>();
      for (const set of s.sets) {
        if (!exerciseMap.has(set.exerciseId)) {
          exerciseMap.set(set.exerciseId, { nom: set.exerciseName, groupe: set.muscleGroup, series: [] });
        }
        exerciseMap.get(set.exerciseId)!.series.push({
          serie: set.setNumber,
          reps: set.reps,
          poids: set.weight,
          rpe: set.rpe,
          echauffement: !!set.isWarmup,
          record: !!set.isPr,
        });
      }
      return {
        date: fmtDateFR(s.startedAt),
        heure: fmtTimeFR(s.startedAt),
        type: s.sessionType || 'strength',
        activite: s.cardioActivity || undefined,
        duree: s.durationMinutes,
        volume: s.totalVolume ? parseFloat(s.totalVolume) : 0,
        distance: s.distanceMeters ? parseFloat(s.distanceMeters) : undefined,
        allure: s.avgPaceSecondsPerKm || undefined,
        calories: s.caloriesBurned,
        difficulte: s.perceivedDifficulty,
        energie: s.energyLevel,
        notes: s.notes || undefined,
        exercices: Array.from(exerciseMap.values()),
      };
    });
    downloadFile(JSON.stringify(out, null, 2), `seances_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    onClose();
  };

  const exportPDF = () => {
    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Historique d'entraînement</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1a1a1a; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 13px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #6750a4; color: white; padding: 8px 10px; text-align: left; font-weight: 600; white-space: nowrap; }
  td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; white-space: nowrap; }
  tr:nth-child(even) td { background: #f8f6ff; }
  tr:hover td { background: #ece6ff; }
  .footer { margin-top: 24px; font-size: 11px; color: #999; text-align: center; }
  @media print { body { padding: 16px; } }
</style>
</head>
<body>
<h1>Historique d'entraînement</h1>
<p class="subtitle">${sessions.length} séance${sessions.length > 1 ? 's' : ''} &middot; Export du ${fmtDateFR(new Date())}</p>
<table>
<thead><tr><th>Date</th><th>Type</th><th>Durée</th><th>Volume / Distance</th><th>Calories</th><th>Nb exercices</th></tr></thead>
<tbody>
${sessions.map(s => {
  const type = s.sessionType === 'cardio' ? (s.cardioActivity || 'Cardio') : 'Musculation';
  const dur = s.durationMinutes ? formatDuration(s.durationMinutes) : '-';
  const volOrDist = s.sessionType === 'cardio'
    ? (s.distanceMeters ? `${(parseFloat(s.distanceMeters) / 1000).toFixed(2)} km` : '-')
    : (s.totalVolume ? `${parseFloat(s.totalVolume).toFixed(0)} kg` : '-');
  const cal = s.caloriesBurned ?? '-';
  const nbEx = new Set(s.sets.map(st => st.exerciseId)).size || '-';
  return `<tr><td>${fmtDateFR(s.startedAt)}</td><td>${escapeHtml(type)}</td><td>${dur}</td><td>${volOrDist}</td><td>${cal}</td><td>${nbEx}</td></tr>`;
}).join('\n')}
</tbody>
</table>
<p class="footer">Généré depuis l'app Workout</p>
<script>window.onload=function(){window.print()}<\/script>
</body>
</html>`;

    openPrintableHtml(html);
    onClose();
  };

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'action.disabled' }} />
      </Box>
      <Box sx={{ px: 1, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ px: 1.5, pt: 0.5, pb: 1 }}>
          Exporter les séances
        </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, display: 'block', mb: 1 }}>
              {sessions.length} séance{sessions.length > 1 ? 's' : ''}
            </Typography>

            <ListItemButton onClick={exportExcel} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Description sx={{ color: '#4caf50' }} />
              </ListItemIcon>
              <ListItemText
                primary="Excel (.xlsx)"
                secondary="Fichier Excel avec colonnes formatées"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>

            <ListItemButton onClick={exportJSON} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DataObject sx={{ color: '#ff9800' }} />
              </ListItemIcon>
              <ListItemText
                primary="JSON"
                secondary="Format brut pour traitement de données"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>

            <ListItemButton onClick={exportPDF} sx={{ borderRadius: 2 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PictureAsPdf sx={{ color: '#f44336' }} />
              </ListItemIcon>
              <ListItemText
                primary="PDF"
                secondary="Tableau résumé imprimable via le navigateur"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
      </Box>
    </SwipeableDrawer>
  );
}
