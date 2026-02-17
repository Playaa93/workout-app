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
import { startCardioSession, importCardioSession } from './cardio-actions';
import { CARDIO_ACTIVITIES, formatPace, formatDistance } from '@/lib/cardio-utils';
import type { CardioActivity as CardioActivityType } from '@/db/schema';
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
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
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
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import BottomNav from '@/components/BottomNav';

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pecs',
  back: 'Dos',
  shoulders: 'Épaules',
  arms: 'Bras',
  legs: 'Jambes',
  core: 'Abdos',
  full_body: 'Full body',
};

export default function WorkoutPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [startingTemplateId, setStartingTemplateId] = useState<string | null>(null);
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importSaving, setImportSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

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

  const handleStartCardio = async (activity: CardioActivity) => {
    setStartingCardio(true);
    try {
      const sessionId = await startCardioSession(activity);
      router.push(`/workout/cardio?id=${sessionId}`);
    } catch (error) {
      console.error('Error starting cardio:', error);
      setStartingCardio(false);
      setShowNewSessionDrawer(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 1024;
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
        activity: importData.activity as CardioActivityType,
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
      // Refresh sessions list
      const sessionsData = await getRecentSessions();
      setSessions(sessionsData);
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
            borderRadius: 4,
          }}>
            <CardActionArea onClick={() => { setDrawerView('main'); setShowNewSessionDrawer(true); }}>
              <CardContent sx={{ py: 3.5, px: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Box sx={{
                    width: 56, height: 56, borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Add sx={{ fontSize: 30 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Nouvelle séance
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Musculation, cardio ou import
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

  const isCardio = session.sessionType === 'cardio';
  const activityInfo = isCardio && session.cardioActivity
    ? CARDIO_ACTIVITIES[session.cardioActivity as CardioActivity]
    : null;
  const volume = session.totalVolume ? parseFloat(session.totalVolume) : 0;
  const distanceM = session.distanceMeters ? parseFloat(session.distanceMeters) : 0;
  const [showDelete, setShowDelete] = useState(false);

  const mins = session.durationMinutes || 0;
  const durationFormatted = mins >= 60
    ? `${Math.floor(mins / 60)}h${(mins % 60).toString().padStart(2, '0')}`
    : `${mins}min`;

  return (
    <Box
      sx={{ px: 2.5, py: 2 }}
      onClick={() => setShowDelete(!showDelete)}
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
            <Box sx={{ flex: 1, py: 1, textAlign: 'center' }}>
              <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                {session.caloriesBurned || 0}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
                kcal
              </Typography>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
}
