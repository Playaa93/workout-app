'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import { useBackHandler } from '@/hooks/useBackHandler';
import { useRouter, useSearchParams } from 'next/navigation';
import type {
  Exercise,
  WorkoutSet,
  ActiveSession,
  TemplateExercise,
  MachineSetup,
} from '../types';
import { useAuth } from '@/powersync/auth-context';
import {
  useActiveSession,
  useSessionSets,
  useExercises,
  useTemplateExercises,
  useLastSetsForExerciseOrMachine,
  useExerciseNote,
  useMachineSetups,
} from '@/powersync/queries/workout-queries';
import { useMorphoProfile } from '@/powersync/queries/morphology-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJson, parseJsonArray } from '@/powersync/helpers';
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
  SpeakerHigh,
  SpeakerSlash,
  DeviceMobile,
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
import { useSetRestTimer } from '@/hooks/useSetRestTimer';
import { useThemeTokens } from '@/hooks/useDark';
import { alpha } from '@mui/material/styles';
import { GOLD, GOLD_CONTRAST, W, tc, card, surfaceBg, panelBg, goldBtnSx, goldOutlinedBtnSx, dialogPaperSx } from '@/lib/design-tokens';
import FullScreenLoader from '@/components/FullScreenLoader';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWorkoutSet(s: any): WorkoutSet {
  return {
    id: s.id,
    exerciseId: s.exercise_id,
    exerciseName: s.exercise_name || '',
    setNumber: s.set_number || 0,
    reps: s.reps,
    weight: s.weight,
    rpe: s.rpe,
    isWarmup: !!s.is_warmup,
    isPr: !!s.is_pr,
    restTaken: s.rest_taken,
    notes: s.notes || null,
    machineSetupId: s.machine_setup_id || null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMachineSetup(r: any): MachineSetup {
  return {
    id: r.id,
    exerciseId: r.exercise_id ?? '',
    machineLabel: r.machine_label ?? '',
    photoBase64: r.photo_base64 ?? null,
    settings: parseJsonArray(r.settings),
    isDefault: !!r.is_default,
    notes: r.notes ?? null,
  };
}

function formatRestTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();

  // PowerSync reactive hooks
  const { data: sessionRows, isLoading: sessionLoading } = useActiveSession(sessionId);
  const { data: setRows, isLoading: setsLoading } = useSessionSets(sessionId);
  const { data: exerciseRows, isLoading: exercisesLoading } = useExercises();
  const { data: morphoRows } = useMorphoProfile();

  // Get template_id from session for template exercises
  const templateId = sessionRows?.[0]?.template_id as string | null;
  const { data: templateExRows } = useTemplateExercises(templateId);

  // Map exercises
  const exercises = useMemo<Exercise[]>(() => {
    return exerciseRows.map((e: any) => ({
      id: e.id,
      nameFr: e.name_fr || '',
      nameEn: e.name_en,
      muscleGroup: e.muscle_group || '',
      primaryMuscles: parseJsonArray(e.primary_muscles as string | null),
      secondaryMuscles: parseJsonArray(e.secondary_muscles as string | null),
      equipment: parseJsonArray(e.equipment as string | null),
      difficulty: e.difficulty,
      morphotypeRecommendations: parseJson(e.morphotype_recommendations as string | null),
    }));
  }, [exerciseRows]);

  // Build exercise map
  const exerciseMap = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const e of exercises) map.set(e.id, e);
    return map;
  }, [exercises]);

  // Map sets
  const sets = useMemo<WorkoutSet[]>(() => {
    return setRows.map(toWorkoutSet);
  }, [setRows]);

  // Map session (ActiveSession)
  const session = useMemo<ActiveSession | null>(() => {
    const s = sessionRows?.[0];
    if (!s) return null;
    return {
      session: {
        id: s.id,
        startedAt: new Date(s.started_at as string),
        endedAt: s.ended_at ? new Date(s.ended_at as string) : null,
        durationMinutes: s.duration_minutes,
        totalVolume: s.total_volume,
        caloriesBurned: s.calories_burned,
        notes: s.notes,
        sessionType: s.session_type as 'strength' | 'cardio' | null,
        cardioActivity: s.cardio_activity,
        distanceMeters: s.distance_meters,
        avgPaceSecondsPerKm: s.avg_pace_seconds_per_km,
        avgSpeedKmh: s.avg_speed_kmh,
      },
      sets,
      exercises: exerciseMap,
    };
  }, [sessionRows, sets, exerciseMap]);

  // Map template exercises
  const templateExercises = useMemo<TemplateExercise[]>(() => {
    return templateExRows.map((e: any) => ({
      exerciseId: e.exercise_id || '',
      exerciseName: e.exercise_name || '',
      orderIndex: e.order_index || 0,
      targetSets: e.target_sets || 0,
      targetReps: (e.target_reps as string) || '',
      restSeconds: e.rest_seconds || 0,
      notes: e.notes,
    }));
  }, [templateExRows]);

  // Map morphotype
  const morphotype = useMemo<MorphotypeResult | null>(() => {
    if (morphoRows.length === 0) return null;
    const p = morphoRows[0] as any;
    const scores = parseJson<Record<string, unknown>>(p.morphotype_score);
    if (!scores) return null;
    return {
      globalType: (scores.globalType as 'longiligne' | 'breviligne' | 'balanced') || 'balanced',
      structure: (scores.structure as MorphotypeResult['structure']) || {
        frameSize: 'medium', shoulderToHip: 'medium', ribcageDepth: 'medium',
      },
      proportions: (scores.proportions as MorphotypeResult['proportions']) || {
        torsoLength: p.torso_proportion || 'medium',
        armLength: p.arm_proportion || 'medium',
        femurLength: p.leg_proportion || 'medium',
        kneeValgus: 'none',
      },
      mobility: (scores.mobility as MorphotypeResult['mobility']) || {
        ankleDorsiflexion: 'average', posteriorChain: 'average', wristMobility: 'none',
      },
      insertions: (scores.insertions as MorphotypeResult['insertions']) || {
        biceps: 'medium', calves: 'medium', chest: 'medium',
      },
      metabolism: (scores.metabolism as MorphotypeResult['metabolism']) || {
        weightTendency: 'balanced', naturalStrength: 'average', bestResponders: 'none',
      },
      squat: { exercise: 'Squat', advantages: [], disadvantages: [], variants: [], tips: [] },
      deadlift: { exercise: 'Deadlift', advantages: [], disadvantages: [], variants: [], tips: [] },
      bench: { exercise: 'Bench', advantages: [], disadvantages: [], variants: [], tips: [] },
      curls: { exercise: 'Curls', advantages: [], disadvantages: [], variants: [], tips: [] },
      mobilityWork: [],
      primary: p.primary_morphotype,
      secondary: p.secondary_morphotype,
      scores: {
        ecto: (scores.ecto as number) || 0,
        meso: (scores.meso as number) || 0,
        endo: (scores.endo as number) || 0,
      },
      strengths: parseJsonArray(p.strengths),
      weaknesses: parseJsonArray(p.weaknesses),
      recommendedExercises: parseJsonArray(p.recommended_exercises),
      exercisesToAvoid: parseJsonArray(p.exercises_to_avoid),
    } as MorphotypeResult;
  }, [morphoRows]);

  const isLoading = sessionLoading || setsLoading || exercisesLoading;

  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Rest timer with set tracking (persists rest_taken on adjust)
  const timer = useSetRestTimer();

  // Elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Exercise info modal
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  // Auto-scroll to latest exercise
  const lastExerciseRef = useRef<HTMLDivElement>(null);
  const prevSetCount = useRef(0);

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
      // Close dialog BEFORE navigating so useBackHandler cleanup doesn't
      // call history.back() on unmount and cancel the router.push
      setShowEndConfirm(false);
      await new Promise(r => setTimeout(r, 50));
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

  // Auto-scroll to last exercise when sets change
  const currentSetCount = session?.sets.length || 0;
  useEffect(() => {
    if (currentSetCount > prevSetCount.current && prevSetCount.current > 0) {
      setTimeout(() => {
        lastExerciseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
    prevSetCount.current = currentSetCount;
  }, [currentSetCount]);

  if (!sessionId) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: surfaceBg(t) }}>
        <Typography sx={{ color: tc.m(t) }}>Session invalide</Typography>
      </Box>
    );
  }

  if (isLoading) {
    return <FullScreenLoader />;
  }

  const formatTime = formatRestTime;

  // Group sets by exercise
  const setsByExercise = new Map<string, WorkoutSet[]>();
  session?.sets.forEach((set) => {
    const group = setsByExercise.get(set.exerciseId);
    if (group) group.push(set);
    else setsByExercise.set(set.exerciseId, [set]);
  });

  // Get last rest time used (from most recent set)
  const lastRestTime = session?.sets.length
    ? session.sets[session.sets.length - 1].restTaken ?? 90
    : 90;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', pb: 16, bgcolor: surfaceBg(t) }}>
      {/* Header with timer */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08),
          borderRadius: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: panelBg(t),
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: tc.h(t) }}>Séance en cours</Typography>
            <Typography variant="body2" sx={{ color: tc.m(t) }}>{formatTime(elapsedSeconds)}</Typography>
          </Box>
          <Button
            size="small"
            onClick={() => setShowEndConfirm(true)}
            sx={{ bgcolor: 'rgba(244,67,54,0.2)', color: 'error.light', borderRadius: '14px', '&:hover': { bgcolor: 'rgba(244,67,54,0.3)' } }}
          >
            Terminer
          </Button>
        </Stack>
      </Box>

      {/* Rest Timer (sticky) - Apple-style minimal */}
      {(timer.isRunning || timer.remaining > 0) && (
        <Box
          sx={{
            position: 'sticky',
            top: 56,
            zIndex: 10,
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

          {/* Controls */}
          <Stack direction="row" justifyContent="center" alignItems="center" spacing={3} sx={{ mt: 1 }}>
            <Typography
              onClick={() => timer.adjustForSet(-30)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: tc.m(t),
                opacity: 0.6,
                '&:active': { opacity: 1 },
              }}
            >
              −30
            </Typography>

            <Typography
              onClick={() => timer.adjustForSet(30)}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: tc.m(t),
                opacity: 0.6,
                '&:active': { opacity: 1 },
              }}
            >
              +30
            </Typography>

            <Typography
              onClick={() => timer.stopForSet()}
              sx={{
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: tc.f(t),
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
                timer.setSound(!timer.sound);
              }}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: timer.sound ? tc.m(t) : tc.f(t),
                opacity: timer.sound ? 0.7 : 0.3,
                transition: 'all 0.2s ease',
                '&:active': { opacity: 1 },
              }}
            >
              {timer.sound ? <SpeakerHigh size={20} weight={W} /> : <SpeakerSlash size={20} weight={W} />}
            </Box>
            <Box
              onClick={() => {
                triggerHaptic('light');
                timer.setVibration(!timer.vibration);
              }}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: timer.vibration ? tc.m(t) : tc.f(t),
                opacity: timer.vibration ? 0.7 : 0.3,
                transition: 'all 0.2s ease',
                '&:active': { opacity: 1 },
              }}
            >
              <DeviceMobile size={20} weight={W} />
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
                  <Box
                    key={templateEx.exerciseId}
                    sx={card(d, {
                      p: 2,
                      border: isComplete ? '2px solid' : '1px solid',
                      borderColor: isComplete ? 'success.main' : (d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08)),
                      opacity: isComplete ? 0.7 : 1,
                    })}
                  >
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={index + 1}
                              size="small"
                              sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: isComplete ? 'success.main' : GOLD, color: isComplete ? '#fff' : GOLD_CONTRAST }}
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
                        <Stack direction="row" spacing={0.5}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenSwap(templateEx.exerciseId)}
                            sx={{ border: '1px solid', borderColor: d ? alpha('#ffffff', 0.1) : alpha('#000000', 0.08) }}
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
                            disabled={!exercise}
                            sx={isComplete
                              ? { ...goldOutlinedBtnSx }
                              : { ...goldBtnSx }
                            }
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
            const freeExercises = Array.from(setsByExercise.entries())
              .filter(([exerciseId]) => !templateExercises.some(t => t.exerciseId === exerciseId));
            return freeExercises.map(([exerciseId, sets], index) => {
              const exercise = session?.exercises.get(exerciseId);
              const isLast = index === freeExercises.length - 1;
              return (
                <div key={exerciseId} ref={isLast ? lastExerciseRef : undefined}>
                  <ExerciseCard
                    exercise={exercise}
                    sets={sets}
                    sessionId={sessionId}
                    defaultRestTime={lastRestTime}
                    isLastExercise={isLast}
                    onStartTimer={timer.startForSet}
                    onShowInfo={setInfoExercise}
                  />
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
          <SetInputSheet
            exercise={selectedExercise}
            sessionId={sessionId}
            setNumber={(setsByExercise.get(selectedExercise.id)?.length || 0) + 1}
            morphotype={morphotype}
            defaultRestTime={lastRestTime}
            onClose={() => setSelectedExercise(null)}
            onSetAdded={(setId, restDuration) => {
              timer.startForSet(setId, restDuration);
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
              Remplacer l'exercice
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

export default function ActiveWorkoutPage() {
  const { userId, loading: authLoading } = useAuth();
  if (authLoading || !userId) {
    return <FullScreenLoader />;
  }
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <ActiveWorkoutContent />
    </Suspense>
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
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();
  const { data: setupRows } = useMachineSetups(exerciseId);
  const [editingSetup, setEditingSetup] = useState<MachineSetup | null>(null);

  const setups = useMemo<MachineSetup[]>(() => {
    return setupRows.map(toMachineSetup);
  }, [setupRows]);

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
  isLastExercise = false,
  onStartTimer,
  onShowInfo,
}: {
  exercise: Exercise | undefined;
  sets: WorkoutSet[];
  sessionId: string;
  defaultRestTime?: number;
  isLastExercise?: boolean;
  onStartTimer: (setId: string, duration: number) => void;
  onShowInfo: (exercise: Exercise) => void;
}) {
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();
  const [showAddSet, setShowAddSet] = useState(false);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(!isLastExercise && sets.length > 0);
  const [selectedMachineSetupId, setSelectedMachineSetupId] = useState<string | null>(null);
  const [machineSheetOpen, setMachineSheetOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [forceEditNote, setForceEditNote] = useState(false);
  const [confirmDeleteLast, setConfirmDeleteLast] = useState(false);

  useBackHandler(confirmDeleteLast, () => setConfirmDeleteLast(false), 'confirm-delete-last');
  useBackHandler(machineSheetOpen, () => setMachineSheetOpen(false), 'machine-sheet');

  const { data: prevSetRows } = useLastSetsForExerciseOrMachine(exercise?.id || '', selectedMachineSetupId, 5);
  const previousSets = useMemo<WorkoutSet[]>(() => {
    return prevSetRows.map(toWorkoutSet);
  }, [prevSetRows]);

  // Auto-collapse when this exercise is no longer the last one
  useEffect(() => {
    if (!isLastExercise) setCollapsed(true);
    if (isLastExercise) setCollapsed(false);
  }, [isLastExercise]);

  const handleSelectSetup = useCallback((setup: MachineSetup | null) => {
    setSelectedMachineSetupId(setup?.id ?? null);
  }, []);

  if (!exercise) return null;

  const workingSets = sets.filter((s) => !s.isWarmup);
  const lastSet = workingSets[workingSets.length - 1];

  const totalVolume = workingSets.reduce((sum, s) => sum + (s.reps || 0) * parseFloat(s.weight || '0'), 0);

  return (
    <Box sx={card(t)}>
      {/* Exercise Header — tap to collapse/expand */}
      <Box
        sx={{ p: 2, pb: collapsed ? 2 : 0, cursor: 'pointer' }}
        onClick={() => { triggerHaptic('light'); setCollapsed(!collapsed); }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box sx={{ flex: 1 }}>
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
  const mutations = useWorkoutMutations();
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
  const mutations = useWorkoutMutations();
  const [restTime, setRestTime] = useState(defaultRestTime);

  return (
    <Box sx={{ py: 2, px: 3 }}>
      <SetForm
        initialWeight={lastWeight || 0}
        initialReps={lastReps || 0}
        submitLabel="Valider"
        onSubmit={async (reps, weight, notes) => {
          const { id } = await mutations.addSet(sessionId, exerciseId, setNumber, reps, weight, undefined, false, restTime, machineSetupId || undefined);
          if (notes) await mutations.updateSetNotes(id, notes);
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
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();
  const { data: noteRows } = useExerciseNote(exerciseId);
  const currentNote = noteRows?.[0]?.notes || '';
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
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();
  const [notes, setNotes] = useState(initialNotes);
  const [expanded, setExpanded] = useState(!!initialNotes);
  const stateRef = useRef({ notes, initialNotes, sessionId, mutations });
  stateRef.current = { notes, initialNotes, sessionId, mutations };

  // Sync from external changes (e.g. PowerSync remote sync)
  useEffect(() => { setNotes(initialNotes); }, [initialNotes]);

  // Safe: PowerSync mutations are synchronous local writes
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
  const mutations = useWorkoutMutations();
  const { t, d } = useThemeTokens();
  const { data: prevSetRows } = useLastSetsForExerciseOrMachine(exercise.id, machineSetupId || null, 5);

  const previousSets = useMemo<WorkoutSet[]>(() => {
    return prevSetRows.map(toWorkoutSet);
  }, [prevSetRows]);

  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rpe, setRpe] = useState(0);
  const [restTime, setRestTime] = useState(defaultRestTime);
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
        machineSetupId || undefined
      );
      if (notes.trim()) await mutations.updateSetNotes(id, notes.trim());
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
