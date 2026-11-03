'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useBackHandler, dismissAllOverlays } from '@/hooks/useBackHandler';
import { useRouter } from 'next/navigation';
import type {
  Exercise,
  WorkoutSet,
  ActiveSession,
  TemplateExercise,
  MachineSetup,
} from '../types';
import { useEditor, useExerciseData, ExerciseScope } from './editor-context';
import type { MorphotypeResult } from '@/app/morphology/types';
import { MorphoTipsPanel, MorphoScoreBadge } from '@/components/workout/MorphoTipsPanel';
import ExerciseDetailModal from '@/components/workout/ExerciseDetailModal';
import { ExercisePicker } from '@/components/workout/ExercisePicker';
import MachineSetupSheet from '@/components/workout/MachineSetupSheet';
import {
  GearSix,
  DotsThreeVertical,
  Plus,
  X,
  Trash,
  Trophy,
  ArrowsLeftRight,
  Bell,
  Info,
  CaretDown,
  NotePencil,
} from '@phosphor-icons/react';
import {
  scoreExercise,
  getCategoryDefault,
  type MorphoRecommendation,
} from '@/lib/morpho-exercise-scoring';
import { triggerHaptic } from '@/lib/haptic';
import { getExerciseProgress } from './exercise-progress';
import { useSetRestTimer } from '@/hooks/useSetRestTimer';
import { useThemeTokens } from '@/hooks/useDark';
import { alpha } from '@mui/material/styles';
import { GOLD, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldBtnSx, goldOutlinedBtnSx, dialogPaperSx } from '@/lib/design-tokens';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Fab from '@mui/material/Fab';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import InputAdornment from '@mui/material/InputAdornment';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Collapse from '@mui/material/Collapse';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const currentExerciseBorder = { borderColor: GOLD, boxShadow: `inset 3px 0 0 ${GOLD}` };

function formatRestTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default function WorkoutEditor({ storageKey, session, exercises, templateId, templateExercises, morphotype, notificationsAllowed }: {
  storageKey: string;
  session: ActiveSession;
  exercises: Exercise[];
  templateId: string | null;
  templateExercises: TemplateExercise[];
  morphotype: MorphotypeResult | null;
  notificationsAllowed: boolean;
}) {
  const router = useRouter();
  const { actions: mutations, onFinished } = useEditor();
  const { t, d } = useThemeTokens();
  const { sets, exercises: exerciseMap } = session;
  const sessionId = session.session.id;
  const { byExercise, currentId } = useMemo(() => getExerciseProgress(templateExercises, sets), [templateExercises, sets]);

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Rest timer with set tracking (persists rest_taken on adjust)
  const timer = useSetRestTimer(storageKey, setId =>
    !session.session.endedAt && sets.some(set => set.id === setId), notificationsAllowed, mutations.updateSetRestTaken);
  const [showRestAlerts, setShowRestAlerts] = useState(false);
  useBackHandler(showRestAlerts, () => setShowRestAlerts(false), 'rest-alerts');

  // Elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    session ? Math.max(0, Math.floor((Date.now() - session.session.startedAt.getTime()) / 1000)) : 0);

  // Exercise info modal
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  const currentExerciseRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const revealCurrentExercise = useCallback(() => {
    const card = currentExerciseRef.current;
    if (card && headerRef.current) {
      const top = card.getBoundingClientRect().top - headerRef.current.getBoundingClientRect().bottom - 12;
      window.scrollBy({ top, behavior: 'instant' });
    }
  }, []);
  const openedAt = useRef<string | null>(null);
  useEffect(() => {
    if (openedAt.current === sessionId) return;
    openedAt.current = sessionId;
    if (sets.length && currentId) revealCurrentExercise();
  }, [sessionId, sets.length, currentId, revealCurrentExercise]);
  const previousProgress = useRef({ count: 0, currentId });
  useEffect(() => {
    const previous = previousProgress.current;
    previousProgress.current = { count: sets.length, currentId };
    if (previous.count > 0 && sets.length > previous.count && currentId !== previous.currentId) {
      revealCurrentExercise();
    }
  }, [sets.length, currentId, revealCurrentExercise]);

  // Swap exercise state
  const [swapExerciseId, setSwapExerciseId] = useState<string | null>(null);
  const [similarExercises, setSimilarExercises] = useState<Exercise[]>([]);

  // Back button → close overlay instead of navigating away
  useBackHandler(showExercisePicker, () => setShowExercisePicker(false), 'exercise-picker');
  useBackHandler(!!selectedExercise, () => setSelectedExercise(null), 'set-input');
  useBackHandler(showEndConfirm, () => setShowEndConfirm(false), 'end-confirm');
  useBackHandler(!!swapExerciseId, () => setSwapExerciseId(null), 'swap-exercise');
  useBackHandler(!!infoExercise, () => setInfoExercise(null), 'exercise-info');

  // Elapsed time counter
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.session.startedAt).getTime();

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);


  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
  };

  const handleEndWorkout = async () => {
    if (!sessionId) return;
    try {
      const result = await mutations.endWorkoutSession(sessionId);
      timer.stopForSet();
      dismissAllOverlays();
      if (onFinished) { onFinished(); return; }
      router.push(`/workout/summary?sessionId=${sessionId}&xp=${result.xpEarned}&volume=${result.totalVolume}&duration=${result.duration}&prs=${result.prCount}`);
    } catch (error) {
      console.error('Error ending workout:', error);
    }
  };

  const handleOpenSwap = (exerciseId: string) => {
    setSwapExerciseId(exerciseId);
    const ex = exerciseMap.get(exerciseId);
    if (ex) {
      const similar = exercises.filter(e => e.muscleGroup === ex.muscleGroup && e.id !== exerciseId);
      setSimilarExercises(similar);
    }
  };

  const handleSwapExercise = async (newExerciseId: string) => {
    if (!templateId || !swapExerciseId) return;
    try {
      await mutations.swapTemplateExercise(templateId, swapExerciseId, newExerciseId);
      // No need to reload - hooks are reactive
      setSwapExerciseId(null);
      setSimilarExercises([]);
    } catch (error) {
      console.error('Error swapping exercise:', error);
    }
  };

  const formatTime = formatRestTime;

  const currentName = currentId && (exerciseMap.get(currentId)?.nameFr ||
    templateExercises.find(exercise => exercise.exerciseId === currentId)?.exerciseName);
  const currentLabel = currentId && byExercise.has(currentId) ? 'En cours' : 'À suivre';

  // Get last rest time used (from most recent set)
  const lastRestTime = session?.sets.length
    ? session.sets[session.sets.length - 1].restTaken ?? 90
    : 90;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: 16, bgcolor: surfaceBg(t) }}>
      <Box ref={headerRef} sx={{ position: 'sticky', top: 0, zIndex: 10 }}>
        {/* Header with timer */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: '1px solid',
            borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
            borderRadius: 0,
            bgcolor: panelBg(t),
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box sx={{ minWidth: 0, pr: 1 }}>
              {currentName ? (
                <Box
                  component="button"
                  aria-label={`Afficher l’exercice · ${currentName}`}
                  onClick={revealCurrentExercise}
                  sx={{ display: 'block', maxWidth: '100%', minHeight: 44, p: 0, border: 0, bgcolor: 'transparent', textAlign: 'left', cursor: 'pointer' }}
                >
                  <Typography component="span" variant="subtitle1" sx={{ display: 'block', fontWeight: 600, lineHeight: 1.3, overflowWrap: 'anywhere', color: tc.h(t) }}>
                    {currentName}
                  </Typography>
                  <Typography component="span" variant="body2" sx={{ color: tc.m(t) }}>
                    {currentLabel} · {formatTime(elapsedSeconds)}
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(t) }}>Séance en cours</Typography>
                  <Typography variant="body2" sx={{ color: tc.m(t) }}>{formatTime(elapsedSeconds)}</Typography>
                </>
              )}
              <Box role="status" sx={{ color: tc.h(t), fontSize: '0.875rem' }}>
                {timer.finished && 'Repos terminé'}
              </Box>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                aria-label="Réglages des alertes de repos"
                title="Alertes de repos"
                onClick={() => { timer.refreshPermission(); setShowRestAlerts(true); }}
                sx={{ width: 44, height: 44 }}
              >
                <Bell size={20} weight={W} />
              </IconButton>
              <Button
                size="small"
                onClick={() => setShowEndConfirm(true)}
                sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: 'error.light', borderRadius: '14px', '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' } }}
              >
                Terminer
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Rest Timer (sticky) - Apple-style minimal */}
        {(timer.isRunning || timer.remaining > 0) && (
          <Box
            sx={{
              py: 2,
              bgcolor: surfaceBg(t),
              borderBottom: '1px solid',
              borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
            }}
          >
            {/* Timer display - hero element */}
            <Typography
              sx={{
                textAlign: 'center',
                fontSize: '3rem',
                fontWeight: 200,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                letterSpacing: '-0.02em',
                color: timer.remaining <= 10 ? 'error.main' : tc.h(t),
                transition: 'color 0.3s ease',
              }}
            >
              {formatTime(timer.remaining)}
            </Typography>

            <Stack direction="row" justifyContent="center" alignItems="center" spacing={1}>
              <Button aria-label="Retirer 30 secondes" onClick={() => timer.adjustForSet(-30)} sx={{ minHeight: 44, color: tc.m(t) }}>
                −30 s
              </Button>
              <Button aria-label="Ajouter 30 secondes" onClick={() => timer.adjustForSet(30)} sx={{ minHeight: 44, color: tc.m(t) }}>
                +30 s
              </Button>
              <IconButton aria-label="Arrêter le repos" onClick={timer.stopForSet} sx={{ width: 44, height: 44 }}>
                <X size={18} />
              </IconButton>
            </Stack>
          </Box>
        )}
      </Box>

      <Dialog open={showRestAlerts} onClose={() => setShowRestAlerts(false)} aria-labelledby="rest-alerts-title"
        maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx(t) }}>
        <DialogTitle id="rest-alerts-title">Alertes de repos</DialogTitle>
        <DialogContent>
          <Stack>
            <FormControlLabel label="Bip en fin de repos dans la séance"
              control={<Checkbox checked={timer.sound} onChange={(_, checked) => timer.setSound(checked)} />} />
            {typeof navigator !== 'undefined' && 'vibrate' in navigator && (
              <FormControlLabel label="Vibrer en fin de repos dans la séance"
                control={<Checkbox checked={timer.vibration} onChange={(_, checked) => timer.setVibration(checked)} />} />
            )}
            <FormControlLabel label="Notification silencieuse en arrière-plan"
              disabled={!timer.accountAllowsNotifications || timer.permission === 'denied' || timer.permission === 'unavailable'}
              control={<Checkbox checked={timer.notifications}
                onChange={(_, checked) => { void timer.setNotifications(checked); }} />} />
            <Typography variant="caption" sx={{ color: tc.m(t) }}>
              {!timer.accountAllowsNotifications ? 'Les notifications sont désactivées pour ce compte.'
                : timer.permission === 'denied'
                  ? 'Les notifications sont bloquées dans les autorisations du site.'
                : timer.permission === 'unavailable'
                  ? 'Les notifications sont indisponibles dans ce navigateur.'
                  : 'Si le navigateur met la séance en veille, la notification peut être retardée ou manquée.'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setShowRestAlerts(false)}>Fermer</Button></DialogActions>
      </Dialog>

      {/* Exercise Sets */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Stack spacing={2}>
          {/* Template exercises (planned workout) */}
          {templateExercises.length > 0 && (
            <>
              {templateExercises.map((templateEx, index) => {
                const progress = byExercise.get(templateEx.exerciseId);
                const exerciseSets = progress?.sets ?? [];
                const exercise = exerciseMap.get(templateEx.exerciseId);
                const completedSets = progress?.workingSets ?? 0;
                const targetSets = templateEx.targetSets;
                const isComplete = completedSets >= targetSets;
                const isCurrent = templateEx.exerciseId === currentId;

                return (
                  <Box
                    key={templateEx.exerciseId}
                    ref={isCurrent ? currentExerciseRef : undefined}
                    aria-current={isCurrent ? 'step' : undefined}
                    sx={card(t, { p: 2, ...(isCurrent && currentExerciseBorder) })}
                  >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start"
                        sx={{ '@media (max-width: 359px)': { flexDirection: 'column', gap: 1 } }}>
                        <Box sx={{ flex: 1, minWidth: 0, pr: 1 }}>
                          {isCurrent && (
                            <Typography component="p" variant="caption" sx={{ m: 0, mb: 0.5, fontWeight: 700, color: tc.h(t) }}>
                              {currentLabel} · Série {completedSets + 1} sur {targetSets}
                            </Typography>
                          )}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={index + 1}
                              size="small"
                              sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: isCurrent ? GOLD : alpha(tc.h(t), 0.08), color: isCurrent ? GOLD_CONTRAST : tc.m(t), flexShrink: 0 }}
                            />
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 600, color: tc.h(t), cursor: 'pointer', textDecoration: 'underline', textDecorationColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08), textUnderlineOffset: 3 }}
                              onClick={() => { if (exercise) setInfoExercise(exercise); }}
                            >
                              {templateEx.exerciseName}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ color: tc.m(t) }}>
                              Objectif: {targetSets} × {templateEx.targetReps}
                            </Typography>
                            <Typography variant="caption" sx={{ color: isComplete ? 'success.main' : tc.m(t) }}>
                              Fait: {completedSets}/{targetSets} séries
                            </Typography>
                          </Stack>
                          {templateEx.notes && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                              💡 {templateEx.notes.split(' | ')[0]}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                          <IconButton
                            size="small"
                            aria-label={`Remplacer ${templateEx.exerciseName}`}
                            onClick={() => handleOpenSwap(templateEx.exerciseId)}
                            sx={{ width: 44, height: 44, border: '1px solid', borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }}
                          >
                            <ArrowsLeftRight size={18} weight={W} />
                          </IconButton>
                          <Button
                            size="small"
                            onClick={() => {
                              if (exercise) {
                                setSelectedExercise(exercise);
                              }
                            }}
                            aria-label={`Ajouter une série · ${templateEx.exerciseName}`}
                            disabled={!exercise}
                            sx={isCurrent ? goldBtnSx : { ...goldOutlinedBtnSx, color: tc.m(t), borderColor: alpha(tc.h(t), 0.18) }}
                          >
                            {isComplete ? '+ série' : 'Ajouter'}
                          </Button>
                        </Stack>
                      </Stack>

                      {/* Show sets if any */}
                      {exerciseSets.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {exerciseSets.map(set => (
                            <Chip
                              key={set.id}
                              label={
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <span>{set.reps} × {set.weight}kg</span>
                                  {set.restTaken && (
                                    <Typography component="span" sx={{ fontSize: '0.6rem', opacity: 0.6, color: tc.f(t) }}>
                                      {formatRestTime(set.restTaken)}
                                    </Typography>
                                  )}
                                </Stack>
                              }
                              size="small"
                              color={set.isPr ? 'warning' : 'default'}
                              variant="outlined"
                              onDelete={() => {
                                mutations.deleteSet(set.id);
                              }}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Stack>
                      )}
                  </Box>
                );
              })}
            </>
          )}

          {/* Sets from exercises not in template */}
          {(() => {
            const freeExercises = Array.from(byExercise.entries())
              .filter(([exerciseId]) => !templateExercises.some(t => t.exerciseId === exerciseId));
            return freeExercises.map(([exerciseId, progress]) => {
              const exercise = session?.exercises.get(exerciseId);
              const isCurrent = exerciseId === currentId;
              return (
                <div key={exerciseId} ref={isCurrent ? currentExerciseRef : undefined} aria-current={isCurrent ? 'step' : undefined}>
                  <ExerciseScope exerciseId={exerciseId}><ExerciseCard
                    exercise={exercise}
                    sets={progress.sets}
                    sessionId={sessionId}
                    defaultRestTime={lastRestTime}
                    isCurrent={isCurrent}
                    onStartTimer={timer.startForSet}
                    onShowInfo={setInfoExercise}
                  /></ExerciseScope>
                </div>
              );
            });
          })()}

          {/* Add Exercise Button */}
          <Button
            fullWidth
            onClick={() => setShowExercisePicker(true)}
            sx={{
              ...goldOutlinedBtnSx,
              py: 2,
              border: '1px dashed',
              borderColor: alpha(GOLD, 0.3),
            }}
            startIcon={<Plus size={20} weight={W} />}
          >
            Ajouter un exercice
          </Button>

          {/* Session notes */}
          <SessionNotesInput sessionId={sessionId} initialNotes={session?.session.notes || ''} />
        </Stack>
      </Box>

      {/* Selected Exercise Input (bottom sheet) */}
      <Drawer
        anchor="bottom"
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: panelBg(t) },
        }}
      >
        {selectedExercise && (
          <ExerciseScope key={selectedExercise.id} exerciseId={selectedExercise.id}><SetInputSheet
            exercise={selectedExercise}
            sessionId={sessionId}
            setNumber={(byExercise.get(selectedExercise.id)?.sets.length || 0) + 1}
            morphotype={morphotype}
            defaultRestTime={lastRestTime}
            onClose={() => setSelectedExercise(null)}
            onSetAdded={(setId, restDuration) => {
              timer.startForSet(setId, restDuration);
            }}
          /></ExerciseScope>
        )}
      </Drawer>

      {/* Exercise Picker Modal */}
      <Drawer
        anchor="bottom"
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        PaperProps={{
          sx: { height: '90vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: surfaceBg(t) },
        }}
      >
        <ExercisePicker
          exercises={exercises}
          morphotype={morphotype}
          onSelect={handleSelectExercise}
          onClose={() => setShowExercisePicker(false)}
        />
      </Drawer>

      {/* End Workout Confirmation */}
      <Dialog open={showEndConfirm} onClose={() => setShowEndConfirm(false)} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx(t) }}>
        <DialogTitle sx={{ color: tc.h(t) }}>Terminer la séance ?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: tc.m(t) }}>
            Tu as fait {session?.sets.filter(s => !s.isWarmup).length || 0} séries.
            Tu peux toujours reprendre plus tard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowEndConfirm(false)} sx={{ ...goldOutlinedBtnSx }}>
            Continuer
          </Button>
          <Button
            onClick={handleEndWorkout}
            sx={{ ...goldBtnSx }}
          >
            Terminer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Swap Exercise Drawer */}
      <Drawer
        anchor="bottom"
        open={!!swapExerciseId}
        onClose={() => {
          setSwapExerciseId(null);
          setSimilarExercises([]);
        }}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: panelBg(t), maxHeight: '70vh' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: tc.h(t) }}>
              Remplacer l’exercice
            </Typography>
            <IconButton onClick={() => {
              setSwapExerciseId(null);
              setSimilarExercises([]);
            }}>
              <X size={24} weight={W} />
            </IconButton>
          </Stack>

          <Typography variant="body2" sx={{ color: tc.m(t), mb: 2 }}>
            Exercices ciblant le même groupe musculaire :
          </Typography>

          {similarExercises.length === 0 ? (
            <Typography sx={{ color: tc.m(t), textAlign: 'center', py: 4 }}>
              Aucun exercice similaire trouvé
            </Typography>
          ) : (
            <List sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              {similarExercises
                .map((ex) => {
                  const rec = ex.morphotypeRecommendations as MorphoRecommendation | null;
                  const exScore = morphotype ? scoreExercise(morphotype, rec || getCategoryDefault(ex.muscleGroup, ex.nameFr)) : null;
                  return { ...ex, score: exScore?.score ?? 70 };
                })
                .sort((a, b) => b.score - a.score)
                .map((ex) => (
                  <ListItemButton
                    key={ex.id}
                    onClick={() => handleSwapExercise(ex.id)}
                    sx={{
                      borderRadius: '14px',
                      mb: 0.5,
                      border: '1px solid',
                      borderColor: ex.score >= 75 ? 'success.main' : ex.score >= 50 ? (d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)) : 'warning.main',
                      bgcolor: ex.score >= 75 ? 'rgba(16,185,129,0.05)' : 'transparent',
                    }}
                  >
                    <MorphoScoreBadge score={ex.score} size="small" />
                    <ListItemText
                      sx={{ ml: 1.5 }}
                      primary={ex.nameFr}
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          {ex.equipment?.slice(0, 2).map((eq, i) => (
                            <Chip key={i} label={eq} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                          ))}
                        </Stack>
                      }
                      secondaryTypographyProps={{ component: 'div' }}
                    />
                  </ListItemButton>
                ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Exercise Info Modal */}
      <ExerciseDetailModal
        exercise={infoExercise ? {
          id: infoExercise.id,
          nameFr: infoExercise.nameFr,
          nameEn: infoExercise.nameEn,
          muscleGroup: infoExercise.muscleGroup,
          primaryMuscles: infoExercise.primaryMuscles,
          secondaryMuscles: infoExercise.secondaryMuscles,
          equipment: infoExercise.equipment,
          difficulty: infoExercise.difficulty,
        } : null}
        open={!!infoExercise}
        onClose={() => setInfoExercise(null)}
      />

      {/* Quick Add FAB - minimal style */}
      {!selectedExercise && !showExercisePicker && (
        <Fab
          onClick={() => setShowExercisePicker(true)}
          sx={{
            ...goldBtnSx,
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            boxShadow: `0 4px 20px ${alpha(GOLD, 0.4)}`,
            border: 'none',
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <Plus size={28} weight={W} />
        </Fab>
      )}
    </Box>
  );
}

// Machine Setup Inline (compact display in ExerciseCard)
function MachineSetupInline({
  exerciseId,
  equipment,
  selectedSetupId,
  onSelectSetup,
  sheetOpen,
  onSheetOpen,
  onSheetClose,
}: {
  exerciseId: string;
  equipment: string[] | null;
  selectedSetupId: string | null;
  onSelectSetup: (setup: MachineSetup | null) => void;
  sheetOpen: boolean;
  onSheetOpen: () => void;
  onSheetClose: () => void;
}) {
  const { actions: mutations } = useEditor();
  const { t, d } = useThemeTokens();
  const { setups } = useExerciseData();
  const [editingSetup, setEditingSetup] = useState<MachineSetup | null>(null);

  const selectedSetup = setups.find(s => s.id === selectedSetupId) || null;
  const filledSettings = selectedSetup?.settings.filter(s => s.value) ?? [];

  // Auto-select default on first load
  useEffect(() => {
    if (!selectedSetupId && setups.length > 0) {
      const def = setups.find(s => s.isDefault) || setups[0];
      onSelectSetup(def);
    }
  }, [setups, selectedSetupId, onSelectSetup]);

  const existingLabels = useMemo(() => setups.map(s => s.machineLabel), [setups]);

  if (setups.length === 0) {
    if (!sheetOpen) return null;
    return (
      <MachineSetupSheet
        open
        onClose={onSheetClose}
        exerciseId={exerciseId}
        equipment={equipment}
        existingLabels={existingLabels}
        onSave={async (data) => {
          const id = await mutations.saveMachineSetup(data);
          onSelectSetup({ ...data, id, photoBase64: data.photoBase64 ?? null, settings: data.settings, notes: data.notes ?? null });
        }}
      />
    );
  }

  return (
    <>
      {/* Horizontal selector if multiple setups */}
      {setups.length > 1 && (
        <Stack direction="row" spacing={0.5} sx={{ my: 0.5, overflowX: 'auto', pb: 0.5 }}>
          {setups.map(s => (
            <Chip
              key={s.id}
              label={s.machineLabel}
              size="small"
              variant={s.id === selectedSetupId ? 'filled' : 'outlined'}
              color={s.id === selectedSetupId ? 'primary' : 'default'}
              onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); onSelectSetup(s); }}
              sx={{ fontSize: '0.65rem', height: 24, maxWidth: 140, flexShrink: 0 }}
            />
          ))}
          <Chip
            icon={<Plus size={12} weight={W} />}
            label="Nouvelle"
            size="small"
            variant="outlined"
            onClick={(e) => { e.stopPropagation(); setEditingSetup(null); onSheetOpen(); }}
            sx={{ fontSize: '0.65rem', height: 24, borderStyle: 'dashed', cursor: 'pointer', flexShrink: 0 }}
          />
        </Stack>
      )}

      {/* Selected machine compact card */}
      {selectedSetup && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          onClick={(e) => { e.stopPropagation(); setEditingSetup(selectedSetup); onSheetOpen(); }}
          sx={{
            my: 0.75, py: 0.5, px: 1, cursor: 'pointer',
            borderLeft: 2, borderColor: GOLD,
            borderRadius: '0 4px 4px 0', bgcolor: alpha(GOLD, 0.05),
          }}
        >
          {selectedSetup.photoBase64 && (
            <Box
              component="img"
              src={selectedSetup.photoBase64}
              alt=""
              sx={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
            />
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" fontWeight={600} sx={{ lineHeight: 1.2, display: 'block' }} noWrap>
              {selectedSetup.machineLabel}
            </Typography>
            {filledSettings.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, flexWrap: 'wrap', gap: 0.25 }}>
                {filledSettings.slice(0, 3).map((s, i) => (
                  <Typography key={i} variant="caption" sx={{ color: tc.f(t), fontSize: '0.6rem' }}>
                    {s.key}: {s.value}
                  </Typography>
                ))}
              </Stack>
            )}
          </Box>
          <GearSix size={14} weight={W} style={{ color: tc.f(t), flexShrink: 0 }} />
        </Stack>
      )}

      <MachineSetupSheet
        open={sheetOpen}
        onClose={onSheetClose}
        exerciseId={exerciseId}
        equipment={equipment}
        existingSetup={editingSetup}
        existingLabels={existingLabels}
        onSave={async (data) => {
          const id = await mutations.saveMachineSetup(data);
          onSelectSetup({ ...data, id, photoBase64: data.photoBase64 ?? null, settings: data.settings, notes: data.notes ?? null });
        }}
        onDelete={async (id) => {
          await mutations.deleteMachineSetup(id);
          if (selectedSetupId === id) onSelectSetup(null);
        }}
      />
    </>
  );
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  sets,
  sessionId,
  defaultRestTime = 90,
  isCurrent = false,
  onStartTimer,
  onShowInfo,
}: {
  exercise: Exercise | undefined;
  sets: WorkoutSet[];
  sessionId: string;
  defaultRestTime?: number;
  isCurrent?: boolean;
  onStartTimer: (setId: string, duration: number) => void;
  onShowInfo: (exercise: Exercise) => void;
}) {
  const { actions: mutations } = useEditor();
  const { t, d } = useThemeTokens();
  const [showAddSet, setShowAddSet] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(!isCurrent && sets.length > 0);
  const { machineId: selectedMachineSetupId, setMachineId: setSelectedMachineSetupId, previousSets } = useExerciseData();
  const [machineSheetOpen, setMachineSheetOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [forceEditNote, setForceEditNote] = useState(false);
  const [confirmDeleteLast, setConfirmDeleteLast] = useState(false);

  useBackHandler(confirmDeleteLast, () => setConfirmDeleteLast(false), 'confirm-delete-last');
  useBackHandler(machineSheetOpen, () => setMachineSheetOpen(false), 'machine-sheet');

  // Keep the current exercise expanded when moving between exercises.
  useEffect(() => {
    setCollapsed(!isCurrent);
  }, [isCurrent]);

  const handleSelectSetup = useCallback((setup: MachineSetup | null) => {
    setSelectedMachineSetupId(setup?.id ?? null);
  }, [setSelectedMachineSetupId]);

  if (!exercise) return null;

  const workingSets = sets.filter((s) => !s.isWarmup);
  const lastSet = workingSets[workingSets.length - 1];

  const totalVolume = workingSets.reduce((sum, s) => sum + (s.reps || 0) * parseFloat(s.weight || '0'), 0);

  return (
    <Box sx={card(t, isCurrent ? currentExerciseBorder : undefined)}>
      {/* Exercise Header — tap to collapse/expand */}
      <Box
        sx={{ p: 2, pb: collapsed ? 2 : 0, cursor: 'pointer' }}
        onClick={() => { triggerHaptic('light'); setCollapsed(!collapsed); }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
            {isCurrent && <Typography component="p" variant="caption" sx={{ m: 0, fontWeight: 700, color: tc.h(t) }}>En cours</Typography>}
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, color: tc.h(t), cursor: 'pointer', textDecoration: 'underline', textDecorationColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08), textUnderlineOffset: 3 }}
                onClick={(e) => { e.stopPropagation(); onShowInfo(exercise); }}
              >
                {exercise.nameFr}
              </Typography>
              <CaretDown size={20} weight={W} style={{
                color: tc.f(t),
                transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }} />
            </Stack>
            {collapsed ? (
              <Typography variant="body2" sx={{ color: tc.m(t) }}>
                {workingSets.length} série{workingSets.length !== 1 ? 's' : ''}
                {totalVolume > 0 && <> · {totalVolume.toLocaleString()}kg</>}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: tc.m(t), textTransform: 'capitalize' }}>
                {exercise.muscleGroup}
              </Typography>
            )}
          </Box>
          <Stack direction="row" alignItems="center" spacing={0.5} onClick={(e) => e.stopPropagation()}>
            {!collapsed && previousSets.length > 0 && (
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="caption" sx={{ color: tc.m(t) }}>Dernière fois</Typography>
                <Typography variant="body2" sx={{ color: tc.h(t) }}>
                  {previousSets[0].reps} × {previousSets[0].weight}kg
                </Typography>
              </Box>
            )}
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <DotsThreeVertical size={18} weight={W} style={{ color: tc.f(t) }} />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: '14px', minWidth: 180, bgcolor: panelBg(t) } } }}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); setCollapsed(false); setMachineSheetOpen(true); }}>
          <GearSix size={18} weight={W} style={{ marginRight: 12, color: tc.m(t) }} />
          Configurer machine
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setCollapsed(false); setForceEditNote(true); }}>
          <NotePencil size={18} weight={W} style={{ marginRight: 12, color: tc.m(t) }} />
          Note exercice
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); onShowInfo(exercise); }}>
          <Info size={18} weight={W} style={{ marginRight: 12, color: tc.m(t) }} />
          Info exercice
        </MenuItem>
        {sets.length > 0 && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              setConfirmDeleteLast(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <Trash size={18} weight={W} style={{ marginRight: 12 }} />
            Supprimer dernière série
          </MenuItem>
        )}
      </Menu>

      <Dialog open={confirmDeleteLast} onClose={() => setConfirmDeleteLast(false)} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx(t) }}>
        <DialogTitle sx={{ color: tc.h(t) }}>Supprimer la dernière série ?</DialogTitle>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDeleteLast(false)} sx={{ ...goldOutlinedBtnSx }}>Annuler</Button>
          <Button
            onClick={async () => {
              setConfirmDeleteLast(false);
              triggerHaptic('heavy');
              const lastSetToDelete = sets[sets.length - 1];
              await mutations.deleteSet(lastSetToDelete.id);
            }}
            sx={{ bgcolor: 'error.main', color: '#fff', borderRadius: '14px', '&:hover': { bgcolor: 'error.dark' } }}
          >
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Collapse in={!collapsed} unmountOnExit>
        <Box sx={{ px: 2 }}>
          <MachineSetupInline
            exerciseId={exercise.id}
            equipment={exercise.equipment}
            selectedSetupId={selectedMachineSetupId}
            onSelectSetup={handleSelectSetup}
            sheetOpen={machineSheetOpen}
            onSheetOpen={() => setMachineSheetOpen(true)}
            onSheetClose={() => setMachineSheetOpen(false)}
          />
          <ExerciseNoteInline exerciseId={exercise.id} forceEdit={forceEditNote} onForceEditDone={() => setForceEditNote(false)} />
        </Box>
        {/* Sets List */}
        <Box sx={{ px: 2, pb: 1 }}>
          {sets.map((set) => (
            editingSetId === set.id ? (
              <EditSetInline
                key={set.id}
                set={set}
                onSave={() => {
                  setEditingSetId(null);
                }}
                onDelete={async () => {
                  setEditingSetId(null);
                  await mutations.deleteSet(set.id);
                }}
                onCancel={() => setEditingSetId(null)}
              />
            ) : (
            <Box
              key={set.id}
              onClick={() => setEditingSetId(set.id)}
              sx={{
                py: 1.5,
                borderBottom: '1px solid',
                borderColor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06),
                cursor: 'pointer',
                '&:active': { bgcolor: alpha(GOLD, 0.05) },
                ...(set.isWarmup && { bgcolor: d ? alpha('#ffffff', 0.03) : alpha('#000000', 0.02), mx: -2, px: 2 }),
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: tc.h(t),
                    }}
                  >
                    {set.isWarmup ? 'W' : set.setNumber}
                  </Box>
                  <Box>
                    <Typography component="span" sx={{ fontWeight: 500, color: tc.h(t) }}>{set.reps}</Typography>
                    <Typography component="span" sx={{ mx: 1, color: tc.m(t) }}>×</Typography>
                    <Typography component="span" sx={{ fontWeight: 500, color: tc.h(t) }}>{set.weight}kg</Typography>
                    {set.rpe && <Typography component="span" sx={{ ml: 1, color: tc.m(t) }}>RPE {set.rpe}</Typography>}
                    {set.restTaken && (
                      <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', color: tc.f(t) }}>
                        {formatRestTime(set.restTaken)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
                {set.isPr && (
                  <Chip
                    icon={<Trophy size={16} weight={W} />}
                    label="PR!"
                    size="small"
                    sx={{ fontWeight: 600, bgcolor: alpha(GOLD, 0.15), color: GOLD, border: `1px solid ${alpha(GOLD, 0.3)}` }}
                  />
                )}
              </Stack>
              {set.notes && (
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25, pl: 6 }}>
                  <NotePencil size={12} weight={W} style={{ color: tc.f(t) }} />
                  <Typography variant="caption" sx={{ fontStyle: 'italic', lineHeight: 1.3, color: tc.f(t) }}>
                    {set.notes}
                  </Typography>
                </Stack>
              )}
            </Box>
            )
          ))}
        </Box>

        {/* Add Set Button */}
        {!showAddSet ? (
          <Button
            fullWidth
            onClick={() => setShowAddSet(true)}
            sx={{ color: GOLD, py: 1.5 }}
          >
            + Ajouter une série
          </Button>
        ) : (
          <QuickSetInput
            exerciseId={exercise.id}
            sessionId={sessionId}
            setNumber={workingSets.length + 1}
            lastWeight={lastSet?.weight ? parseFloat(lastSet.weight) : undefined}
            lastReps={lastSet?.reps || undefined}
            defaultRestTime={defaultRestTime}
            machineSetupId={selectedMachineSetupId}
            onCancel={() => setShowAddSet(false)}
            onAdd={(setId, restDuration) => {
              setShowAddSet(false);
              onStartTimer(setId, restDuration);
            }}
          />
        )}
      </Collapse>
    </Box>
  );
}

