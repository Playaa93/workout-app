'use server';

import { and, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { db, exercises, workoutSessions, workoutSets, workoutTemplates, workoutTemplateExercises } from '@/db';
import { requireUserId } from '@/lib/auth';
import type { EnrichedWorkoutSession, WorkoutTemplate } from './types';

export async function getWorkoutOverview() {
  const userId = await requireUserId();
  const sessionsQuery = (open: boolean) => db.select({
    id: workoutSessions.id,
    startedAt: workoutSessions.startedAt,
    endedAt: workoutSessions.endedAt,
    durationMinutes: workoutSessions.durationMinutes,
    totalVolume: workoutSessions.totalVolume,
    caloriesBurned: workoutSessions.caloriesBurned,
    notes: workoutSessions.notes,
    sessionType: workoutSessions.sessionType,
    cardioActivity: workoutSessions.cardioActivity,
    distanceMeters: workoutSessions.distanceMeters,
    avgPaceSecondsPerKm: workoutSessions.avgPaceSecondsPerKm,
    avgSpeedKmh: workoutSessions.avgSpeedKmh,
    templateName: workoutTemplates.name,
    exerciseNames: sql<string[]>`coalesce(array_agg(distinct ${exercises.nameFr}) filter (where ${exercises.nameFr} is not null), '{}')`,
    muscleGroups: sql<string[]>`coalesce(array_agg(distinct ${exercises.muscleGroup}) filter (where ${exercises.muscleGroup} is not null), '{}')`,
    exerciseCount: sql<number>`count(distinct ${exercises.id})::int`,
  }).from(workoutSessions)
    .leftJoin(workoutTemplates, and(eq(workoutTemplates.id, workoutSessions.templateId), eq(workoutTemplates.userId, userId)))
    .leftJoin(workoutSets, eq(workoutSets.sessionId, workoutSessions.id))
    .leftJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(and(eq(workoutSessions.userId, userId), open ? isNull(workoutSessions.endedAt) : isNotNull(workoutSessions.endedAt)))
    .groupBy(workoutSessions.id, workoutTemplates.name)
    .orderBy(desc(workoutSessions.startedAt));

  const [open, recent, programs] = await Promise.all([
    sessionsQuery(true),
    sessionsQuery(false).limit(10),
    db.select({ id: workoutTemplates.id, name: workoutTemplates.name, description: workoutTemplates.description, targetMuscles: workoutTemplates.targetMuscles, estimatedDuration: workoutTemplates.estimatedDuration, createdAt: workoutTemplates.createdAt }).from(workoutTemplates).where(eq(workoutTemplates.userId, userId)).orderBy(desc(workoutTemplates.createdAt)),
  ]);
  const sessions: EnrichedWorkoutSession[] = [...open, ...recent].map(row => ({ ...row, startedAt: row.startedAt! }));
  const templates: WorkoutTemplate[] = programs.map(row => ({ ...row, targetMuscles: row.targetMuscles ?? [], exercises: [], createdAt: row.createdAt! }));
  return { sessions, templates };
}

export async function getSavedWorkout(sessionId: string) {
  const userId = await requireUserId();
  const rows = await db.select({
    templateName: workoutTemplates.name, templateId: workoutTemplates.id, startedAt: workoutSessions.startedAt, endedAt: workoutSessions.endedAt,
    exerciseId: workoutSets.exerciseId, isWarmup: workoutSets.isWarmup, performedAt: workoutSets.performedAt, rest: workoutSets.restTaken,
    setId: workoutSets.id, exercise: exercises.nameFr, reps: workoutSets.reps, weight: workoutSets.weight,
  }).from(workoutSessions)
    .leftJoin(workoutTemplates, and(eq(workoutTemplates.id, workoutSessions.templateId), eq(workoutTemplates.userId, userId)))
    .leftJoin(workoutSets, eq(workoutSets.sessionId, workoutSessions.id))
    .leftJoin(exercises, eq(exercises.id, workoutSets.exerciseId))
    .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId), sql`${workoutSessions.sessionType} IS DISTINCT FROM 'cardio'`))
    .orderBy(workoutSets.performedAt);
  if (!rows.length) return null;
  const templateId = rows[0].templateId;
  const plan = templateId ? await db.select({ exerciseId: exercises.id, name: exercises.nameFr,
    targetSets: workoutTemplateExercises.targetSets, rest: workoutTemplateExercises.restSeconds })
    .from(workoutTemplateExercises).innerJoin(exercises, eq(exercises.id, workoutTemplateExercises.exerciseId))
    .where(eq(workoutTemplateExercises.templateId, templateId)).orderBy(workoutTemplateExercises.orderIndex) : [];
  return { title: rows[0].templateName || 'Séance', startedAt: rows[0].startedAt, endedAt: rows[0].endedAt, plan,
    sets: rows.flatMap(row => row.setId ? [{ id: row.setId, exerciseId: row.exerciseId, isWarmup: row.isWarmup,
      performedAt: row.performedAt, rest: row.rest, name: row.exercise || 'Exercice', reps: row.reps, weight: row.weight }] : []) };
}
