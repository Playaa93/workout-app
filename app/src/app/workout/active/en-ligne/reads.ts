'use server';

import { and, desc, eq, isNull, or, sql } from 'drizzle-orm';
import { db, exercises, workoutSessions, workoutSets, workoutTemplates, workoutTemplateExercises, userSettings, userMachineSetups, userExerciseNotes, xpTransactions } from '@/db';
import { requireUserId } from '@/lib/auth';
import { getUserMorphotype } from '@/lib/morphotype-utils';
import { parseJsonArray } from '@/powersync/helpers';
import type { MachineSettingEntry } from '../../types';

const setFields = {
  id: workoutSets.id, exerciseId: sql<string>`coalesce(${workoutSets.exerciseId}::text, '')`,
  exerciseName: sql<string>`coalesce(${exercises.nameFr}, 'Exercice')`, setNumber: workoutSets.setNumber,
  reps: workoutSets.reps, weight: workoutSets.weight, rpe: workoutSets.rpe, performedAt: workoutSets.performedAt, isWarmup: workoutSets.isWarmup,
  isPr: workoutSets.isPr, restTaken: workoutSets.restTaken, notes: workoutSets.notes, machineSetupId: workoutSets.machineSetupId,
};

export async function getEditorSession(id: string) {
  const userId = await requireUserId();
  const [session] = await db.select().from(workoutSessions).where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId),
    sql`${workoutSessions.sessionType} IS DISTINCT FROM 'cardio'`));
  if (!session) return null;
  const [sets, plan] = await Promise.all([
    db.select(setFields).from(workoutSets).leftJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
      .where(eq(workoutSets.sessionId, id)).orderBy(workoutSets.performedAt, workoutSets.id),
    session.templateId ? db.select({ exerciseId: exercises.id, exerciseName: exercises.nameFr, orderIndex: workoutTemplateExercises.orderIndex,
      targetSets: workoutTemplateExercises.targetSets, targetReps: workoutTemplateExercises.targetReps,
      restSeconds: workoutTemplateExercises.restSeconds, notes: workoutTemplateExercises.notes })
      .from(workoutTemplateExercises).innerJoin(workoutTemplates, eq(workoutTemplates.id, workoutTemplateExercises.templateId))
      .innerJoin(exercises, eq(exercises.id, workoutTemplateExercises.exerciseId))
      .where(and(eq(workoutTemplates.id, session.templateId), eq(workoutTemplates.userId, userId))).orderBy(workoutTemplateExercises.orderIndex) : [],
  ]);
  return { session: { ...session, startedAt: session.startedAt! }, sets,
    plan: plan.map(ex => ({ ...ex, targetSets: ex.targetSets ?? 0, targetReps: ex.targetReps ?? '', restSeconds: ex.restSeconds ?? 90 })) };
}

export async function getEditorPreferences() {
  const userId = await requireUserId();
  const [catalog, settings, morphotype] = await Promise.all([
    db.select({ id: exercises.id, nameFr: exercises.nameFr, nameEn: exercises.nameEn, muscleGroup: exercises.muscleGroup,
      primaryMuscles: exercises.primaryMuscles, secondaryMuscles: exercises.secondaryMuscles, equipment: exercises.equipment,
      difficulty: exercises.difficulty, morphotypeRecommendations: exercises.morphotypeRecommendations }).from(exercises)
      .where(or(isNull(exercises.createdBy), eq(exercises.createdBy, userId))).orderBy(exercises.muscleGroup, exercises.nameFr),
    db.select({ alerts: userSettings.notificationsEnabled }).from(userSettings).where(eq(userSettings.userId, userId)).limit(1),
    getUserMorphotype(),
  ]);
  return { catalog, morphotype, notificationsAllowed: settings[0]?.alerts ?? true };
}

export async function getExerciseDetails(exerciseId: string, machineId: string | null) {
  const userId = await requireUserId();
  const [previousSets, machines, notes] = await Promise.all([
    db.select(setFields).from(workoutSets).innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
      .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId)).where(and(eq(workoutSessions.userId, userId),
        eq(workoutSets.exerciseId, exerciseId), eq(workoutSets.isWarmup, false), machineId ? eq(workoutSets.machineSetupId, machineId) : undefined))
      .orderBy(desc(workoutSets.performedAt), desc(workoutSets.id)).limit(5),
    db.select().from(userMachineSetups).where(and(eq(userMachineSetups.userId, userId), eq(userMachineSetups.exerciseId, exerciseId)))
      .orderBy(desc(userMachineSetups.isDefault), desc(userMachineSetups.updatedAt)),
    db.select({ note: userExerciseNotes.notes }).from(userExerciseNotes).where(and(eq(userExerciseNotes.userId, userId), eq(userExerciseNotes.exerciseId, exerciseId))),
  ]);
  return { previousSets, setups: machines.map(m => ({ ...m, isDefault: !!m.isDefault, settings: parseJsonArray<MachineSettingEntry>(m.settings) })), note: notes[0]?.note ?? '' };
}


export async function getFinishedWorkoutInfo(id: string) {
  const userId = await requireUserId();
  const [title, xp, catalog] = await Promise.all([
    db.select({ name: workoutTemplates.name }).from(workoutSessions).innerJoin(workoutTemplates, eq(workoutSessions.templateId, workoutTemplates.id))
      .where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId), eq(workoutTemplates.userId, userId))),
    db.select({ amount: xpTransactions.amount }).from(xpTransactions).where(and(eq(xpTransactions.referenceId, id),
      eq(xpTransactions.userId, userId), eq(xpTransactions.reason, 'workout_completed'))),
    db.selectDistinct({ id: exercises.id, nameFr: exercises.nameFr, muscleGroup: exercises.muscleGroup, primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles }).from(workoutSets).innerJoin(workoutSessions, eq(workoutSessions.id, workoutSets.sessionId))
      .innerJoin(exercises, eq(exercises.id, workoutSets.exerciseId)).where(and(eq(workoutSessions.id, id), eq(workoutSessions.userId, userId))),
  ]);
  return { title: title[0]?.name ?? 'Séance', xp: xp.reduce((sum, row) => sum + row.amount, 0), catalog };
}