// Shared set form (used by both add and edit)
function SetForm({
  initialWeight,
  initialReps,
  initialNotes = '',
  submitLabel,
  onSubmit,
  onCancel,
  children,
}: {
  initialWeight: number;
  initialReps: number;
  initialNotes?: string;
  submitLabel: string;
  onSubmit: (reps: number, weight: number, notes: string) => Promise<void>;
  onCancel: () => void;
  children?: React.ReactNode;
}) {
  const { t, d } = useThemeTokens();
  const [weight, setWeight] = useState(initialWeight);
  const [reps, setReps] = useState(initialReps);
  const [notes, setNotes] = useState(initialNotes);
  const [showNotes, setShowNotes] = useState(!!initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (weight == null || !reps) return;
    setIsSubmitting(true);
    triggerHaptic('heavy');
    try {
      await onSubmit(reps, weight, notes.trim());
    } catch (error) {
      console.error('Error submitting set:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Stack direction="row" spacing={4} justifyContent="center" sx={{ mb: 2 }}>
        <StepperInput label="Reps" value={reps} onChange={setReps} step={1} min={0} max={100} />
        <StepperInput label="Poids" value={weight} onChange={setWeight} step={2.5} unit="kg" />
      </Stack>
      {showNotes ? (
        <TextField
          fullWidth
          size="small"
          placeholder="Note sur cette série..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 1.5 }}
          slotProps={{
            input: {
              sx: { fontSize: '0.85rem' },
              startAdornment: <NotePencil size={16} weight={W} style={{ color: tc.f(t), marginRight: 6 }} />,
            },
          }}
        />
      ) : (
        <Chip
          icon={<NotePencil size={14} weight={W} />}
          label="Note"
          size="small"
          variant="outlined"
          onClick={() => setShowNotes(true)}
          sx={{ mb: 1.5, alignSelf: 'flex-start', height: 24, fontSize: '0.7rem', borderStyle: 'dashed', cursor: 'pointer' }}
        />
      )}
      {children}
      <Stack direction="row" spacing={1.5}>
        <Button
          fullWidth
          onClick={onCancel}
          sx={{ color: tc.m(t), fontWeight: 500, borderRadius: '14px', '&:hover': { bgcolor: alpha(GOLD, 0.05) } }}
        >
          Annuler
        </Button>
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={weight == null || !reps || isSubmitting}
          sx={{
            ...goldBtnSx,
            '&:disabled': { bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08), color: tc.f(t) },
          }}
        >
          {isSubmitting ? '...' : submitLabel}
        </Button>
      </Stack>
    </>
  );
}

// Inline Edit for existing set
function EditSetInline({
  set,
  onSave,
  onDelete,
  onCancel,
}: {
  set: WorkoutSet;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const { actions: mutations } = useEditor();
  const { t, d } = useThemeTokens();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <Box sx={{ py: 2, borderBottom: '1px solid', borderColor: d ? alpha('#ffffff', 0.06) : alpha('#000000', 0.06) }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box
            sx={{
              width: 32, height: 32, borderRadius: '50%',
              bgcolor: GOLD, color: GOLD_CONTRAST,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.875rem', fontWeight: 500,
            }}
          >
            {set.isWarmup ? 'W' : set.setNumber}
          </Box>
          <Typography variant="body2" sx={{ color: tc.m(t) }}>Modifier la série</Typography>
        </Stack>
        {!confirmDelete ? (
          <IconButton
            size="small"
            onClick={() => { triggerHaptic('light'); setConfirmDelete(true); }}
            sx={{ color: tc.f(t) }}
          >
            <Trash size={18} weight={W} />
          </IconButton>
        ) : (
          <Button
            size="small"
            onClick={() => { triggerHaptic('heavy'); onDelete(); }}
            sx={{
              color: 'error.main',
              fontWeight: 600,
              fontSize: '0.75rem',
              minWidth: 0,
            }}
          >
            Supprimer
          </Button>
        )}
      </Stack>
      <SetForm
        initialWeight={parseFloat(set.weight || '0')}
        initialReps={set.reps || 0}
        initialNotes={set.notes || ''}
        submitLabel="Enregistrer"
        onSubmit={async (reps, weight, notes) => {
          await mutations.updateSet(set.id, reps, weight);
          if ((notes || '') !== (set.notes || '')) {
            await mutations.updateSetNotes(set.id, notes || null);
          }
          onSave();
        }}
        onCancel={onCancel}
      />
    </Box>
  );
}

// Quick Set Input (inline)
function QuickSetInput({
  exerciseId,
  sessionId,
  setNumber,
  lastWeight,
  lastReps,
  defaultRestTime = 90,
  machineSetupId,
  onCancel,
  onAdd,
}: {
  exerciseId: string;
  sessionId: string;
  setNumber: number;
  lastWeight?: number;
  lastReps?: number;
  defaultRestTime?: number;
  machineSetupId?: string | null;
  onCancel: () => void;
  onAdd: (setId: string, restDuration: number) => void;
}) {
  const { actions: mutations } = useEditor();
  const [restTime, setRestTime] = useState(defaultRestTime);
  const submission = useRef<string | null>(null);

  return (
    <Box sx={{ py: 2, px: 3 }}>
      <SetForm
        initialWeight={lastWeight || 0}
        initialReps={lastReps || 0}
        submitLabel="Valider"
        onSubmit={async (reps, weight, notes) => {
          const { id } = await mutations.addSet(sessionId, exerciseId, setNumber, reps, weight, undefined, false, restTime, machineSetupId || undefined, notes, submission.current ??= crypto.randomUUID());
          submission.current = null;
          onAdd(id, restTime);
        }}
        onCancel={onCancel}
      >
        <Box sx={{ mb: 2 }}>
          <RestTimePicker value={restTime} onChange={setRestTime} />
        </Box>
      </SetForm>
    </Box>
  );
}



// Rest Time Picker (Ultra minimal - presets + fine-tune)
function ExerciseNoteInline({ exerciseId, forceEdit, onForceEditDone }: { exerciseId: string; forceEdit?: boolean; onForceEditDone?: () => void }) {
  const { actions: mutations } = useEditor();
  const { t, d } = useThemeTokens();
  const { note: currentNote } = useExerciseData();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentNote);

  useEffect(() => { setValue(currentNote); }, [currentNote]);

  useEffect(() => {
    if (forceEdit) {
      setEditing(true);
      onForceEditDone?.();
    }
  }, [forceEdit, onForceEditDone]);

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed !== currentNote) {
      mutations.upsertExerciseNote(exerciseId, trimmed || null);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <Stack direction="row" alignItems="flex-start" spacing={0.75} sx={{ my: 1 }}>
        <NotePencil size={16} weight={W} style={{ color: tc.f(t), marginTop: 6 }} />
        <TextField
          fullWidth
          size="small"
          autoFocus
          placeholder="Note persistante sur cet exercice..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
          sx={{ '& .MuiInputBase-input': { fontSize: '0.8rem' } }}
        />
      </Stack>
    );
  }

  if (!currentNote) return null;

  return (
    <Stack
      direction="row"
      alignItems="flex-start"
      spacing={0.75}
      onClick={(e) => { e.stopPropagation(); setEditing(true); }}
      sx={{
        my: 1, cursor: 'pointer', py: 0.5, px: 1,
        borderLeft: 2, borderColor: GOLD,
        borderRadius: '0 4px 4px 0', bgcolor: alpha(GOLD, 0.05),
      }}
    >
      <NotePencil size={14} weight={W} style={{ color: GOLD, marginTop: 1, flexShrink: 0 }} />
      <Typography variant="caption" sx={{ fontStyle: 'italic', lineHeight: 1.4, color: tc.m(t) }}>
        {currentNote}
      </Typography>
    </Stack>
  );
}

