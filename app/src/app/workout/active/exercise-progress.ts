import type { TemplateExercise, WorkoutSet } from '../types';

type ExerciseProgress = { sets: WorkoutSet[]; workingSets: number };

// Both inputs are ordered by the session queries: plan order and time performed.
export function getExerciseProgress(plan: Pick<TemplateExercise, 'exerciseId' | 'targetSets'>[], sets: WorkoutSet[]) {
  const byExercise = new Map<string, ExerciseProgress>();
  for (const set of sets) {
    const group = byExercise.get(set.exerciseId) ?? { sets: [], workingSets: 0 };
    group.sets.push(set);
    if (!set.isWarmup) group.workingSets++;
    byExercise.set(set.exerciseId, group);
  }

  const latestId = sets.at(-1)?.exerciseId;
  if (latestId && !plan.some(exercise => exercise.exerciseId === latestId)) {
    return { byExercise, currentId: latestId };
  }

  const unfinished = plan.filter(exercise => (byExercise.get(exercise.exerciseId)?.workingSets ?? 0) < exercise.targetSets);
  const unfinishedIds = new Set(unfinished.map(exercise => exercise.exerciseId));
  const lastStarted = sets.findLast(set => unfinishedIds.has(set.exerciseId));
  return { byExercise, currentId: lastStarted?.exerciseId ?? unfinished[0]?.exerciseId ?? null };
}
