'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getActiveSession,
  getExercises,
  addSet,
  deleteSet,
  endWorkoutSession,
  getLastSetsForExercise,
  type Exercise,
  type WorkoutSet,
  type ActiveSession,
} from '../actions';

function ActiveWorkoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // Timer state
  const [restTimer, setRestTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(90);

  // Elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    const data = await getActiveSession(sessionId);
    setSession(data);
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    async function init() {
      const [exerciseData] = await Promise.all([getExercises(), loadSession()]);
      setExercises(exerciseData);
    }
    init();
  }, [loadSession]);

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

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-400">Session invalide</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
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
    <main className="min-h-screen flex flex-col pb-32">
      {/* Header with timer */}
      <header className="px-4 py-3 border-b border-neutral-800 sticky top-0 bg-black/95 backdrop-blur-sm z-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold">Séance en cours</h1>
            <p className="text-sm text-neutral-400">{formatTime(elapsedSeconds)}</p>
          </div>
          <button
            onClick={() => setShowEndConfirm(true)}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors"
          >
            Terminer
          </button>
        </div>
      </header>

      {/* Rest Timer (sticky) */}
      {(isTimerRunning || restTimer > 0) && (
        <div className="px-4 py-3 bg-violet-900/30 border-b border-violet-800 sticky top-[60px] z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <p className="text-sm text-violet-300">Repos</p>
                <p className="text-2xl font-bold font-mono">{formatTime(restTimer)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRestTimer((prev) => prev + 30)}
                className="px-3 py-1 bg-violet-600/50 rounded-lg text-sm"
              >
                +30s
              </button>
              <button
                onClick={stopTimer}
                className="px-3 py-1 bg-neutral-700 rounded-lg text-sm"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Sets */}
      <div className="flex-1 p-4 space-y-4">
        {Array.from(setsByExercise.entries()).map(([exerciseId, sets]) => {
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
        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full py-4 border-2 border-dashed border-neutral-700 rounded-xl text-neutral-400 hover:border-neutral-600 hover:text-neutral-300 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-xl">+</span>
          Ajouter un exercice
        </button>
      </div>

      {/* Selected Exercise Input (bottom sheet) */}
      {selectedExercise && (
        <SetInputSheet
          exercise={selectedExercise}
          sessionId={sessionId}
          setNumber={(setsByExercise.get(selectedExercise.id)?.length || 0) + 1}
          onClose={() => setSelectedExercise(null)}
          onSetAdded={() => {
            loadSession();
            startTimer();
          }}
        />
      )}

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <ExercisePicker
          exercises={exercises}
          onSelect={handleSelectExercise}
          onClose={() => setShowExercisePicker(false)}
        />
      )}

      {/* End Workout Confirmation */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Terminer la séance ?</h3>
            <p className="text-neutral-400 text-sm mb-6">
              Tu as fait {session?.sets.filter(s => !s.isWarmup).length || 0} séries.
              Tu peux toujours reprendre plus tard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 py-3 bg-neutral-800 rounded-xl font-medium hover:bg-neutral-700 transition-colors"
              >
                Continuer
              </button>
              <button
                onClick={handleEndWorkout}
                className="flex-1 py-3 bg-violet-600 rounded-xl font-medium hover:bg-violet-500 transition-colors"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add FAB */}
      {!selectedExercise && !showExercisePicker && (
        <button
          onClick={() => setShowExercisePicker(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-violet-500 transition-colors"
        >
          +
        </button>
      )}
    </main>
  );
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
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
    <div className="bg-neutral-900 rounded-xl overflow-hidden">
      {/* Exercise Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{exercise.nameFr}</h3>
            <p className="text-sm text-neutral-400 capitalize">{exercise.muscleGroup}</p>
          </div>
          {previousSets.length > 0 && (
            <div className="text-right text-sm">
              <p className="text-neutral-500">Dernière fois</p>
              <p className="text-neutral-300">
                {previousSets[0].weight}kg × {previousSets[0].reps}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sets List */}
      <div className="divide-y divide-neutral-800">
        {sets.map((set) => (
          <div
            key={set.id}
            className={`px-4 py-3 flex items-center justify-between ${
              set.isWarmup ? 'bg-neutral-800/50' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-sm font-medium">
                {set.isWarmup ? 'W' : set.setNumber}
              </span>
              <div>
                <span className="font-medium">{set.weight}kg</span>
                <span className="text-neutral-400 mx-2">×</span>
                <span className="font-medium">{set.reps}</span>
                {set.rpe && <span className="text-neutral-500 ml-2">RPE {set.rpe}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {set.isPr && <span className="text-amber-400 text-sm">🏆 PR!</span>}
              <button
                onClick={async () => {
                  await deleteSet(set.id);
                  onSetDeleted();
                }}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Set Button */}
      {!showAddSet ? (
        <button
          onClick={() => setShowAddSet(true)}
          className="w-full py-3 text-violet-400 hover:bg-neutral-800/50 transition-colors text-sm font-medium"
        >
          + Ajouter une série
        </button>
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
    </div>
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
    <div className="p-4 bg-neutral-800/50 border-t border-neutral-700">
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label className="text-xs text-neutral-500 mb-1 block">Poids (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-center font-medium"
            placeholder="0"
            autoFocus
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-neutral-500 mb-1 block">Reps</label>
          <input
            type="number"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 rounded-lg text-center font-medium"
            placeholder="0"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-600 transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          disabled={!weight || !reps || isSubmitting}
          className="flex-1 py-2 bg-violet-600 rounded-lg text-sm font-medium hover:bg-violet-500 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? '...' : 'Valider'}
        </button>
      </div>
    </div>
  );
}

// Exercise Picker Modal
function ExercisePicker({
  exercises,
  onSelect,
  onClose,
}: {
  exercises: Exercise[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const muscleGroups = [...new Set(exercises.map((e) => e.muscleGroup))];

  const filteredExercises = exercises.filter((e) => {
    const matchesSearch = e.nameFr.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !selectedMuscle || e.muscleGroup === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-neutral-800 flex items-center gap-4">
        <button onClick={onClose} className="text-neutral-400 hover:text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold">Choisir un exercice</h2>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="w-full px-4 py-3 bg-neutral-900 rounded-xl"
          autoFocus
        />
      </div>

      {/* Muscle Filter */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedMuscle(null)}
          className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
            !selectedMuscle
              ? 'bg-violet-600 text-white'
              : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
          }`}
        >
          Tous
        </button>
        {muscleGroups.map((muscle) => (
          <button
            key={muscle}
            onClick={() => setSelectedMuscle(muscle)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap capitalize transition-colors ${
              selectedMuscle === muscle
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            }`}
          >
            {muscle}
          </button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-2">
          {filteredExercises.map((exercise) => (
            <button
              key={exercise.id}
              onClick={() => onSelect(exercise)}
              className="w-full p-4 bg-neutral-900 rounded-xl text-left hover:bg-neutral-800 transition-colors"
            >
              <p className="font-medium">{exercise.nameFr}</p>
              <p className="text-sm text-neutral-400 capitalize">{exercise.muscleGroup}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Set Input Bottom Sheet
function SetInputSheet({
  exercise,
  sessionId,
  setNumber,
  onClose,
  onSetAdded,
}: {
  exercise: Exercise;
  sessionId: string;
  setNumber: number;
  onClose: () => void;
  onSetAdded: () => void;
}) {
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [isWarmup, setIsWarmup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousSets, setPreviousSets] = useState<WorkoutSet[]>([]);

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
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
      <div className="w-full bg-neutral-900 rounded-t-3xl p-6 pb-8 animate-slide-up">
        {/* Handle */}
        <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-6" />

        {/* Exercise Name */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold">{exercise.nameFr}</h3>
            <p className="text-sm text-neutral-400">
              {isWarmup ? 'Échauffement' : `Série ${setNumber}`}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Previous Performance */}
        {previousSets.length > 0 && (
          <div className="mb-4 p-3 bg-neutral-800 rounded-xl">
            <p className="text-xs text-neutral-500 mb-1">Dernière séance</p>
            <p className="font-medium">
              {previousSets[0].weight}kg × {previousSets[0].reps} reps
            </p>
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">Poids (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl text-center text-xl font-bold"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">Reps</label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl text-center text-xl font-bold"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-neutral-500 mb-2 block">RPE</label>
            <input
              type="number"
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              min="1"
              max="10"
              className="w-full px-4 py-3 bg-neutral-800 rounded-xl text-center text-xl font-bold"
              placeholder="-"
            />
          </div>
        </div>

        {/* Warmup Toggle */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={isWarmup}
            onChange={(e) => setIsWarmup(e.target.checked)}
            className="w-5 h-5 rounded bg-neutral-800 border-neutral-700"
          />
          <span className="text-neutral-300">C'est un échauffement</span>
        </label>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!weight || !reps || isSubmitting}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl font-semibold transition-colors"
        >
          {isSubmitting ? 'Enregistrement...' : 'Valider la série'}
        </button>
      </div>
    </div>
  );
}
