import { describe, expect, it } from 'vitest';
import { getExerciseProgress } from '@/app/workout/active/exercise-progress';
import type { WorkoutSet } from '@/app/workout/types';

const plan = ['L-Fly', 'Face pull', 'Pull over', 'Tirage'].map(exerciseId => ({ exerciseId, targetSets: 3 }));
function set(exerciseId: string, isWarmup = false): WorkoutSet {
  return { exerciseId, isWarmup, id: 'set', exerciseName: exerciseId, setNumber: 1, reps: 10, weight: '20',
    rpe: null, isPr: false, restTaken: null, notes: null, machineSetupId: null };
}
const done = (name: string) => Array.from({ length: 3 }, () => set(name));

describe('current exercise', () => {
  it('follows the plan on opening, on completing a target and after the final exercise', () => {
    expect(getExerciseProgress(plan, []).currentId).toBe('L-Fly');
    const firstTwo = [...done('L-Fly'), ...done('Face pull')];
    const progress = getExerciseProgress(plan, [...firstTwo, set('Pull over')]);
    expect(progress.currentId).toBe('Pull over');
    expect(progress.byExercise.get('Pull over')?.workingSets).toBe(1);
    expect(getExerciseProgress(plan, [...firstTwo, ...done('Pull over')]).currentId).toBe('Tirage');
    expect(getExerciseProgress(plan, plan.flatMap(ex => done(ex.exerciseId))).currentId).toBeNull();
  });

  it('follows out-of-order sets, including warmups, without counting a warmup toward the target', () => {
    const sets = [set('Face pull'), set('Tirage', true)];
    const progress = getExerciseProgress(plan, sets);
    expect(progress.currentId).toBe('Tirage');
    expect(progress.byExercise.get('Tirage')?.workingSets).toBe(0);
    expect(getExerciseProgress(plan, [...sets, ...done('Tirage')]).currentId).toBe('Face pull');
    expect(getExerciseProgress(plan, sets.slice(0, -1)).currentId).toBe('Face pull');
  });

  it('tracks the last logged free exercise and can resume a planned exercise', () => {
    expect(getExerciseProgress([], []).currentId).toBeNull();
    expect(getExerciseProgress([], [set('A'), set('B'), set('A')]).currentId).toBe('A');
    expect(getExerciseProgress(plan, [set('Face pull'), set('Libre')]).currentId).toBe('Libre');
    expect(getExerciseProgress(plan, [set('Libre'), set('Face pull')]).currentId).toBe('Face pull');
  });
});
