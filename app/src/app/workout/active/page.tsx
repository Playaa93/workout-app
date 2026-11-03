'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/powersync/auth-context';
import { useActiveSession, useSessionSets, useExercises, useTemplateExercises, useLastSetsForExerciseOrMachine, useExerciseNote, useMachineSetups } from '@/powersync/queries/workout-queries';
import { useMorphoProfile } from '@/powersync/queries/morphology-queries';
import { useUserSettings } from '@/powersync/queries/profile-queries';
import { useWorkoutMutations } from '@/powersync/mutations/workout-mutations';
import { parseJson, parseJsonArray } from '@/powersync/helpers';
import WorkoutOpening from '@/components/WorkoutOpening';
import type { MorphotypeResult } from '@/app/morphology/types';
import type { Exercise, WorkoutSet, ActiveSession, TemplateExercise, MachineSetup } from '../types';
import WorkoutEditor from './WorkoutEditor';
import { EditorContext, ExerciseData, type ScopeProps } from './editor-context';

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


function LocalExerciseData({ exerciseId, machineId, children }: ScopeProps) {
  const { data: history } = useLastSetsForExerciseOrMachine(exerciseId, machineId, 5);
  const { data: machines } = useMachineSetups(exerciseId);
  const { data: notes } = useExerciseNote(exerciseId);
  const previousSets = useMemo(() => history.map(toWorkoutSet), [history]);
  const setups = useMemo(() => machines.map(toMachineSetup), [machines]);
  return <ExerciseData.Provider value={{ previousSets, setups, note: notes[0]?.notes ?? '' }}>{children}</ExerciseData.Provider>;
}

function ActiveWorkoutContent({ sessionId, storageKey, sessionRows, setRows }: {
  sessionId: string | null;
  storageKey: string;
  sessionRows: ReturnType<typeof useActiveSession>['data'];
  setRows: ReturnType<typeof useSessionSets>['data'];
}) {
  const actions = useWorkoutMutations();
  const { data: settings, isLoading } = useUserSettings();
  // PowerSync reactive hooks
  const { data: exerciseRows, isLoading: exercisesLoading, error: exercisesError } = useExercises();
  const { data: morphoRows } = useMorphoProfile();

  // Get template_id from session for template exercises
  const templateId = sessionRows?.[0]?.template_id as string | null;
  const { data: templateExRows, isLoading: planLoading, error: planError } = useTemplateExercises(templateId);

  // Map exercises
  const exercises = useMemo<Exercise[]>(() => {
    return exerciseRows.map(e => ({
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
    return templateExRows.map(e => ({
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
    const p = morphoRows[0];
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

  const awaitingExercises = exercisesLoading || exercisesError || (!!templateId && (planLoading || planError));

  if (awaitingExercises || !session || !sessionId || !exercises.length) return <WorkoutOpening sessionId={sessionId} />;
  return <EditorContext.Provider value={{ actions, Scope: LocalExerciseData }}>
    <WorkoutEditor storageKey={storageKey} session={session} exercises={exercises} templateId={templateId}
      templateExercises={templateExercises} morphotype={morphotype} notificationsAllowed={!isLoading && settings[0]?.notifications_enabled !== 0} />
  </EditorContext.Provider>;
}

function SessionWorkout({ sessionId, storageKey }: { sessionId: string | null; storageKey: string }) {
  const { data: sessionRows, isLoading: sessionLoading, error: sessionError } = useActiveSession(sessionId);
  const { data: setRows, isLoading: setsLoading, error: setsError } = useSessionSets(sessionId);
  if (sessionLoading || setsLoading) return <WorkoutOpening sessionId={sessionId} />;
  if (sessionId && (!sessionRows.length || sessionError || setsError)) return <WorkoutOpening sessionId={sessionId} />;

  return <ActiveWorkoutContent storageKey={storageKey} sessionId={sessionId} sessionRows={sessionRows} setRows={setRows} />;
}

function ActiveWorkoutRoute() {
  const { userId, loading } = useAuth();
  const sessionId = useSearchParams().get('id');
  if (loading || !userId || !sessionId) return <WorkoutOpening sessionId={sessionId} />;

  const storageKey = `workout.rest.v1.${userId}.${sessionId}`;
  return <SessionWorkout key={storageKey} storageKey={storageKey} sessionId={sessionId} />;
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<WorkoutOpening />}>
      <ActiveWorkoutRoute />
    </Suspense>
  );
}
