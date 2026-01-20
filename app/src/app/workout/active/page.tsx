'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getActiveSession,
  getExercises,
  addSet,
  deleteSet,
  endWorkoutSession,
  getLastSetsForExercise,
  getUserMorphotype,
  getSessionTemplateExercises,
  getSimilarExercises,
  swapTemplateExercise,
  type Exercise,
  type WorkoutSet,
  type ActiveSession,
  type TemplateExercise,
} from '../actions';
import type { MorphotypeResult } from '@/app/morphology/types';
import { MorphoTipsPanel, MorphoScoreBadge } from '@/components/workout/MorphoTipsPanel';
import ExerciseDetailModal from '@/components/workout/ExerciseDetailModal';
import {
  scoreExercise,
  getCategoryDefault,
  type MorphoRecommendation,
} from '@/lib/morpho-exercise-scoring';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
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
import Divider from '@mui/material/Divider';
import Add from '@mui/icons-material/Add';
import Close from '@mui/icons-material/Close';
import Delete from '@mui/icons-material/Delete';
import ArrowBack from '@mui/icons-material/ArrowBack';
import Timer from '@mui/icons-material/Timer';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Search from '@mui/icons-material/Search';
import SwapHoriz from '@mui/icons-material/SwapHoriz';
import VolumeUp from '@mui/icons-material/VolumeUp';
import VolumeOff from '@mui/icons-material/VolumeOff';
import Vibration from '@mui/icons-material/Vibration';
import ChevronRight from '@mui/icons-material/ChevronRight';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [morphotype, setMorphotype] = useState<MorphotypeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Timer state
  const [restTimer, setRestTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration] = useState(90);
  const [timerSound, setTimerSound] = useState(true);
  const [timerVibration, setTimerVibration] = useState(true);

  // Elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Swap exercise state
  const [swapExerciseId, setSwapExerciseId] = useState<string | null>(null);
  const [similarExercises, setSimilarExercises] = useState<Exercise[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    const data = await getActiveSession(sessionId);
    setSession(data);
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    async function init() {
      if (!sessionId) return;
      const [exerciseData, , morphoData, templateData] = await Promise.all([
        getExercises(),
        loadSession(),
        getUserMorphotype(),
        getSessionTemplateExercises(sessionId),
      ]);
      setExercises(exerciseData);
      setMorphotype(morphoData);
      setTemplateExercises(templateData);
    }
    init();
  }, [loadSession, sessionId]);

  // Elapsed time counter
  useEffect(() => {
    if (!session) return;
    const startTime = new Date(session.session.startedAt).getTime();

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Rest timer
  useEffect(() => {
    if (!isTimerRunning || restTimer <= 0) return;

    const interval = setInterval(() => {
      setRestTimer((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          // Vibration
          if (timerVibration && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          // Sound - 3 beeps
          if (timerSound) {
            try {
              const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
              const audioContext = new AudioContextClass();
              [0, 0.25, 0.5].forEach((delay) => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = 880;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.4, audioContext.currentTime + delay);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + 0.2);
                osc.start(audioContext.currentTime + delay);
                osc.stop(audioContext.currentTime + delay + 0.2);
              });
            } catch {
              // Audio not supported
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer, timerSound, timerVibration]);

  const startTimer = (duration?: number, sound?: boolean, vibration?: boolean) => {
    setRestTimer(duration || timerDuration);
    if (sound !== undefined) setTimerSound(sound);
    if (vibration !== undefined) setTimerVibration(vibration);
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    setRestTimer(0);
  };

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowExercisePicker(false);
  };

  const handleEndWorkout = async () => {
    if (!sessionId) return;
    try {
      const result = await endWorkoutSession(sessionId);
      router.push(`/workout/summary?xp=${result.xpEarned}&volume=${result.totalVolume}&duration=${result.duration}&prs=${result.prCount}`);
    } catch (error) {
      console.error('Error ending workout:', error);
    }
  };

  const handleOpenSwap = async (exerciseId: string) => {
    setSwapExerciseId(exerciseId);
    setIsLoadingSimilar(true);
    try {
      const similar = await getSimilarExercises(exerciseId);
      setSimilarExercises(similar);
    } catch (error) {
      console.error('Error loading similar exercises:', error);
    }
    setIsLoadingSimilar(false);
  };

  const handleSwapExercise = async (newExerciseId: string) => {
    if (!sessionId || !swapExerciseId) return;
    try {
      await swapTemplateExercise(sessionId, swapExerciseId, newExerciseId);
      // Reload template exercises
      const templateData = await getSessionTemplateExercises(sessionId);
      setTemplateExercises(templateData);
      setSwapExerciseId(null);
      setSimilarExercises([]);
    } catch (error) {
      console.error('Error swapping exercise:', error);
    }
  };

  if (!sessionId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Typography color="text.secondary">Session invalide</Typography>
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Group sets by exercise
  const setsByExercise = new Map<string, WorkoutSet[]>();
  session?.sets.forEach((set) => {
    const existing = setsByExercise.get(set.exerciseId) || [];
    setsByExercise.set(set.exerciseId, [...existing, set]);
  });

  // Get last rest time used (from most recent set)
  const lastRestTime = session?.sets.length
    ? session.sets[session.sets.length - 1].restTaken ?? 90
    : 90;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: 16, bgcolor: 'background.default' }}>
      {/* Header with timer */}
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          borderRadius: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>Séance en cours</Typography>
            <Typography variant="body2" color="text.secondary">{formatTime(elapsedSeconds)}</Typography>
          </Box>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => setShowEndConfirm(true)}
            sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: 'error.light', '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' } }}
          >
            Terminer
          </Button>
        </Stack>
      </Paper>

      {/* Rest Timer (sticky) - Apple-style minimal */}
      {(isTimerRunning || restTimer > 0) && (
        <Box
          sx={{
            position: 'sticky',
            top: 56,
            zIndex: 10,
            py: 2,
            bgcolor: 'background.default',
            borderBottom: 1,
            borderColor: 'divider',
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
              color: restTimer <= 10 ? 'error.main' : 'text.primary',
              transition: 'color 0.3s ease',
            }}
          >
            {formatTime(restTimer)}
          </Typography>

          {/* Controls */}
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={3} sx={{ mt: 1 }}>
            <Typography
              onClick={() => setRestTimer((prev) => Math.max(0, prev - 30))}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'text.secondary',
                opacity: 0.6,
                '&:active': { opacity: 1 },
              }}
            >
              −30
            </Typography>

            <Typography
              onClick={() => setRestTimer((prev) => prev + 30)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'text.secondary',
                opacity: 0.6,
                '&:active': { opacity: 1 },
              }}
            >
              +30
            </Typography>

            <Typography
              onClick={stopTimer}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: 'text.disabled',
                '&:active': { color: 'error.main' },
              }}
            >
              ✕
            </Typography>
          </Stack>

          {/* Sound/Vibration toggles - subtle icons */}
          <Stack direction="row" justifyContent="center" spacing={3} sx={{ mt: 1.5 }}>
            <Box
              onClick={() => {
                triggerHaptic('light');
                setTimerSound(!timerSound);
              }}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: timerSound ? 'text.secondary' : 'text.disabled',
                opacity: timerSound ? 0.7 : 0.3,
                transition: 'all 0.2s ease',
                '&:active': { opacity: 1 },
              }}
            >
              {timerSound ? <VolumeUp sx={{ fontSize: 20 }} /> : <VolumeOff sx={{ fontSize: 20 }} />}
            </Box>
            <Box
              onClick={() => {
                triggerHaptic('light');
                setTimerVibration(!timerVibration);
              }}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: timerVibration ? 'text.secondary' : 'text.disabled',
                opacity: timerVibration ? 0.7 : 0.3,
                transition: 'all 0.2s ease',
                '&:active': { opacity: 1 },
              }}
            >
              <Vibration sx={{ fontSize: 20 }} />
            </Box>
          </Stack>
        </Box>
      )}

      {/* Exercise Sets */}
      <Box sx={{ flex: 1, p: 2 }}>
        <Stack spacing={2}>
          {/* Template exercises (planned workout) */}
          {templateExercises.length > 0 && (
            <>
              {templateExercises.map((templateEx, index) => {
                const exerciseSets = setsByExercise.get(templateEx.exerciseId) || [];
                const exercise = exercises.find(e => e.id === templateEx.exerciseId);
                const completedSets = exerciseSets.filter(s => !s.isWarmup).length;
                const targetSets = templateEx.targetSets;
                const isComplete = completedSets >= targetSets;

                return (
                  <Card
                    key={templateEx.exerciseId}
                    sx={{
                      border: isComplete ? 2 : 1,
                      borderColor: isComplete ? 'success.main' : 'divider',
                      opacity: isComplete ? 0.7 : 1,
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={index + 1}
                              size="small"
                              color={isComplete ? 'success' : 'primary'}
                              sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                            />
                            <Typography variant="subtitle2" fontWeight={600}>
                              {templateEx.exerciseName}
                            </Typography>
                          </Stack>
                          <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Objectif: {targetSets} × {templateEx.targetReps}
                            </Typography>
                            <Typography variant="caption" color={isComplete ? 'success.main' : 'text.secondary'}>
                              Fait: {completedSets}/{targetSets} séries
                            </Typography>
                          </Stack>
                          {templateEx.notes && (
                            <Typography variant="caption" color="warning.main" sx={{ mt: 0.5, display: 'block' }}>
                              💡 {templateEx.notes.split(' | ')[0]}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenSwap(templateEx.exerciseId)}
                            sx={{ border: 1, borderColor: 'divider' }}
                          >
                            <SwapHoriz fontSize="small" />
                          </IconButton>
                          <Button
                            size="small"
                            variant={isComplete ? 'outlined' : 'contained'}
                            onClick={() => {
                              if (exercise) {
                                setSelectedExercise(exercise);
                              }
                            }}
                            disabled={!exercise}
                          >
                            {isComplete ? '+ série' : 'Ajouter'}
                          </Button>
                        </Stack>
                      </Stack>

                      {/* Show sets if any */}
                      {exerciseSets.length > 0 && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {exerciseSets.map((set, i) => (
                            <Chip
                              key={set.id}
                              label={
                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                  <span>{set.weight}kg × {set.reps}</span>
                                  {set.restTaken && (
                                    <Typography component="span" sx={{ fontSize: '0.6rem', opacity: 0.6 }}>
                                      {Math.floor(set.restTaken / 60)}:{(set.restTaken % 60).toString().padStart(2, '0')}
                                    </Typography>
                                  )}
                                </Stack>
                              }
                              size="small"
                              color={set.isPr ? 'warning' : 'default'}
                              variant="outlined"
                              onDelete={() => {
                                deleteSet(set.id).then(loadSession);
                              }}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}

          {/* Sets from exercises not in template */}
          {Array.from(setsByExercise.entries())
            .filter(([exerciseId]) => !templateExercises.some(t => t.exerciseId === exerciseId))
            .map(([exerciseId, sets]) => {
              const exercise = session?.exercises.get(exerciseId);
              return (
                <ExerciseCard
                  key={exerciseId}
                  exercise={exercise}
                  sets={sets}
                  sessionId={sessionId}
                  defaultRestTime={lastRestTime}
                  onSetAdded={loadSession}
                  onSetDeleted={loadSession}
                  onStartTimer={startTimer}
                />
              );
            })}

          {/* Add Exercise Button */}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setShowExercisePicker(true)}
            sx={{
              py: 2,
              borderStyle: 'dashed',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
            }}
            startIcon={<Add />}
          >
            Ajouter un exercice
          </Button>
        </Stack>
      </Box>

      {/* Selected Exercise Input (bottom sheet) */}
      <Drawer
        anchor="bottom"
        open={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        PaperProps={{
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: 'background.paper' },
        }}
      >
        {selectedExercise && (
          <SetInputSheet
            exercise={selectedExercise}
            sessionId={sessionId}
            setNumber={(setsByExercise.get(selectedExercise.id)?.length || 0) + 1}
            morphotype={morphotype}
            defaultRestTime={lastRestTime}
            onClose={() => setSelectedExercise(null)}
            onSetAdded={(restDuration) => {
              loadSession();
              startTimer(restDuration);
            }}
          />
        )}
      </Drawer>

      {/* Exercise Picker Modal */}
      <Drawer
        anchor="bottom"
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        PaperProps={{
          sx: { height: '90vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: 'background.default' },
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
      <Dialog open={showEndConfirm} onClose={() => setShowEndConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Terminer la séance ?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Tu as fait {session?.sets.filter(s => !s.isWarmup).length || 0} séries.
            Tu peux toujours reprendre plus tard.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setShowEndConfirm(false)} variant="outlined">
            Continuer
          </Button>
          <Button
            onClick={handleEndWorkout}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
            }}
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
          sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, bgcolor: 'background.paper', maxHeight: '70vh' },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Remplacer l'exercice
            </Typography>
            <IconButton onClick={() => {
              setSwapExerciseId(null);
              setSimilarExercises([]);
            }}>
              <Close />
            </IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Exercices ciblant le même groupe musculaire :
          </Typography>

          {isLoadingSimilar ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : similarExercises.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
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
                      borderRadius: 2,
                      mb: 0.5,
                      border: 1,
                      borderColor: ex.score >= 75 ? 'success.main' : ex.score >= 50 ? 'divider' : 'warning.main',
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

      {/* Quick Add FAB - minimal style */}
      {!selectedExercise && !showExercisePicker && (
        <Fab
          onClick={() => setShowExercisePicker(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            bgcolor: 'background.paper',
            color: 'text.primary',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            border: 1,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'background.paper',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
        >
          <Add sx={{ fontSize: 28 }} />
        </Fab>
      )}
    </Box>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
          <CircularProgress />
        </Box>
      }
    >
      <ActiveWorkoutContent />
    </Suspense>
  );
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  sets,
  sessionId,
  defaultRestTime = 90,
  onSetAdded,
  onSetDeleted,
  onStartTimer,
}: {
  exercise: Exercise | undefined;
  sets: WorkoutSet[];
  sessionId: string;
  defaultRestTime?: number;
  onSetAdded: () => void;
  onSetDeleted: () => void;
  onStartTimer: (duration?: number) => void;
}) {
  const [showAddSet, setShowAddSet] = useState(false);
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);

  useEffect(() => {
    if (exercise) {
      getLastSetsForExercise(exercise.id).then(setPreviousSets);
    }
  }, [exercise]);

  if (!exercise) return null;

  const workingSets = sets.filter((s) => !s.isWarmup);
  const lastSet = workingSets[workingSets.length - 1];

  return (
    <Card>
      {/* Exercise Header */}
      <CardContent sx={{ pb: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{exercise.nameFr}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
              {exercise.muscleGroup}
            </Typography>
          </Box>
          {previousSets.length > 0 && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">Dernière fois</Typography>
              <Typography variant="body2" color="text.primary">
                {previousSets[0].weight}kg × {previousSets[0].reps}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>

      {/* Sets List */}
      <Box sx={{ px: 2, pb: 1 }}>
        {sets.map((set) => (
          <Box
            key={set.id}
            sx={{
              py: 1.5,
              borderBottom: 1,
              borderColor: 'divider',
              ...(set.isWarmup && { bgcolor: 'action.hover', mx: -2, px: 2 }),
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'action.hover',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {set.isWarmup ? 'W' : set.setNumber}
                </Box>
                <Box>
                  <Typography component="span" fontWeight={500}>{set.weight}kg</Typography>
                  <Typography component="span" color="text.secondary" sx={{ mx: 1 }}>×</Typography>
                  <Typography component="span" fontWeight={500}>{set.reps}</Typography>
                  {set.rpe && <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>RPE {set.rpe}</Typography>}
                  {set.restTaken && (
                    <Typography component="span" color="text.disabled" sx={{ ml: 1, fontSize: '0.75rem' }}>
                      ⏱️ {Math.floor(set.restTaken / 60)}:{(set.restTaken % 60).toString().padStart(2, '0')}
                    </Typography>
                  )}
                </Box>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                {set.isPr && (
                  <Chip
                    icon={<EmojiEvents sx={{ fontSize: 16 }} />}
                    label="PR!"
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 600 }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={async () => {
                    await deleteSet(set.id);
                    onSetDeleted();
                  }}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        ))}
      </Box>

      {/* Add Set Button */}
      {!showAddSet ? (
        <Button
          fullWidth
          onClick={() => setShowAddSet(true)}
          sx={{ color: 'primary.main', py: 1.5 }}
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
          onCancel={() => setShowAddSet(false)}
          onAdd={(restDuration) => {
            setShowAddSet(false);
            onSetAdded();
            onStartTimer(restDuration);
          }}
        />
      )}
    </Card>
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
  onCancel,
  onAdd,
}: {
  exerciseId: string;
  sessionId: string;
  setNumber: number;
  lastWeight?: number;
  lastReps?: number;
  defaultRestTime?: number;
  onCancel: () => void;
  onAdd: (restDuration: number) => void;
}) {
  const [weight, setWeight] = useState(lastWeight || 0);
  const [reps, setReps] = useState(lastReps || 0);
  const [restTime, setRestTime] = useState(defaultRestTime);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!weight || !reps) return;
    setIsSubmitting(true);
    triggerHaptic('heavy');
    try {
      await addSet(sessionId, exerciseId, setNumber, reps, weight, undefined, false, restTime);
      onAdd(restTime);
    } catch (error) {
      console.error('Error adding set:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ py: 2, px: 3 }}>
      {/* Reps & Weight */}
      <Stack direction="row" spacing={4} justifyContent="center" sx={{ mb: 2 }}>
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

      {/* Actions */}
      <Stack direction="row" spacing={1.5}>
        <Button
          fullWidth
          onClick={onCancel}
          sx={{
            color: 'text.secondary',
            fontWeight: 500,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          Annuler
        </Button>
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={!weight || !reps || isSubmitting}
          sx={{
            bgcolor: 'text.primary',
            color: 'background.default',
            fontWeight: 600,
            '&:hover': { bgcolor: 'text.primary', opacity: 0.9 },
            '&:disabled': { bgcolor: 'action.disabled', color: 'text.disabled' },
          }}
        >
          {isSubmitting ? '...' : 'Valider'}
        </Button>
      </Stack>
    </Box>
  );
}

// Primary muscle translations
const PRIMARY_MUSCLE_LABELS: Record<string, string> = {
  // Pectoraux
  pec_major_sternal: 'Pec. sternal',
  pec_major_clavicular: 'Pec. claviculaire',
  pec_major_abdominal: 'Pec. abdominal',
  // Dos
  latissimus_dorsi: 'Grand dorsal',
  teres_major: 'Grand rond',
  rhomboids: 'Rhomboïdes',
  trapezius_mid: 'Trapèzes moyen',
  trapezius_upper: 'Trapèzes supérieur',
  erector_spinae: 'Érecteurs',
  // Épaules
  anterior_delt: 'Deltoïde ant.',
  lateral_delt: 'Deltoïde lat.',
  posterior_delt: 'Deltoïde post.',
  infraspinatus: 'Infra-épineux',
  // Jambes
  quadriceps_rectus_femoris: 'Quadriceps',
  quadriceps_vastus_lateralis: 'Vaste externe',
  quadriceps_vastus_medialis: 'Vaste interne',
  gluteus_maximus: 'Fessiers',
  hamstrings_biceps_femoris: 'Ischios',
  hamstrings_semitendinosus: 'Semi-tendineux',
  calves_gastrocnemius: 'Mollets (gastro)',
  calves_soleus: 'Mollets (soléaire)',
  hip_flexors: 'Fléchisseurs hanche',
  adductors: 'Adducteurs',
  // Bras
  biceps_long_head: 'Biceps long',
  biceps_short_head: 'Biceps court',
  brachialis: 'Brachial',
  brachioradialis: 'Brachio-radial',
  triceps_long_head: 'Triceps long',
  triceps_lateral_head: 'Triceps latéral',
  triceps_medial_head: 'Triceps médial',
  forearm_flexors: 'Avant-bras fléch.',
  forearm_extensors: 'Avant-bras ext.',
  // Core
  rectus_abdominis: 'Grand droit',
  obliques: 'Obliques',
  transverse_abdominis: 'Transverse',
};

// Muscle group translations
const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  legs: 'Jambes',
  arms: 'Bras',
  core: 'Abdos',
  full_body: 'Full Body',
};

// Mapping primary muscles to simplified subcategory names
const MUSCLE_TO_SUBCATEGORY: Record<string, string> = {
  // Jambes
  quadriceps_rectus_femoris: 'Quadriceps',
  quadriceps_vastus_lateralis: 'Quadriceps',
  quadriceps_vastus_medialis: 'Quadriceps',
  gluteus_maximus: 'Fessiers',
  hamstrings_biceps_femoris: 'Ischios',
  hamstrings_semitendinosus: 'Ischios',
  calves_gastrocnemius: 'Mollets',
  calves_soleus: 'Mollets',
  adductors: 'Adducteurs',
  hip_flexors: 'Adducteurs',
  // Bras
  biceps_long_head: 'Biceps',
  biceps_short_head: 'Biceps',
  brachialis: 'Biceps',
  brachioradialis: 'Biceps',
  triceps_long_head: 'Triceps',
  triceps_lateral_head: 'Triceps',
  triceps_medial_head: 'Triceps',
  forearm_flexors: 'Avant-bras',
  forearm_extensors: 'Avant-bras',
  // Épaules
  anterior_delt: 'Delt. avant',
  lateral_delt: 'Delt. latéral',
  posterior_delt: 'Delt. arrière',
  infraspinatus: 'Delt. arrière',
  // Dos
  latissimus_dorsi: 'Grand dorsal',
  teres_major: 'Grand dorsal',
  trapezius_mid: 'Trapèzes',
  trapezius_upper: 'Trapèzes',
  rhomboids: 'Trapèzes',
  erector_spinae: 'Lombaires',
  // Pectoraux
  pec_major_clavicular: 'Pec. haut',
  pec_major_sternal: 'Pec. milieu',
  pec_major_abdominal: 'Pec. bas',
  // Core
  rectus_abdominis: 'Abdos',
  transverse_abdominis: 'Abdos',
  obliques: 'Obliques',
};

// Helper to get subcategory for an exercise
function getExerciseSubcategory(primaryMuscles: string[] | null): string | null {
  if (!primaryMuscles || primaryMuscles.length === 0) return null;
  return MUSCLE_TO_SUBCATEGORY[primaryMuscles[0]] || null;
}

// Exercise Picker Modal - Apple style
function ExercisePicker({
  exercises,
  morphotype,
  onSelect,
  onClose,
}: {
  exercises: Exercise[];
  morphotype: MorphotypeResult | null;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sortByScore, setSortByScore] = useState(true);
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))].filter(g => g !== 'full_body');

  // Dynamically generate subcategories from exercises in selected muscle group
  const subcategories = useMemo(() => {
    if (!selectedMuscle) return [];
    const muscleExercises = exercises.filter(e => e.muscleGroup === selectedMuscle);
    const subs = new Set<string>();
    muscleExercises.forEach(ex => {
      const sub = getExerciseSubcategory(ex.primaryMuscles);
      if (sub) subs.add(sub);
    });
    return Array.from(subs).sort();
  }, [exercises, selectedMuscle]);

  // Calculate scores for all exercises
  const exercisesWithScores = useMemo(() => {
    if (!morphotype) return exercises.map((e) => ({ exercise: e, score: 70 }));

    return exercises.map((exercise) => {
      const rec = (exercise.morphotypeRecommendations as MorphoRecommendation | null)
        || getCategoryDefault(exercise.muscleGroup, exercise.nameFr);
      const result = scoreExercise(morphotype, rec);
      return { exercise, score: result.score };
    });
  }, [exercises, morphotype]);

  const filteredExercises = useMemo(() => {
    let filtered = exercisesWithScores.filter(({ exercise }) => {
      const matchesSearch = exercise.nameFr.toLowerCase().includes(search.toLowerCase());
      const matchesMuscle = !selectedMuscle || exercise.muscleGroup === selectedMuscle;

      // Subcategory filter - match by subcategory name
      let matchesSubcategory = true;
      if (selectedSubcategory) {
        const exerciseSubcategory = getExerciseSubcategory(exercise.primaryMuscles);
        matchesSubcategory = exerciseSubcategory === selectedSubcategory;
      }

      return matchesSearch && matchesMuscle && matchesSubcategory;
    });

    if (sortByScore) {
      filtered = [...filtered].sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [exercisesWithScores, search, selectedMuscle, selectedSubcategory, sortByScore]);

  const handleMuscleSelect = (muscle: string | null) => {
    triggerHaptic('light');
    setSelectedMuscle(muscle);
    setSelectedSubcategory(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'background.default' }}>
      {/* Header - minimal */}
      <Box sx={{ pt: 1.5, pb: 1, px: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box
            onClick={onClose}
            sx={{
              cursor: 'pointer',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              color: 'text.secondary',
              '&:active': { opacity: 0.5 },
            }}
          >
            <Close sx={{ fontSize: 24 }} />
          </Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Exercices
          </Typography>
          <Box sx={{ width: 32 }} /> {/* Spacer for centering */}
        </Stack>
      </Box>

      {/* Search - clean */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 1.5,
            py: 1,
          }}
        >
          <Search sx={{ fontSize: 20, color: 'text.disabled', mr: 1 }} />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '1rem',
              color: 'inherit',
            }}
          />
        </Box>
      </Box>

      {/* Muscle Filter - text style */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 0.5 }}>
          <Typography
            onClick={() => handleMuscleSelect(null)}
            sx={{
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: !selectedMuscle ? 600 : 400,
              color: !selectedMuscle ? 'text.primary' : 'text.disabled',
              whiteSpace: 'nowrap',
              '&:active': { opacity: 0.5 },
            }}
          >
            Tous
          </Typography>
          {muscleGroups.map((muscle) => (
            <Typography
              key={muscle}
              onClick={() => handleMuscleSelect(muscle)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: selectedMuscle === muscle ? 600 : 400,
                color: selectedMuscle === muscle ? 'text.primary' : 'text.disabled',
                whiteSpace: 'nowrap',
                '&:active': { opacity: 0.5 },
              }}
            >
              {MUSCLE_GROUP_LABELS[muscle] || muscle}
            </Typography>
          ))}
        </Stack>
      </Box>

      {/* Subcategory Filter */}
      {selectedMuscle && subcategories.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto' }}>
            <Typography
              onClick={() => {
                triggerHaptic('light');
                setSelectedSubcategory(null);
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: !selectedSubcategory ? 600 : 400,
                color: !selectedSubcategory ? 'primary.main' : 'text.disabled',
                whiteSpace: 'nowrap',
              }}
            >
              Tous
            </Typography>
            {subcategories.map((sub) => (
              <Typography
                key={sub}
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedSubcategory(sub);
                }}
                sx={{
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: selectedSubcategory === sub ? 600 : 400,
                  color: selectedSubcategory === sub ? 'primary.main' : 'text.disabled',
                  whiteSpace: 'nowrap',
                }}
              >
                {sub}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {/* Count + Sort */}
      <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.disabled">
            {filteredExercises.length} exercices
          </Typography>
          {morphotype && (
            <Typography
              onClick={() => {
                triggerHaptic('light');
                setSortByScore(!sortByScore);
              }}
              sx={{
                cursor: 'pointer',
                fontSize: '0.75rem',
                color: sortByScore ? 'primary.main' : 'text.disabled',
                fontWeight: sortByScore ? 600 : 400,
              }}
            >
              {sortByScore ? '✓ Morpho' : 'Morpho'}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Exercise List */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, py: 1 }}>
        <Stack spacing={1}>
          {filteredExercises.map(({ exercise, score }) => (
            <Box
              key={exercise.id}
              onClick={() => {
                triggerHaptic('light');
                onSelect(exercise);
              }}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderRadius: 2,
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
                '&:active': {
                  bgcolor: 'action.hover',
                  transform: 'scale(0.98)',
                },
              }}
            >
              {/* Score badge */}
              <MorphoScoreBadge score={score} size="small" />

              <Box sx={{ flex: 1, minWidth: 0, ml: 1.5 }}>
                <Typography
                  sx={{
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {exercise.nameFr}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: 'text.disabled',
                    mt: 0.25,
                  }}
                >
                  {getExerciseSubcategory(exercise.primaryMuscles) || MUSCLE_GROUP_LABELS[exercise.muscleGroup] || exercise.muscleGroup}
                </Typography>
              </Box>

              {/* Info button */}
              <Box
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic('light');
                  setDetailExercise(exercise);
                }}
                sx={{
                  p: 0.75,
                  mr: 0.5,
                  borderRadius: 1,
                  color: 'text.disabled',
                  '&:active': { bgcolor: 'action.hover' },
                }}
              >
                <InfoOutlined sx={{ fontSize: 18 }} />
              </Box>

              <ChevronRight sx={{ fontSize: 20, color: 'text.disabled', opacity: 0.5 }} />
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal
        exercise={detailExercise ? {
          id: detailExercise.id,
          nameFr: detailExercise.nameFr,
          nameEn: detailExercise.nameEn,
          muscleGroup: detailExercise.muscleGroup,
          primaryMuscles: detailExercise.primaryMuscles,
          secondaryMuscles: detailExercise.secondaryMuscles,
          equipment: detailExercise.equipment,
          difficulty: detailExercise.difficulty,
        } : null}
        open={!!detailExercise}
        onClose={() => setDetailExercise(null)}
        onSelect={() => {
          if (detailExercise) {
            onSelect(detailExercise);
          }
        }}
      />
    </Box>
  );
}

// Haptic feedback helper
const triggerHaptic = (style: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] };
    navigator.vibrate(patterns[style]);
  }
};

// Rest Time Picker (Ultra minimal - presets + fine-tune)
function RestTimePicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (seconds: number) => void;
}) {
  const presets = [60, 90, 120, 180, 300];

  const formatTime = (t: number) =>
    t % 60 === 0 ? `${t / 60}'` : `${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`;

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
        {presets.map((t) => {
          const isSelected = value === t;
          return (
            <Typography
              key={t}
              onClick={() => {
                triggerHaptic('light');
                onChange(t);
              }}
              sx={{
                cursor: 'pointer',
                fontSize: isSelected ? '1.1rem' : '0.85rem',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'text.primary' : 'text.disabled',
                opacity: isSelected ? 1 : 0.5,
                transition: 'all 0.15s ease',
                '&:active': { opacity: 0.7 },
              }}
            >
              {formatTime(t)}
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
              color: 'primary.main',
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
  const handleChange = (delta: number) => {
    const newValue = Math.max(min, Math.min(max, value + delta));
    if (newValue !== value) {
      triggerHaptic('light');
      onChange(newValue);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      {/* Label */}
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
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

        <Typography
          sx={{
            fontSize: '2rem',
            fontWeight: 600,
            minWidth: 48,
            color: 'text.primary',
          }}
        >
          {value}
        </Typography>

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
  onClose,
  onSetAdded,
}: {
  exercise: Exercise;
  sessionId: string;
  setNumber: number;
  morphotype: MorphotypeResult | null;
  defaultRestTime?: number;
  onClose: () => void;
  onSetAdded: (restDuration: number) => void;
}) {
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(0);
  const [restTime, setRestTime] = useState(defaultRestTime);
  const [isWarmup, setIsWarmup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);
  const [showMorphoTips, setShowMorphoTips] = useState(false);

  useEffect(() => {
    getLastSetsForExercise(exercise.id).then((sets) => {
      setPreviousSets(sets);
      if (sets.length > 0) {
        setWeight(parseFloat(sets[0].weight || '0'));
        setReps(sets[0].reps || 0);
      }
    });
  }, [exercise.id]);

  const handleSubmit = async () => {
    if (!weight || !reps) return;
    setIsSubmitting(true);
    triggerHaptic('heavy');
    try {
      await addSet(
        sessionId,
        exercise.id,
        isWarmup ? 0 : setNumber,
        reps,
        weight,
        rpe || undefined,
        isWarmup,
        restTime
      );
      onSetAdded(restTime);
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
      <Box sx={{ width: 48, height: 4, bgcolor: 'action.hover', borderRadius: 2, mx: 'auto', mb: 2 }} />

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>{exercise.nameFr}</Typography>
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
          <Close />
        </IconButton>
      </Stack>

      {/* Quick Fill - Last Set */}
      {previousSets.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleUsePrevious}
            sx={{
              flex: 1,
              py: 1,
              borderStyle: 'dashed',
              textTransform: 'none',
            }}
          >
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="caption" color="text.secondary">Dernière fois</Typography>
              <Typography variant="body2" fontWeight={600}>
                {previousSets[0].weight}kg × {previousSets[0].reps}
              </Typography>
            </Stack>
          </Button>
          <Button
            variant="contained"
            size="small"
            onClick={handleProgressiveOverload}
            sx={{
              flex: 1,
              py: 1,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            <Stack alignItems="center" spacing={0.25}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Progression</Typography>
              <Typography variant="body2" fontWeight={600}>
                {(parseFloat(previousSets[0].weight || '0') + 2.5).toFixed(1)}kg × {previousSets[0].reps}
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
            color: 'text.disabled',
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

      {/* Morpho Tips (collapsible) */}
      {morphotype && (
        <Card
          sx={{
            mb: 2,
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onClick={() => setShowMorphoTips(!showMorphoTips)}
        >
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
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
                <Typography variant="caption" color="text.secondary">
                  💡 Conseils morpho
                </Typography>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={!weight || !reps || isSubmitting}
        sx={{
          py: 2,
          fontSize: '1rem',
          fontWeight: 700,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
          boxShadow: '0 4px 20px rgba(103, 80, 164, 0.4)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
          },
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&:disabled': {
            background: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        {isSubmitting ? 'Enregistrement...' : `Valider ${weight}kg × ${reps}`}
      </Button>
    </Box>
  );
}
