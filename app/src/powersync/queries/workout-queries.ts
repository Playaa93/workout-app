'use client';

import { useQuery } from '@powersync/react';
import { useUserId } from '../auth-context';
import { todayStr, localDayBoundsUTC } from '../helpers';
import type { Database } from '../schema';

export type ExerciseRow = Database['exercises'];
export type WorkoutSessionRow = Database['workout_sessions'];
export type WorkoutSetRow = Database['workout_sets'];
export type TemplateRow = Database['workout_templates'];
export type TemplateExerciseRow = Database['workout_template_exercises'];
export type PersonalRecordRow = Database['personal_records'];
export type CardioIntervalRow = Database['cardio_intervals'];

export function useExercises() {
  return useQuery<ExerciseRow>(
    `SELECT * FROM exercises ORDER BY muscle_group, name_fr`
  );
}

export function useExercisesByMuscle(muscle: string) {
  return useQuery<ExerciseRow>(
    `SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name_fr`,
    [muscle]
  );
}

export function useRecentSessions(limit = 10) {
  const userId = useUserId();
  return useQuery<WorkoutSessionRow>(
    `SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT ?`,
    [userId, limit]
  );
}

export function useActiveSession(sessionId: string | null) {
  return useQuery<WorkoutSessionRow>(
    sessionId
      ? `SELECT * FROM workout_sessions WHERE id = ?`
      : `SELECT * FROM workout_sessions WHERE 0`,
    [sessionId]
  );
}

export function useSessionSets(sessionId: string | null) {
  return useQuery<WorkoutSetRow & { exercise_name: string }>(
    sessionId
      ? `SELECT ws.*, e.name_fr as exercise_name
         FROM workout_sets ws
         LEFT JOIN exercises e ON ws.exercise_id = e.id
         WHERE ws.session_id = ?
         ORDER BY ws.performed_at`
      : `SELECT * FROM workout_sets WHERE 0`,
    [sessionId]
  );
}

export function useSessionDetail(sessionId: string) {
  const userId = useUserId();
  return useQuery<WorkoutSessionRow>(
    `SELECT * FROM workout_sessions WHERE id = ? AND user_id = ?`,
    [sessionId, userId]
  );
}

export function useTemplates() {
  const userId = useUserId();
  return useQuery<TemplateRow>(
    `SELECT * FROM workout_templates WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );
}

export function useTemplateExercises(templateId: string | null) {
  return useQuery<TemplateExerciseRow & { exercise_name: string }>(
    templateId
      ? `SELECT wte.*, e.name_fr as exercise_name
         FROM workout_template_exercises wte
         LEFT JOIN exercises e ON wte.exercise_id = e.id
         WHERE wte.template_id = ?
         ORDER BY wte.order_index`
      : `SELECT * FROM workout_template_exercises WHERE 0`,
    [templateId]
  );
}

export function useAllTemplateExercises() {
  const userId = useUserId();
  return useQuery<TemplateExerciseRow & { exercise_name: string }>(
    `SELECT wte.*, e.name_fr as exercise_name
     FROM workout_template_exercises wte
     LEFT JOIN exercises e ON wte.exercise_id = e.id
     INNER JOIN workout_templates wt ON wte.template_id = wt.id
     WHERE wt.user_id = ?
     ORDER BY wte.template_id, wte.order_index`,
    [userId]
  );
}

export function useLastSetsForExercise(exerciseId: string, limit = 5) {
  const userId = useUserId();
  return useQuery<WorkoutSetRow & { exercise_name: string }>(
    `SELECT ws.*, e.name_fr as exercise_name
     FROM workout_sets ws
     INNER JOIN workout_sessions wses ON ws.session_id = wses.id
     LEFT JOIN exercises e ON ws.exercise_id = e.id
     WHERE wses.user_id = ? AND ws.exercise_id = ? AND ws.is_warmup = 0
     ORDER BY ws.performed_at DESC LIMIT ?`,
    [userId, exerciseId, limit]
  );
}

export function useSimilarExercises(exerciseId: string, muscleGroup: string) {
  // In SQLite we can't use && array overlap, so we fall back to muscle_group matching
  return useQuery<ExerciseRow>(
    `SELECT * FROM exercises
     WHERE muscle_group = ? AND id != ?
     ORDER BY name_fr`,
    [muscleGroup, exerciseId]
  );
}

export function usePersonalRecords() {
  const userId = useUserId();
  return useQuery<PersonalRecordRow & { exercise_name: string }>(
    `SELECT pr.*, e.name_fr as exercise_name
     FROM personal_records pr
     LEFT JOIN exercises e ON pr.exercise_id = e.id
     WHERE pr.user_id = ?
     ORDER BY pr.achieved_at DESC`,
    [userId]
  );
}

export function useTodayWorkoutCalories() {
  const userId = useUserId();
  const { start, end } = localDayBoundsUTC(todayStr());

  return useQuery<{ total: number }>(
    `SELECT COALESCE(SUM(calories_burned), 0) as total
     FROM workout_sessions
     WHERE user_id = ? AND started_at >= ? AND started_at < ?`,
    [userId, start, end]
  );
}

export function useCardioSession(sessionId: string | null) {
  return useQuery<WorkoutSessionRow>(
    sessionId
      ? `SELECT * FROM workout_sessions WHERE id = ? AND session_type = 'cardio'`
      : `SELECT * FROM workout_sessions WHERE 0`,
    [sessionId]
  );
}

export function useCardioIntervals(sessionId: string | null) {
  return useQuery<CardioIntervalRow>(
    sessionId
      ? `SELECT * FROM cardio_intervals WHERE session_id = ? ORDER BY interval_number`
      : `SELECT * FROM cardio_intervals WHERE 0`,
    [sessionId]
  );
}

export function useAllSessionsForExport() {
  const userId = useUserId();
  return useQuery<WorkoutSessionRow>(
    `SELECT * FROM workout_sessions WHERE user_id = ? AND ended_at IS NOT NULL ORDER BY started_at DESC`,
    [userId]
  );
}

export function useAllSetsForExport() {
  const userId = useUserId();
  return useQuery<WorkoutSetRow & { exercise_name: string; muscle_group: string }>(
    `SELECT ws.*, e.name_fr as exercise_name, e.muscle_group
     FROM workout_sets ws
     LEFT JOIN exercises e ON ws.exercise_id = e.id
     INNER JOIN workout_sessions wses ON ws.session_id = wses.id
     WHERE wses.user_id = ? AND wses.ended_at IS NOT NULL
     ORDER BY ws.performed_at`,
    [userId]
  );
}