function SessionNotesInput({ sessionId, initialNotes }: { sessionId: string; initialNotes: string }) {
  const { actions: mutations } = useEditor();
  const { t, d } = useThemeTokens();
  const [notes, setNotes] = useState(initialNotes);
  const [expanded, setExpanded] = useState(!!initialNotes);
  const stateRef = useRef({ notes, initialNotes, sessionId, mutations });
  useEffect(() => { stateRef.current = { notes, initialNotes, sessionId, mutations }; }, [notes, initialNotes, sessionId, mutations]);

  // Sync from external changes (e.g. PowerSync remote sync)
  useEffect(() => { setNotes(initialNotes); }, [initialNotes]);

  // Flush a pending note when the user leaves the editor.
  useEffect(() => {
    return () => {
      const { notes, initialNotes, sessionId, mutations } = stateRef.current;
      const trimmed = notes.trim();
      if (trimmed !== initialNotes) {
        mutations.updateSessionNotes(sessionId, trimmed || null);
      }
    };
  }, []);

  const handleBlur = () => {
    const trimmed = notes.trim();
    if (trimmed !== initialNotes) {
      mutations.updateSessionNotes(sessionId, trimmed || null);
    }
  };

  if (!expanded) {
    return (
      <Box
        onClick={() => setExpanded(true)}
        sx={card(d, {
          cursor: 'pointer', py: 1.5,
          borderStyle: 'dashed', borderColor: alpha(GOLD, 0.2),
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
          '&:active': { bgcolor: alpha(GOLD, 0.05) },
        })}
      >
        <NotePencil size={18} weight={W} style={{ color: tc.f(t) }} />
        <Typography variant="caption" sx={{ color: tc.f(t) }}>
          Note de séance
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={card(d, { overflow: 'visible' })}>
      <Stack direction="row" alignItems="center" spacing={0.75} sx={{ px: 2, pt: 1.5 }}>
        <NotePencil size={16} weight={W} style={{ color: tc.f(t) }} />
        <Typography variant="caption" sx={{ color: tc.f(t), fontWeight: 500 }}>Note de séance</Typography>
      </Stack>
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={4}
        size="small"
        placeholder="Comment s'est passée ta séance..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleBlur}
        sx={{
          px: 0.5, pb: 0.5,
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiInputBase-input': { fontSize: '0.85rem' },
        }}
      />
    </Box>
  );
}

function RestTimePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (seconds: number) => void;
}) {
  const { t, d } = useThemeTokens();
  const presets = [60, 90, 120, 180, 300];

  const formatTime = (s: number) =>
    s % 60 === 0 ? `${s / 60}'` : `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleAdjust = (delta: number) => {
    const newValue = Math.max(30, Math.min(600, value + delta));
    if (newValue !== value) {
      triggerHaptic('light');
      onChange(newValue);
    }
  };

  const isPreset = presets.includes(value);

  return (
    <Box>
      {/* Presets */}
      <Stack direction="row" justifyContent="center" alignItems="baseline" spacing={2}>
        {presets.map((p) => {
          const isSelected = value === p;
          return (
            <Typography
              key={p}
              onClick={() => {
                triggerHaptic('light');
                onChange(p);
              }}
              sx={{
                cursor: 'pointer',
                fontSize: isSelected ? '1.1rem' : '0.85rem',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? tc.h(t) : tc.f(t),
                opacity: isSelected ? 1 : 0.5,
                transition: 'all 0.15s ease',
                '&:active': { opacity: 0.7 },
              }}
            >
              {formatTime(p)}
            </Typography>
          );
        })}
      </Stack>

      {/* Fine-tune controls */}
      <Stack direction="row" justifyContent="center" alignItems="center" spacing={1.5} sx={{ mt: 1 }}>
        <Typography
          onClick={() => handleAdjust(-30)}
          sx={{
            cursor: value <= 30 ? 'default' : 'pointer',
            opacity: value <= 30 ? 0.2 : 0.4,
            fontSize: '0.85rem',
            fontWeight: 500,
            userSelect: 'none',
            '&:active': { opacity: 0.6 },
          }}
        >
          −30s
        </Typography>

        {!isPreset && (
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: GOLD,
              minWidth: 40,
              textAlign: 'center',
            }}
          >
            {formatTime(value)}
          </Typography>
        )}

        <Typography
          onClick={() => handleAdjust(30)}
          sx={{
            cursor: value >= 600 ? 'default' : 'pointer',
            opacity: value >= 600 ? 0.2 : 0.4,
            fontSize: '0.85rem',
            fontWeight: 500,
            userSelect: 'none',
            '&:active': { opacity: 0.6 },
          }}
        >
          +30s
        </Typography>
      </Stack>
    </Box>
  );
}

// Stepper Input Component (Apple-style minimal)
function StepperInput({
  label,
  value,
  onChange,
  step,
  min = 0,
  max = 999,
  unit,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min?: number;
  max?: number;
  unit?: string;
}) {
  const { t, d } = useThemeTokens();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleChange = (delta: number) => {
    const newValue = Math.max(min, Math.min(max, value + delta));
    if (newValue !== value) {
      triggerHaptic('light');
      onChange(newValue);
    }
  };

  const handleTapValue = () => {
    setInputValue(value === 0 ? '' : String(value));
    setIsEditing(true);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)));
    }
  };

  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          color: tc.f(t),
          fontSize: '0.65rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}{unit && ` (${unit})`}
      </Typography>

      {/* Stepper */}
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 0.5 }}>
        <Typography
          onClick={() => handleChange(-step)}
          sx={{
            cursor: value <= min ? 'default' : 'pointer',
            opacity: value <= min ? 0.2 : 0.4,
            fontSize: '1.5rem',
            fontWeight: 300,
            userSelect: 'none',
            '&:active': { opacity: 0.6 },
          }}
        >
          −
        </Typography>

        {isEditing ? (
          <input
            type="number"
            autoFocus
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            style={{
              fontSize: '2rem',
              fontWeight: 600,
              width: 72,
              textAlign: 'center',
              border: 'none',
              borderBottom: '2px solid',
              background: 'transparent',
              color: 'inherit',
              outline: 'none',
              padding: 0,
            }}
            step={step}
            min={min}
            max={max}
          />
        ) : (
          <Typography
            onClick={handleTapValue}
            sx={{
              fontSize: '2rem',
              fontWeight: 600,
              minWidth: 48,
              color: tc.h(t),
              cursor: 'pointer',
              '&:active': { opacity: 0.7 },
            }}
          >
            {value}
          </Typography>
        )}

        <Typography
          onClick={() => handleChange(step)}
          sx={{
            cursor: value >= max ? 'default' : 'pointer',
            opacity: value >= max ? 0.2 : 0.4,
            fontSize: '1.5rem',
            fontWeight: 300,
            userSelect: 'none',
            '&:active': { opacity: 0.6 },
          }}
        >
          +
        </Typography>
      </Stack>
    </Box>
  );
}

// Set Input Bottom Sheet
function SetInputSheet({
  exercise,
  sessionId,
  setNumber,
  morphotype,
  defaultRestTime = 90,
  machineSetupId,
  onClose,
  onSetAdded,
}: {
  exercise: Exercise;
  sessionId: string;
  setNumber: number;
  morphotype: MorphotypeResult | null;
  defaultRestTime?: number;
  machineSetupId?: string | null;
  onClose: () => void;
  onSetAdded: (setId: string, restDuration: number) => void;
}) {
  const { actions: mutations } = useEditor();
  const { t, d } = useThemeTokens();
  const { previousSets } = useExerciseData();

  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(0);
  const [restTime, setRestTime] = useState(defaultRestTime);
  const submission = useRef<string | null>(null);
  const [isWarmup, setIsWarmup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMorphoTips, setShowMorphoTips] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Set initial values from previous sets
  useEffect(() => {
    if (previousSets.length > 0) {
      setWeight(parseFloat(previousSets[0].weight || '0'));
      setReps(previousSets[0].reps || 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previousSets.length]);

  const handleSubmit = async () => {
    if (weight == null || !reps) return;
    setIsSubmitting(true);
    triggerHaptic('heavy');
    try {
      const { id } = await mutations.addSet(
        sessionId,
        exercise.id,
        isWarmup ? 0 : setNumber,
        reps,
        weight,
        rpe || undefined,
        isWarmup,
        restTime,
        machineSetupId || undefined,
        notes,
        submission.current ??= crypto.randomUUID()
      );
      submission.current = null;
      onSetAdded(id, restTime);
      onClose();
    } catch (error) {
      console.error('Error adding set:', error);
      setIsSubmitting(false);
    }
  };

  const handleUsePrevious = () => {
    if (previousSets.length > 0) {
      triggerHaptic('medium');
      setWeight(parseFloat(previousSets[0].weight || '0'));
      setReps(previousSets[0].reps || 0);
    }
  };

  const handleProgressiveOverload = () => {
    if (previousSets.length > 0) {
      triggerHaptic('medium');
      setWeight(parseFloat(previousSets[0].weight || '0') + 2.5);
      setReps(previousSets[0].reps || 0);
    }
  };

  return (
    <Box sx={{ p: 3, maxHeight: '90vh', overflow: 'auto' }}>
      {/* Handle */}
      <Box sx={{ width: 48, height: 4, bgcolor: d ? alpha('#ffffff', 0.15) : alpha('#000000', 0.1), borderRadius: 2, mx: 'auto', mb: 2 }} />

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(t) }}>{exercise.nameFr}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={isWarmup ? 'Échauffement' : `Série ${setNumber}`}
              size="small"
              color={isWarmup ? 'warning' : 'primary'}
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
            <Chip
              label={isWarmup ? 'Travail' : 'Échauf.'}
              size="small"
              variant="outlined"
              onClick={() => {
                triggerHaptic('light');
                setIsWarmup(!isWarmup);
              }}
              sx={{ height: 22, fontSize: '0.7rem', cursor: 'pointer' }}
            />
          </Stack>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={24} weight={W} />
        </IconButton>
      </Stack>

      {/* Exercise note (global) */}
      <ExerciseNoteInline exerciseId={exercise.id} />

      {/* Quick Fill - Last Set */}
      {previousSets.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button
            size="small"
            onClick={handleUsePrevious}
            sx={{
              flex: 1,
              py: 1,
              borderStyle: 'dashed',
              border: '1px dashed',
              borderColor: alpha(GOLD, 0.3),
              borderRadius: '14px',
              textTransform: 'none',
            }}
          >
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="caption" sx={{ color: tc.m(t) }}>Dernière fois</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: tc.h(t) }}>
                {previousSets[0].reps} × {previousSets[0].weight}kg
              </Typography>
            </Stack>
          </Button>
          <Button
            size="small"
            onClick={handleProgressiveOverload}
            sx={{
              flex: 1,
              ...goldBtnSx,
              py: 1,
            }}
          >
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Progression</Typography>
              <Typography variant="body2" fontWeight={600}>
                {previousSets[0].reps} × {(parseFloat(previousSets[0].weight || '0') + 2.5).toFixed(1)}kg
              </Typography>
            </Stack>
          </Button>
        </Stack>
      )}

      {/* Reps & Weight */}
      <Stack direction="row" spacing={4} justifyContent="center" sx={{ mb: 3 }}>
        <StepperInput
          label="Reps"
          value={reps}
          onChange={setReps}
          step={1}
          min={0}
          max={100}
        />
        <StepperInput
          label="Poids"
          value={weight}
          onChange={setWeight}
          step={2.5}
          unit="kg"
        />
      </Stack>

      {/* Rest time */}
      <Box sx={{ mb: 2 }}>
        <RestTimePicker value={restTime} onChange={setRestTime} />
      </Box>

      {/* Effort level (minimal) */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            textAlign: 'center',
            mb: 1,
            color: tc.f(t),
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Difficulté
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          {[
            { value: 6, label: '😊' },
            { value: 7, label: '🙂' },
            { value: 8, label: '😤' },
            { value: 9, label: '🥵' },
            { value: 10, label: '💀' },
          ].map((item) => (
            <Typography
              key={item.value}
              onClick={() => {
                triggerHaptic('light');
                setRpe(rpe === item.value ? 0 : item.value);
              }}
              sx={{
                fontSize: rpe === item.value ? '1.5rem' : '1.2rem',
                opacity: rpe === item.value ? 1 : 0.4,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:active': { transform: 'scale(0.9)' },
              }}
            >
              {item.label}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Notes */}
      {showNotes ? (
        <TextField
          fullWidth
          size="small"
          placeholder="Note sur cette série..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              sx: { fontSize: '0.85rem' },
              startAdornment: <NotePencil size={16} weight={W} style={{ color: tc.f(t), marginRight: 6 }} />,
            },
          }}
        />
      ) : (
        <Chip
          icon={<NotePencil size={14} weight={W} />}
          label="Note"
          size="small"
          variant="outlined"
          onClick={() => setShowNotes(true)}
          sx={{ height: 24, fontSize: '0.7rem', borderStyle: 'dashed', cursor: 'pointer', mb: 2, mx: 'auto' }}
        />
      )}

      {/* Morpho Tips (collapsible) */}
      {morphotype && (
        <Box
          sx={card(d, {
            mb: 2,
            p: 1.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
          })}
          onClick={() => setShowMorphoTips(!showMorphoTips)}
        >
            {showMorphoTips ? (
              <MorphoTipsPanel
                exerciseName={exercise.nameFr}
                muscleGroup={exercise.muscleGroup}
                morphotype={morphotype}
                morphoRecommendation={exercise.morphotypeRecommendations as MorphoRecommendation | null}
                expanded={true}
              />
            ) : (
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="caption" sx={{ color: tc.m(t) }}>
                  💡 Conseils morpho
                </Typography>
              </Stack>
            )}
        </Box>
      )}

      {/* Submit Button */}
      <Button
        fullWidth
        size="large"
        onClick={handleSubmit}
        disabled={weight == null || !reps || isSubmitting}
        sx={{
          ...goldBtnSx,
          py: 2,
          fontSize: '1rem',
          fontWeight: 700,
          boxShadow: `0 4px 20px ${alpha(GOLD, 0.4)}`,
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&:disabled': {
            bgcolor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
            color: tc.f(t),
          },
        }}
      >
        {isSubmitting ? 'Enregistrement...' : `Valider ${reps} × ${weight}kg`}
      </Button>
    </Box>
  );
}
