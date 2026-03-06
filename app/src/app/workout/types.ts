export type Exercise = {
  id: string;
  nameFr: string;
  nameEn: string | null;
  muscleGroup: string;
  primaryMuscles: string[] | null;
  secondaryMuscles: string[] | null;
  equipment: string[] | null;
  difficulty: string | null;
  morphotypeRecommendations?: unknown;
};

export type TemplateExercise = {
  exerciseId: string;
  exerciseName: string;
  orderIndex: number;
  targetSets: number;
  targetReps: string;
  restSeconds: number;
  notes: string | null;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description: string | null;
  targetMuscles: string[];
  estimatedDuration: number | null;
  exercises: TemplateExercise[];
  createdAt: Date;
};

export type WorkoutSession = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  totalVolume: string | null;
  caloriesBurned: number | null;
  notes: string | null;
  sessionType: 'strength' | 'cardio' | null;
  cardioActivity: string | null;
  distanceMeters: string | null;
  avgPaceSecondsPerKm: number | null;
  avgSpeedKmh: string | null;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  reps: number | null;
  weight: string | null;
  rpe: number | null;
  isWarmup: boolean | null;
  isPr: boolean | null;
  restTaken: number | null;
};

export type ActiveSession = {
  session: WorkoutSession;
  sets: WorkoutSet[];
  exercises: Map<string, Exercise>;
};

export type ExportSet = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  setNumber: number;
  reps: number | null;
  weight: string | null;
  rpe: number | null;
  isWarmup: boolean | null;
  isPr: boolean | null;
};

export type ExportSessionData = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  totalVolume: string | null;
  caloriesBurned: number | null;
  perceivedDifficulty: number | null;
  energyLevel: number | null;
  notes: string | null;
  sessionType: 'strength' | 'cardio' | null;
  cardioActivity: string | null;
  distanceMeters: string | null;
  avgPaceSecondsPerKm: number | null;
  sets: ExportSet[];
};
