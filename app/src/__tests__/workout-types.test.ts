import { describe, it, expect } from 'vitest';
import type {
  Exercise,
  WorkoutSet,
  WorkoutSession,
  WorkoutTemplate,
  ActiveSession,
  ExportSessionData,
  ExportSet,
  TemplateExercise,
} from '@/app/workout/types';

describe('Workout types', () => {
  it('Exercise type is structurally valid', () => {
    const exercise: Exercise = {
      id: 'ex1',
      nameFr: 'Développé couché',
      nameEn: 'Bench Press',
      muscleGroup: 'chest',
      primaryMuscles: ['pectoralis_major'],
      secondaryMuscles: ['anterior_deltoid', 'triceps'],
      equipment: ['barbell', 'bench'],
      difficulty: 'intermediate',
    };
    expect(exercise.id).toBe('ex1');
    expect(exercise.primaryMuscles).toHaveLength(1);
  });

  it('WorkoutSet type handles nullable fields', () => {
    const set: WorkoutSet = {
      id: 'set1',
      exerciseId: 'ex1',
      exerciseName: 'Squat',
      setNumber: 1,
      reps: 8,
      weight: '100',
      rpe: null,
      isWarmup: false,
      isPr: null,
      restTaken: null,
      notes: null,
      machineSetupId: null,
    };
    expect(set.rpe).toBeNull();
    expect(set.weight).toBe('100');
  });

  it('WorkoutSession type supports cardio fields', () => {
    const session: WorkoutSession = {
      id: 's1',
      startedAt: new Date(),
      endedAt: null,
      durationMinutes: null,
      totalVolume: null,
      caloriesBurned: null,
      notes: null,
      sessionType: 'cardio',
      cardioActivity: 'running',
      distanceMeters: '5000',
      avgPaceSecondsPerKm: 300,
      avgSpeedKmh: '12.00',
    };
    expect(session.sessionType).toBe('cardio');
    expect(session.cardioActivity).toBe('running');
  });

  it('ActiveSession contains exercises Map', () => {
    const session: ActiveSession = {
      session: {
        id: 's1',
        startedAt: new Date(),
        endedAt: null,
        durationMinutes: null,
        totalVolume: null,
        caloriesBurned: null,
        notes: null,
        sessionType: 'strength',
        cardioActivity: null,
        distanceMeters: null,
        avgPaceSecondsPerKm: null,
        avgSpeedKmh: null,
      },
      sets: [],
      exercises: new Map(),
    };
    expect(session.exercises).toBeInstanceOf(Map);
  });

  it('ExportSessionData includes sets array', () => {
    const exportData: ExportSessionData = {
      id: 's1',
      startedAt: new Date(),
      endedAt: new Date(),
      durationMinutes: 45,
      totalVolume: '5000',
      caloriesBurned: 300,
      perceivedDifficulty: 7,
      energyLevel: 8,
      notes: null,
      sessionType: 'strength',
      cardioActivity: null,
      distanceMeters: null,
      avgPaceSecondsPerKm: null,
      sets: [
        {
          exerciseId: 'ex1',
          exerciseName: 'Squat',
          muscleGroup: 'legs',
          setNumber: 1,
          reps: 8,
          weight: '100',
          rpe: 8,
          isWarmup: false,
          isPr: true,
        },
      ],
    };
    expect(exportData.sets).toHaveLength(1);
    expect(exportData.sets[0].isPr).toBe(true);
  });

  it('WorkoutTemplate contains exercises array', () => {
    const template: WorkoutTemplate = {
      id: 't1',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      targetMuscles: ['chest', 'shoulders', 'triceps'],
      estimatedDuration: 60,
      exercises: [
        {
          exerciseId: 'ex1',
          exerciseName: 'Bench Press',
          orderIndex: 0,
          targetSets: 4,
          targetReps: '8-10',
          restSeconds: 90,
          notes: null,
        },
      ],
      createdAt: new Date(),
    };
    expect(template.exercises).toHaveLength(1);
    expect(template.targetMuscles).toContain('chest');
  });
});
