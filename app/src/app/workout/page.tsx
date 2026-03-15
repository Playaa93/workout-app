'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  EnrichedWorkoutSession,
  WorkoutTemplate,
} from './types';
import { useAuth } from '@/powersync/auth-context';
import {
  useRecentSessions,
  useTemplates,
} from '@/powersync/queries/workout-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import { compressImage } from '@/lib/image-utils';
import type { CardioActivity } from '@/db/schema';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import {
  ArrowLeft,
  Lightning,
  CaretRight,
  X,
  Trash,
  Camera,
  PencilSimple,
  Sparkle,
} from '@phosphor-icons/react';
import { useThemeTokens } from '@/hooks/useDark';
import { alpha } from '@mui/material/styles';
import { MUSCLE_LABELS } from '@/lib/workout-constants';
import { parseJsonArray } from '@/powersync/helpers';
import BottomNav from '@/components/BottomNav';
import { GOLD, GOLD_LIGHT, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg } from '@/lib/design-tokens';
import { formatDuration } from '@/lib/export-utils';

const MAX_EXERCISES_SHOWN = 3;

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
  const { t, d } = useThemeTokens();

  // PowerSync reactive hooks
  const { data: sessionRows, isLoading: sessionsLoading } = useRecentSessions();
  const { data: templateRows, isLoading: templatesLoading } = useTemplates();
  const isLoading = sessionsLoading || templatesLoading;

  // Map sessions
  const sessions = useMemo<EnrichedWorkoutSession[]>(() => {
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
      templateName: s.template_name || null,
      exerciseNames: s.exercise_names ? s.exercise_names.split(',') : [],
      muscleGroups: s.muscle_groups ? s.muscle_groups.split(',').filter(Boolean) : [],
      exerciseCount: s.exercise_count ?? 0,
    }));
  }, [sessionRows]);

  // Map templates
  const templates = useMemo<WorkoutTemplate[]>(() => {
    return templateRows.map((tpl: any) => ({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      targetMuscles: parseJsonArray<string>(tpl.target_muscles),
      estimatedDuration: tpl.estimated_duration,
      exercises: [],
      createdAt: new Date(tpl.created_at),
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
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
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
      const { importCardioSession } = await import('./cardio-actions');
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

  const cellSx = card(t, { p: 2.5 })
  const lblSx = { fontSize: '0.6rem', fontWeight: 600, color: tc.f(t), letterSpacing: '0.1em', textTransform: 'uppercase' as const }
  const sepSx = { borderBottom: '1px solid', borderColor: alpha(d ? '#fff' : '#000', 0.05) }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: surfaceBg(t) }}>
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2.5 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: tc.h(t), letterSpacing: '-0.03em' }}>
          Entraînement
        </Typography>
      </Box>

      <Box sx={{ px: 3 }}>
        <Stack spacing={1.5}>
          {/* CTA — inverted */}
          <Button
            fullWidth
            onClick={() => { setDrawerView('main'); setShowNewSessionDrawer(true); }}
            sx={{
              py: 1.5, borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700,
              bgcolor: tc.h(t), color: surfaceBg(t), textTransform: 'none',
              '&:hover': { bgcolor: tc.h(t), opacity: 0.9 },
            }}
          >
            + Nouvelle séance
          </Button>

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
              <Box key={session.id} sx={card(t, { p: 2, borderColor: alpha(GOLD, 0.3) })}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: GOLD, boxShadow: `0 0 8px ${alpha(GOLD, 0.5)}`, flexShrink: 0 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tc.h(t) }}>
                      {isCardio ? `Cardio en cours — ${activityInfo?.label || 'Cardio'}` : 'Séance en cours'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.5rem', color: tc.f(t) }}>
                      Depuis {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    href={resumeHref}
                    size="small"
                    sx={{ fontWeight: 600, textTransform: 'none', fontSize: '0.7rem', color: GOLD }}
                  >
                    Reprendre
                  </Button>
                  <IconButton size="small" onClick={() => handleDeleteClick(session.id)} sx={{ color: tc.f(t) }}>
                    <Trash size={16} weight={W} />
                  </IconButton>
                </Stack>
              </Box>
            );
          })}

          {/* Programmes */}
          {isLoading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={64} sx={{ borderRadius: '14px' }} />
              <Skeleton variant="rounded" height={64} sx={{ borderRadius: '14px' }} />
            </Stack>
          ) : templates.length > 0 && (
            <Box sx={cellSx}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Typography sx={lblSx}>Programmes</Typography>
                <Typography
                  onClick={() => setShowCreateDrawer(true)}
                  sx={{ fontSize: '0.55rem', color: GOLD, fontWeight: 600, cursor: 'pointer' }}
                >
                  + Créer
                </Typography>
              </Stack>
              {templates.map((tpl, i) => (
                <Stack
                  key={tpl.id}
                  component={Link}
                  href={`/workout/program/detail?id=${tpl.id}`}
                  direction="row"
                  alignItems="center"
                  sx={{
                    py: 1, textDecoration: 'none', color: 'inherit', '&:active': { opacity: 0.85 },
                    ...(i < templates.length - 1 ? sepSx : {}),
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: tc.h(t) }} noWrap>{tpl.name}</Typography>
                    <Typography sx={{ fontSize: '0.5rem', color: tc.f(t), mt: 0.2 }}>
                      {tpl.targetMuscles.map((m) => MUSCLE_LABELS[m] || m).join(' · ')}
                    </Typography>
                  </Box>
                  <CaretRight size={14} weight={W} style={{ color: tc.f(t) }} />
                </Stack>
              ))}
            </Box>
          )}

          {/* Lien créer programme si aucun */}
          {!isLoading && templates.length === 0 && (
            <Box
              onClick={() => setShowCreateDrawer(true)}
              sx={{
                border: '1px dashed', borderColor: d ? alpha(GOLD, 0.2) : alpha(GOLD, 0.3),
                borderRadius: '14px', py: 2.5, textAlign: 'center', cursor: 'pointer',
                '&:active': { bgcolor: alpha(GOLD, 0.05) },
              }}
            >
              <Typography sx={{ fontSize: '0.7rem', color: tc.f(t), fontWeight: 500 }}>
                + Créer un programme
              </Typography>
            </Box>
          )}

          {/* Historique */}
          {isLoading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={64} sx={{ borderRadius: '14px' }} />
              <Skeleton variant="rounded" height={64} sx={{ borderRadius: '14px' }} />
            </Stack>
          ) : completedSessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(t) }}>
                Pas encore de séance
              </Typography>
              <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), mt: 0.3 }}>
                Ta première séance t&apos;attend !
              </Typography>
            </Box>
          ) : (
            <Box sx={{ ...cellSx, pb: 4 }}>
              <Typography sx={{ ...lblSx, mb: 1.5 }}>Récent</Typography>
              {completedSessions.map((session, i) => (
                <Box key={session.id} sx={i < completedSessions.length - 1 ? sepSx : {}}>
                  <SessionCard session={session} />
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        PaperProps={{ sx: { borderRadius: '16px', bgcolor: panelBg(t) } }}
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

      {/* Create Program Drawer */}
      <Drawer
        anchor="bottom"
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: panelBg(t) },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: tc.f(t), opacity: 0.3, mx: 'auto', mb: 2 }} />
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: tc.h(t), mb: 1.5 }}>
            Créer un programme
          </Typography>
          <List disablePadding>
            <ListItemButton
              onClick={() => { setShowCreateDrawer(false); router.push('/workout/program/manual'); }}
              sx={{ borderRadius: '12px', mb: 0.5 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PencilSimple size={22} weight={W} color={GOLD} />
              </ListItemIcon>
              <ListItemText
                primary="Créer manuellement"
                secondary="Choisis tes exercices et configure"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem', color: tc.h(t) }}
                secondaryTypographyProps={{ fontSize: '0.8rem', color: tc.m(t) }}
              />
            </ListItemButton>
            <ListItemButton
              onClick={() => { setShowCreateDrawer(false); router.push('/workout/program'); }}
              sx={{ borderRadius: '12px' }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Sparkle size={22} weight={W} color={GOLD_LIGHT} />
              </ListItemIcon>
              <ListItemText
                primary="Générer avec l'IA"
                secondary="Programme personnalisé en 5 étapes"
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem', color: tc.h(t) }}
                secondaryTypographyProps={{ fontSize: '0.8rem', color: tc.m(t) }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* New Session Drawer */}
      <Drawer
        anchor="bottom"
        open={showNewSessionDrawer}
        onClose={() => { setShowNewSessionDrawer(false); setDrawerView('main'); }}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: panelBg(t), maxHeight: '70vh' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            {drawerView === 'cardio' ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconButton size="small" onClick={() => setDrawerView('main')}>
                  <ArrowLeft size={20} weight={W} />
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
              <X size={22} weight={W} />
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
                  background: `linear-gradient(135deg, ${GOLD}, ${GOLD_LIGHT})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mr: 2,
                }}>
                  <Lightning size={22} weight={W} color={GOLD_CONTRAST} />
                </Box>
                <ListItemText
                  primary="Séance libre"
                  secondary="Choisis tes exercices au fur et à mesure"
                />
                <CaretRight size={18} weight={W} style={{ color: tc.f(t) }} />
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
                <CaretRight size={18} weight={W} style={{ color: tc.f(t) }} />
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
                      <CaretRight size={18} weight={W} style={{ color: tc.f(t) }} />
                    </ListItemButton>
                  )
                )}
              </List>
              <Divider sx={{ my: 1 }} />
              <Button
                component="label"
                size="small"
                fullWidth
                startIcon={<Camera size={18} weight={W} />}
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


function SessionCard({ session }: { session: EnrichedWorkoutSession }) {
  const router = useRouter();
  const { t, d } = useThemeTokens();
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

  // Build inline stats text
  const stats: string[] = [];
  if (session.exerciseCount > 0 && !isCardio) stats.push(`${session.exerciseCount} exo`);
  stats.push(durationFormatted);
  if (isCardio) {
    if (distanceM > 0) stats.push(formatDistance(distanceM));
    if (session.avgPaceSecondsPerKm) stats.push(formatPace(session.avgPaceSecondsPerKm));
  } else {
    stats.push(volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`);
  }
  if (session.caloriesBurned) stats.push(`${session.caloriesBurned} kcal`);

  // Title: template name or cardio activity or date
  const title = session.templateName
    ? session.templateName
    : isCardio && activityInfo
      ? activityInfo.label
      : formattedDate;

  // Exercise preview (first 3 names + overflow)
  const exercisePreview = session.exerciseNames.length > 0
    ? session.exerciseNames.slice(0, MAX_EXERCISES_SHOWN).join(' · ')
      + (session.exerciseNames.length > MAX_EXERCISES_SHOWN
        ? ` +${session.exerciseNames.length - MAX_EXERCISES_SHOWN}`
        : '')
    : null;

  // Muscle group labels
  const muscleLabels = session.muscleGroups
    .map((m) => MUSCLE_LABELS[m] || m)
    .filter(Boolean);

  return (
    <Box
      onClick={() => router.push(`/workout/session?id=${session.id}`)}
      sx={card(t, { px: 2, py: 1.8, cursor: 'pointer', '&:active': { opacity: 0.85 } })}
    >
      <Stack direction="row" alignItems="center">
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Row 1: Title + date/time */}
          <Stack direction="row" spacing={0.75} alignItems="center">
            {isCardio && activityInfo && (
              <Typography component="span" sx={{ fontSize: '0.95rem' }}>{activityInfo.emoji}</Typography>
            )}
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: tc.h(t), textTransform: 'capitalize' }} noWrap>
              {title}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: tc.f(t), flexShrink: 0 }}>
              {session.templateName ? formattedDate : (isCardio ? formattedDate : formattedTime)}
            </Typography>
          </Stack>

          {/* Row 2: Exercise preview */}
          {exercisePreview && (
            <Typography sx={{ fontSize: '0.7rem', color: tc.m(t), mt: 0.3 }} noWrap>
              {exercisePreview}
            </Typography>
          )}

          {/* Row 3: Muscle chips */}
          {muscleLabels.length > 0 && (
            <Stack direction="row" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {muscleLabels.map((label) => (
                <Box
                  key={label}
                  sx={{
                    px: 0.8, py: 0.15,
                    borderRadius: '6px',
                    bgcolor: alpha(GOLD, d ? 0.12 : 0.08),
                    border: '1px solid',
                    borderColor: alpha(GOLD, d ? 0.2 : 0.15),
                  }}
                >
                  <Typography sx={{ fontSize: '0.6rem', fontWeight: 500, color: GOLD, lineHeight: 1.4 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {/* Row 4: Stats */}
          <Typography sx={{ fontSize: '0.65rem', color: tc.f(t), mt: 0.4 }}>
            {stats.join(' · ')}
          </Typography>
        </Box>
        <CaretRight size={18} weight={W} style={{ color: tc.f(t), flexShrink: 0 }} />
      </Stack>
    </Box>
  );
}

