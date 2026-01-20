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
          // Play notification sound or vibrate
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, restTimer]);

  const startTimer = (duration?: number) => {
    setRestTimer(duration || timerDuration);
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

      {/* Rest Timer (sticky) */}
      {(isTimerRunning || restTimer > 0) && (
        <Paper
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: 'rgba(103,80,164,0.2)',
            borderBottom: 1,
            borderColor: 'primary.dark',
            position: 'sticky',
            top: 56,
            zIndex: 10,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={2}>
              <Timer sx={{ fontSize: 28, color: 'primary.main' }} />
              <Box>
                <Typography variant="caption" color="primary.light">Repos</Typography>
                <Typography variant="h5" fontWeight={700} fontFamily="monospace">{formatTime(restTimer)}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="contained"
                onClick={() => setRestTimer((prev) => prev + 30)}
                sx={{ bgcolor: 'primary.dark', minWidth: 48 }}
              >
                +30s
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={stopTimer}
              >
                Stop
              </Button>
            </Stack>
          </Stack>
        </Paper>
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
                              label={`${set.weight}kg × ${set.reps}`}
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
            onClose={() => setSelectedExercise(null)}
            onSetAdded={() => {
              loadSession();
              startTimer();
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

      {/* Quick Add FAB */}
      {!selectedExercise && !showExercisePicker && (
        <Fab
          color="primary"
          onClick={() => setShowExercisePicker(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
          }}
        >
          <Add />
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
  onSetAdded,
  onSetDeleted,
  onStartTimer,
}: {
  exercise: Exercise | undefined;
  sets: WorkoutSet[];
  sessionId: string;
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
          onCancel={() => setShowAddSet(false)}
          onAdd={() => {
            setShowAddSet(false);
            onSetAdded();
            onStartTimer();
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
  onCancel,
  onAdd,
}: {
  exerciseId: string;
  sessionId: string;
  setNumber: number;
  lastWeight?: number;
  lastReps?: number;
  onCancel: () => void;
  onAdd: () => void;
}) {
  const [weight, setWeight] = useState(lastWeight?.toString() || '');
  const [reps, setReps] = useState(lastReps?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!weight || !reps) return;
    setIsSubmitting(true);
    try {
      await addSet(sessionId, exerciseId, setNumber, parseInt(reps), parseFloat(weight));
      onAdd();
    } catch (error) {
      console.error('Error adding set:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: 1, borderColor: 'divider' }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Poids (kg)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          size="small"
          fullWidth
          autoFocus
          InputProps={{ inputProps: { style: { textAlign: 'center' } } }}
        />
        <TextField
          label="Reps"
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          size="small"
          fullWidth
          InputProps={{ inputProps: { style: { textAlign: 'center' } } }}
        />
      </Stack>
      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="outlined" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={!weight || !reps || isSubmitting}
          sx={{ background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)' }}
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

// Subcategory groupings (simplified primary muscles)
const SUBCATEGORY_GROUPS: Record<string, Record<string, string[]>> = {
  legs: {
    'Quadriceps': ['quadriceps_rectus_femoris', 'quadriceps_vastus_lateralis', 'quadriceps_vastus_medialis'],
    'Fessiers': ['gluteus_maximus'],
    'Ischios': ['hamstrings_biceps_femoris', 'hamstrings_semitendinosus'],
    'Mollets': ['calves_gastrocnemius', 'calves_soleus'],
    'Adducteurs': ['adductors', 'hip_flexors'],
  },
  arms: {
    'Biceps': ['biceps_long_head', 'biceps_short_head', 'brachialis', 'brachioradialis'],
    'Triceps': ['triceps_long_head', 'triceps_lateral_head', 'triceps_medial_head'],
    'Avant-bras': ['forearm_flexors', 'forearm_extensors'],
  },
  shoulders: {
    'Deltoïde ant.': ['anterior_delt'],
    'Deltoïde lat.': ['lateral_delt'],
    'Deltoïde post.': ['posterior_delt', 'infraspinatus'],
  },
  back: {
    'Grand dorsal': ['latissimus_dorsi', 'teres_major'],
    'Trapèzes': ['trapezius_mid', 'trapezius_upper', 'rhomboids'],
    'Lombaires': ['erector_spinae'],
  },
  chest: {
    'Pec. haut': ['pec_major_clavicular'],
    'Pec. milieu': ['pec_major_sternal'],
    'Pec. bas': ['pec_major_abdominal'],
  },
  core: {
    'Abdos': ['rectus_abdominis', 'transverse_abdominis'],
    'Obliques': ['obliques'],
  },
};

// Exercise Picker Modal
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

  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))];

  // Get subcategories for selected muscle group
  const subcategories = selectedMuscle ? SUBCATEGORY_GROUPS[selectedMuscle] || {} : {};

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

      // Subcategory filter
      let matchesSubcategory = true;
      if (selectedSubcategory && subcategories[selectedSubcategory]) {
        const targetMuscles = subcategories[selectedSubcategory];
        const exercisePrimaryMuscles = exercise.primaryMuscles || [];
        matchesSubcategory = exercisePrimaryMuscles.some(m => targetMuscles.includes(m));
      }

      return matchesSearch && matchesMuscle && matchesSubcategory;
    });

    if (sortByScore) {
      filtered = [...filtered].sort((a, b) => b.score - a.score);
    }

    return filtered;
  }, [exercisesWithScores, search, selectedMuscle, selectedSubcategory, subcategories, sortByScore]);

  const handleMuscleSelect = (muscle: string | null) => {
    setSelectedMuscle(muscle);
    setSelectedSubcategory(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
          <Typography variant="h6" fontWeight={600}>Choisir un exercice</Typography>
        </Stack>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          autoFocus
        />
      </Paper>

      {/* Muscle Filter */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5 }}>
          <Chip
            label="Tous"
            size="small"
            onClick={() => handleMuscleSelect(null)}
            color={!selectedMuscle ? 'primary' : 'default'}
            variant={!selectedMuscle ? 'filled' : 'outlined'}
          />
          {muscleGroups.map((muscle) => (
            <Chip
              key={muscle}
              label={MUSCLE_GROUP_LABELS[muscle] || muscle}
              size="small"
              onClick={() => handleMuscleSelect(muscle)}
              color={selectedMuscle === muscle ? 'primary' : 'default'}
              variant={selectedMuscle === muscle ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Box>

      {/* Subcategory Filter (when muscle selected) */}
      {selectedMuscle && Object.keys(subcategories).length > 0 && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={0.5} sx={{ overflowX: 'auto', flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label="Tous"
              size="small"
              onClick={() => setSelectedSubcategory(null)}
              color={!selectedSubcategory ? 'secondary' : 'default'}
              variant={!selectedSubcategory ? 'filled' : 'outlined'}
              sx={{ height: 24, fontSize: '0.7rem' }}
            />
            {Object.keys(subcategories).map((sub) => (
              <Chip
                key={sub}
                label={sub}
                size="small"
                onClick={() => setSelectedSubcategory(sub)}
                color={selectedSubcategory === sub ? 'secondary' : 'default'}
                variant={selectedSubcategory === sub ? 'filled' : 'outlined'}
                sx={{ height: 24, fontSize: '0.7rem' }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Sort Toggle */}
      {morphotype && (
        <Box sx={{ px: 2, py: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {filteredExercises.length} exercices
            </Typography>
            <Chip
              label={sortByScore ? '🧬 Trié morpho' : '🧬 Trier morpho'}
              size="small"
              onClick={() => setSortByScore(!sortByScore)}
              color={sortByScore ? 'secondary' : 'default'}
              variant={sortByScore ? 'filled' : 'outlined'}
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          </Stack>
        </Box>
      )}

      {/* Exercise List */}
      <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 2 }}>
        <List disablePadding>
          {filteredExercises.map(({ exercise, score }) => (
            <Card key={exercise.id} sx={{ mb: 1 }}>
              <ListItemButton onClick={() => onSelect(exercise)} sx={{ borderRadius: 1, py: 1 }}>
                <MorphoScoreBadge score={score} size="small" />
                <ListItemText
                  sx={{ ml: 1.5 }}
                  primary={exercise.nameFr}
                  secondary={
                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.25 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup] || exercise.muscleGroup}
                      </Typography>
                      {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
                        <Typography variant="caption" color="primary.main">
                          • {PRIMARY_MUSCLE_LABELS[exercise.primaryMuscles[0]] || exercise.primaryMuscles[0]}
                        </Typography>
                      )}
                    </Stack>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            </Card>
          ))}
        </List>
      </Box>
    </Box>
  );
}

// Set Input Bottom Sheet
function SetInputSheet({
  exercise,
  sessionId,
  setNumber,
  morphotype,
  onClose,
  onSetAdded,
}: {
  exercise: Exercise;
  sessionId: string;
  setNumber: number;
  morphotype: MorphotypeResult | null;
  onClose: () => void;
  onSetAdded: () => void;
}) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);
  const [showMorphoTips, setShowMorphoTips] = useState(false);

  useEffect(() => {
    getLastSetsForExercise(exercise.id).then((sets) => {
      setPreviousSets(sets);
      if (sets.length > 0) {
        setWeight(sets[0].weight || '');
        setReps(sets[0].reps?.toString() || '');
      }
    });
  }, [exercise.id]);

  const handleSubmit = async () => {
    if (!weight || !reps) return;
    setIsSubmitting(true);
    try {
      await addSet(
        sessionId,
        exercise.id,
        isWarmup ? 0 : setNumber,
        parseInt(reps),
        parseFloat(weight),
        rpe ? parseInt(rpe) : undefined,
        isWarmup
      );
      onSetAdded();
      onClose();
    } catch (error) {
      console.error('Error adding set:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxHeight: '90vh', overflow: 'auto' }}>
      {/* Handle */}
      <Box sx={{ width: 48, height: 4, bgcolor: 'action.hover', borderRadius: 2, mx: 'auto', mb: 3 }} />

      {/* Exercise Name */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>{exercise.nameFr}</Typography>
          <Typography variant="body2" color="text.secondary">
            {isWarmup ? 'Échauffement' : `Série ${setNumber}`}
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </Stack>

      {/* Morpho Tips Panel (collapsible) */}
      {morphotype && (
        <Card
          sx={{
            mb: 2,
            bgcolor: 'action.hover',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': { bgcolor: 'action.selected' },
          }}
          onClick={() => setShowMorphoTips(!showMorphoTips)}
        >
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <MorphoTipsPanel
              exerciseName={exercise.nameFr}
              muscleGroup={exercise.muscleGroup}
              morphotype={morphotype}
              morphoRecommendation={exercise.morphotypeRecommendations as MorphoRecommendation | null}
              expanded={showMorphoTips}
            />
            {!showMorphoTips && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, textAlign: 'center' }}>
                Appuyer pour voir les conseils
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Previous Performance */}
      {previousSets.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary">Dernière séance</Typography>
            <Typography variant="body1" fontWeight={500}>
              {previousSets[0].weight}kg × {previousSets[0].reps} reps
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Inputs */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          label="Poids (kg)"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          fullWidth
          InputProps={{ inputProps: { style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 } } }}
        />
        <TextField
          label="Reps"
          type="number"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          fullWidth
          InputProps={{ inputProps: { style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 } } }}
        />
        <TextField
          label="RPE"
          type="number"
          value={rpe}
          onChange={(e) => setRpe(e.target.value)}
          fullWidth
          InputProps={{ inputProps: { min: 1, max: 10, style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 } } }}
        />
      </Stack>

      {/* Warmup Toggle */}
      <FormControlLabel
        control={
          <Checkbox
            checked={isWarmup}
            onChange={(e) => setIsWarmup(e.target.checked)}
          />
        }
        label="C'est un échauffement"
        sx={{ mb: 3 }}
      />

      {/* Submit Button */}
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={handleSubmit}
        disabled={!weight || !reps || isSubmitting}
        sx={{
          py: 1.5,
          background: 'linear-gradient(135deg, #6750a4 0%, #9a67ea 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #7f67be 0%, #bb86fc 100%)',
          },
        }}
      >
        {isSubmitting ? 'Enregistrement...' : 'Valider la série'}
      </Button>
    </Box>
  );
}
