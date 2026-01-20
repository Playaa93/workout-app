'use server';

import { db, exercises, workoutSessions, workoutSets, users, userGamification, xpTransactions, personalRecords, morphoProfiles, workoutTemplates, workoutTemplateExercises } from '@/db';
import { eq, desc, and, sql, gte, lte } from 'drizzle-orm';
import type { MorphotypeResult } from '@/app/morphology/types';

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
  notes: string | null;
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
};

export type ActiveSession = {
  session: WorkoutSession;
  sets: WorkoutSet[];
  exercises: Map<string, Exercise>;
};

// Get all exercises grouped by muscle
export async function getExercises(): Promise<Exercise[]> {
  const result = await db
    .select({
      id: exercises.id,
      nameFr: exercises.nameFr,
      nameEn: exercises.nameEn,
      muscleGroup: exercises.muscleGroup,
      primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
      morphotypeRecommendations: exercises.morphotypeRecommendations,
    })
    .from(exercises)
    .orderBy(exercises.muscleGroup, exercises.nameFr);

  return result;
}

// Get exercises by muscle group
export async function getExercisesByMuscle(muscle: string): Promise<Exercise[]> {
  const result = await db
    .select({
      id: exercises.id,
      nameFr: exercises.nameFr,
      nameEn: exercises.nameEn,
      muscleGroup: exercises.muscleGroup,
      secondaryMuscles: exercises.secondaryMuscles,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
    })
    .from(exercises)
    .where(eq(exercises.muscleGroup, muscle))
    .orderBy(exercises.nameFr);

  return result;
}

// Get recent workout sessions
export async function getRecentSessions(limit = 10): Promise<WorkoutSession[]> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return [];

  const result = await db
    .select({
      id: workoutSessions.id,
      startedAt: workoutSessions.startedAt,
      endedAt: workoutSessions.endedAt,
      durationMinutes: workoutSessions.durationMinutes,
      totalVolume: workoutSessions.totalVolume,
      notes: workoutSessions.notes,
    })
    .from(workoutSessions)
    .where(eq(workoutSessions.userId, user[0].id))
    .orderBy(desc(workoutSessions.startedAt))
    .limit(limit);

  return result.map(s => ({
    ...s,
    startedAt: s.startedAt!,
  }));
}

// Start a new workout session
export async function startWorkoutSession(): Promise<string> {
  // Get or create user
  let user = await db.select().from(users).limit(1);
  if (user.length === 0) {
    const [newUser] = await db
      .insert(users)
      .values({ email: 'demo@workout.app', displayName: 'haze' })
      .returning();
    user = [newUser];
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: user[0].id,
      startedAt: new Date(),
    })
    .returning();

  return session.id;
}

// Get active session with sets
export async function getActiveSession(sessionId: string): Promise<ActiveSession | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));

  if (!session) return null;

  // Get all sets for this session with exercise names
  const sets = await db
    .select({
      id: workoutSets.id,
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.nameFr,
      setNumber: workoutSets.setNumber,
      reps: workoutSets.reps,
      weight: workoutSets.weight,
      rpe: workoutSets.rpe,
      isWarmup: workoutSets.isWarmup,
      isPr: workoutSets.isPr,
    })
    .from(workoutSets)
    .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(eq(workoutSets.sessionId, sessionId))
    .orderBy(workoutSets.performedAt);

  // Get unique exercises used in session
  const exerciseIds = [...new Set(sets.map(s => s.exerciseId).filter(Boolean))];
  const exercisesData = exerciseIds.length > 0
    ? await db
        .select({
          id: exercises.id,
          nameFr: exercises.nameFr,
          nameEn: exercises.nameEn,
          muscleGroup: exercises.muscleGroup,
          secondaryMuscles: exercises.secondaryMuscles,
          equipment: exercises.equipment,
          difficulty: exercises.difficulty,
        })
        .from(exercises)
        .where(sql`${exercises.id} IN ${exerciseIds}`)
    : [];

  const exerciseMap = new Map<string, Exercise>();
  exercisesData.forEach(e => exerciseMap.set(e.id, e));

  return {
    session: {
      id: session.id,
      startedAt: session.startedAt!,
      endedAt: session.endedAt,
      durationMinutes: session.durationMinutes,
      totalVolume: session.totalVolume,
      notes: session.notes,
    },
    sets: sets.map(s => ({
      ...s,
      exerciseId: s.exerciseId!,
      exerciseName: s.exerciseName || 'Unknown',
    })),
    exercises: exerciseMap,
  };
}

// Add a set to the session
export async function addSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  reps: number,
  weight: number,
  rpe?: number,
  isWarmup = false
): Promise<{ id: string; isPr: boolean }> {
  // Check if this is a PR
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) throw new Error('No user found');

  // Get current PR for this exercise (1RM estimation: weight * (1 + reps/30))
  const estimated1RM = weight * (1 + reps / 30);

  const [currentPR] = await db
    .select()
    .from(personalRecords)
    .where(
      and(
        eq(personalRecords.userId, user[0].id),
        eq(personalRecords.exerciseId, exerciseId),
        eq(personalRecords.recordType, '1rm')
      )
    );

  const isPr = !currentPR || estimated1RM > parseFloat(currentPR.value);

  // Insert the set
  const [set] = await db
    .insert(workoutSets)
    .values({
      sessionId,
      exerciseId,
      setNumber,
      reps,
      weight: weight.toString(),
      rpe,
      isWarmup,
      isPr,
      performedAt: new Date(),
    })
    .returning();

  // Update PR if this is a new record
  if (isPr && !isWarmup) {
    await db
      .insert(personalRecords)
      .values({
        userId: user[0].id,
        exerciseId,
        recordType: '1rm',
        value: estimated1RM.toFixed(2),
        workoutSetId: set.id,
        achievedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [personalRecords.userId, personalRecords.exerciseId, personalRecords.recordType],
        set: {
          value: estimated1RM.toFixed(2),
          workoutSetId: set.id,
          achievedAt: new Date(),
        },
      });
  }

  return { id: set.id, isPr: isPr && !isWarmup };
}

// Delete a set
export async function deleteSet(setId: string): Promise<void> {
  await db.delete(workoutSets).where(eq(workoutSets.id, setId));
}

// Estimate calories burned during strength training
// Based on MET values: ~5 MET for moderate strength training
// Formula: Calories = MET × weight(kg) × duration(hours)
function estimateCaloriesBurned(durationMinutes: number, totalVolume: number, perceivedDifficulty?: number): number {
  // Base MET for strength training (3.5-6 depending on intensity)
  let met = 4.5;

  // Adjust MET based on perceived difficulty (1-10 scale)
  if (perceivedDifficulty) {
    met = 3.5 + (perceivedDifficulty / 10) * 2.5; // Range 3.5-6
  }

  // Assume average weight of 75kg if not available
  const weightKg = 75;
  const durationHours = durationMinutes / 60;

  // Base calories from duration
  let calories = met * weightKg * durationHours;

  // Bonus for high volume (extra effort)
  const volumeBonus = Math.min(totalVolume / 10000 * 50, 100); // Up to 100 extra cal
  calories += volumeBonus;

  return Math.round(calories);
}

// End workout session
export async function endWorkoutSession(
  sessionId: string,
  perceivedDifficulty?: number,
  notes?: string
): Promise<{ xpEarned: number; totalVolume: number; duration: number; prCount: number; caloriesBurned: number }> {
  const session = await getActiveSession(sessionId);
  if (!session) throw new Error('Session not found');

  // Calculate stats
  const endTime = new Date();
  const startTime = new Date(session.session.startedAt);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

  // Calculate total volume (sum of weight * reps for all sets)
  let totalVolume = 0;
  let prCount = 0;
  for (const set of session.sets) {
    if (!set.isWarmup && set.weight && set.reps) {
      totalVolume += parseFloat(set.weight) * set.reps;
    }
    if (set.isPr) prCount++;
  }

  // Calculate calories burned
  const caloriesBurned = estimateCaloriesBurned(durationMinutes, totalVolume, perceivedDifficulty);

  // Update session
  await db
    .update(workoutSessions)
    .set({
      endedAt: endTime,
      durationMinutes,
      totalVolume: totalVolume.toFixed(2),
      caloriesBurned,
      perceivedDifficulty,
      notes,
    })
    .where(eq(workoutSessions.id, sessionId));

  // Award XP
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) throw new Error('No user found');

  // Base XP + bonus for volume and PRs
  const baseXp = 50;
  const volumeBonus = Math.floor(totalVolume / 1000) * 10; // 10 XP per 1000kg
  const prBonus = prCount * 25; // 25 XP per PR
  const totalXp = baseXp + volumeBonus + prBonus;

  // Add XP transaction
  await db.insert(xpTransactions).values({
    userId: user[0].id,
    amount: totalXp,
    reason: 'workout_completed',
    referenceType: 'workout_session',
    referenceId: sessionId,
  });

  // Update user gamification
  await db
    .insert(userGamification)
    .values({
      userId: user[0].id,
      totalXp,
      lastActivityDate: new Date().toISOString().split('T')[0],
    })
    .onConflictDoUpdate({
      target: userGamification.userId,
      set: {
        totalXp: sql`${userGamification.totalXp} + ${totalXp}`,
        lastActivityDate: new Date().toISOString().split('T')[0],
        currentStreak: sql`${userGamification.currentStreak} + 1`,
        updatedAt: new Date(),
      },
    });

  return {
    xpEarned: totalXp,
    totalVolume,
    duration: durationMinutes,
    prCount,
    caloriesBurned,
  };
}

// Get today's calories burned from workouts
export async function getTodayWorkoutCalories(): Promise<number> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const sessions = await db
    .select({ caloriesBurned: workoutSessions.caloriesBurned })
    .from(workoutSessions)
    .where(
      and(
        eq(workoutSessions.userId, user[0].id),
        gte(workoutSessions.startedAt, today),
        lte(workoutSessions.startedAt, tomorrow)
      )
    );

  return sessions.reduce((total, s) => total + (s.caloriesBurned || 0), 0);
}

// Get last sets for an exercise (to show previous performance)
export async function getLastSetsForExercise(exerciseId: string, limit = 5): Promise<WorkoutSet[]> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return [];

  const result = await db
    .select({
      id: workoutSets.id,
      exerciseId: workoutSets.exerciseId,
      exerciseName: exercises.nameFr,
      setNumber: workoutSets.setNumber,
      reps: workoutSets.reps,
      weight: workoutSets.weight,
      rpe: workoutSets.rpe,
      isWarmup: workoutSets.isWarmup,
      isPr: workoutSets.isPr,
    })
    .from(workoutSets)
    .innerJoin(workoutSessions, eq(workoutSets.sessionId, workoutSessions.id))
    .leftJoin(exercises, eq(workoutSets.exerciseId, exercises.id))
    .where(
      and(
        eq(workoutSessions.userId, user[0].id),
        eq(workoutSets.exerciseId, exerciseId),
        eq(workoutSets.isWarmup, false)
      )
    )
    .orderBy(desc(workoutSets.performedAt))
    .limit(limit);

  return result.map(s => ({
    ...s,
    exerciseId: s.exerciseId!,
    exerciseName: s.exerciseName || 'Unknown',
  }));
}

// Get user's morphotype result for exercise scoring
export async function getUserMorphotype(): Promise<MorphotypeResult | null> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return null;

  const profile = await db
    .select()
    .from(morphoProfiles)
    .where(eq(morphoProfiles.userId, user[0].id))
    .limit(1);

  if (profile.length === 0) return null;

  // Reconstruct MorphotypeResult from stored profile
  const stored = profile[0];
  const scores = stored.morphotypeScore as Record<string, unknown> | null;

  if (!scores) return null;

  return {
    globalType: (scores.globalType as 'longiligne' | 'breviligne' | 'balanced') || 'balanced',
    structure: (scores.structure as MorphotypeResult['structure']) || {
      frameSize: 'medium',
      shoulderToHip: 'medium',
      ribcageDepth: 'medium',
    },
    proportions: (scores.proportions as MorphotypeResult['proportions']) || {
      torsoLength: stored.torsoProportion || 'medium',
      armLength: stored.armProportion || 'medium',
      femurLength: stored.legProportion || 'medium',
      kneeValgus: 'none',
    },
    mobility: (scores.mobility as MorphotypeResult['mobility']) || {
      ankleDorsiflexion: 'average',
      posteriorChain: 'average',
      wristMobility: 'none',
    },
    insertions: (scores.insertions as MorphotypeResult['insertions']) || {
      biceps: 'medium',
      calves: 'medium',
      chest: 'medium',
    },
    metabolism: (scores.metabolism as MorphotypeResult['metabolism']) || {
      weightTendency: 'balanced',
      naturalStrength: 'average',
      bestResponders: 'none',
    },
    // Legacy fields
    squat: { exercise: 'Squat', advantages: [], disadvantages: [], variants: [], tips: [] },
    deadlift: { exercise: 'Deadlift', advantages: [], disadvantages: [], variants: [], tips: [] },
    bench: { exercise: 'Bench', advantages: [], disadvantages: [], variants: [], tips: [] },
    curls: { exercise: 'Curls', advantages: [], disadvantages: [], variants: [], tips: [] },
    mobilityWork: [],
    primary: stored.primaryMorphotype,
    secondary: stored.secondaryMorphotype,
    scores: {
      ecto: (scores.ecto as number) || 0,
      meso: (scores.meso as number) || 0,
      endo: (scores.endo as number) || 0,
    },
    strengths: stored.strengths || [],
    weaknesses: stored.weaknesses || [],
    recommendedExercises: stored.recommendedExercises || [],
    exercisesToAvoid: stored.exercisesToAvoid || [],
  };
}

// Get all workout templates for the user
export async function getTemplates(): Promise<WorkoutTemplate[]> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return [];

  const templates = await db
    .select({
      id: workoutTemplates.id,
      name: workoutTemplates.name,
      description: workoutTemplates.description,
      targetMuscles: workoutTemplates.targetMuscles,
      estimatedDuration: workoutTemplates.estimatedDuration,
      createdAt: workoutTemplates.createdAt,
    })
    .from(workoutTemplates)
    .where(eq(workoutTemplates.userId, user[0].id))
    .orderBy(desc(workoutTemplates.createdAt));

  // Get exercises for each template
  const result: WorkoutTemplate[] = [];
  for (const template of templates) {
    const templateExercises = await db
      .select({
        exerciseId: workoutTemplateExercises.exerciseId,
        exerciseName: exercises.nameFr,
        orderIndex: workoutTemplateExercises.orderIndex,
        targetSets: workoutTemplateExercises.targetSets,
        targetReps: workoutTemplateExercises.targetReps,
        restSeconds: workoutTemplateExercises.restSeconds,
        notes: workoutTemplateExercises.notes,
      })
      .from(workoutTemplateExercises)
      .leftJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
      .where(eq(workoutTemplateExercises.templateId, template.id))
      .orderBy(workoutTemplateExercises.orderIndex);

    result.push({
      ...template,
      targetMuscles: template.targetMuscles || [],
      createdAt: template.createdAt!,
      exercises: templateExercises.map(e => ({
        ...e,
        exerciseName: e.exerciseName || 'Unknown',
        targetSets: e.targetSets || 3,
        targetReps: e.targetReps || '8-12',
        restSeconds: e.restSeconds || 90,
      })),
    });
  }

  return result;
}

// Start a workout session from a template (pre-loads exercises)
export async function startWorkoutFromTemplate(templateId: string): Promise<{ sessionId: string; exercises: TemplateExercise[] }> {
  // Get or create user
  let user = await db.select().from(users).limit(1);
  if (user.length === 0) {
    const [newUser] = await db
      .insert(users)
      .values({ email: 'demo@workout.app', displayName: 'haze' })
      .returning();
    user = [newUser];
  }

  // Get template exercises
  const templateExercises = await db
    .select({
      exerciseId: workoutTemplateExercises.exerciseId,
      exerciseName: exercises.nameFr,
      orderIndex: workoutTemplateExercises.orderIndex,
      targetSets: workoutTemplateExercises.targetSets,
      targetReps: workoutTemplateExercises.targetReps,
      restSeconds: workoutTemplateExercises.restSeconds,
      notes: workoutTemplateExercises.notes,
    })
    .from(workoutTemplateExercises)
    .leftJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
    .where(eq(workoutTemplateExercises.templateId, templateId))
    .orderBy(workoutTemplateExercises.orderIndex);

  // Create session
  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId: user[0].id,
      templateId,
      startedAt: new Date(),
    })
    .returning();

  return {
    sessionId: session.id,
    exercises: templateExercises.map(e => ({
      ...e,
      exerciseName: e.exerciseName || 'Unknown',
      targetSets: e.targetSets || 3,
      targetReps: e.targetReps || '8-12',
      restSeconds: e.restSeconds || 90,
    })),
  };
}

// Delete a workout template
export async function deleteTemplate(templateId: string): Promise<void> {
  // Delete exercises first (foreign key constraint)
  await db.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.templateId, templateId));
  // Then delete template
  await db.delete(workoutTemplates).where(eq(workoutTemplates.id, templateId));
}

// Delete a workout session
export async function deleteSession(sessionId: string): Promise<void> {
  // Delete sets first (foreign key constraint)
  await db.delete(workoutSets).where(eq(workoutSets.sessionId, sessionId));
  // Then delete session
  await db.delete(workoutSessions).where(eq(workoutSessions.id, sessionId));
}

// Get template exercises for a session (if session was started from a template)
export async function getSessionTemplateExercises(sessionId: string): Promise<TemplateExercise[]> {
  // Get session to find templateId
  const [session] = await db
    .select({ templateId: workoutSessions.templateId })
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));

  if (!session?.templateId) return [];

  // Get template exercises
  const templateExercises = await db
    .select({
      exerciseId: workoutTemplateExercises.exerciseId,
      exerciseName: exercises.nameFr,
      orderIndex: workoutTemplateExercises.orderIndex,
      targetSets: workoutTemplateExercises.targetSets,
      targetReps: workoutTemplateExercises.targetReps,
      restSeconds: workoutTemplateExercises.restSeconds,
      notes: workoutTemplateExercises.notes,
    })
    .from(workoutTemplateExercises)
    .leftJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
    .where(eq(workoutTemplateExercises.templateId, session.templateId))
    .orderBy(workoutTemplateExercises.orderIndex);

  return templateExercises.map(e => ({
    ...e,
    exerciseName: e.exerciseName || 'Unknown',
    targetSets: e.targetSets || 3,
    targetReps: e.targetReps || '8-12',
    restSeconds: e.restSeconds || 90,
  }));
}

// Get similar exercises (same primary muscles) for swapping
export async function getSimilarExercises(exerciseId: string): Promise<Exercise[]> {
  // Get the current exercise's primary muscles
  const [currentExercise] = await db
    .select({
      muscleGroup: exercises.muscleGroup,
      primaryMuscles: exercises.primaryMuscles,
    })
    .from(exercises)
    .where(eq(exercises.id, exerciseId));

  if (!currentExercise) return [];

  const primaryMuscles = currentExercise.primaryMuscles || [];

  // If no primary muscles data, fall back to muscle group matching
  if (primaryMuscles.length === 0) {
    const similarExercises = await db
      .select({
        id: exercises.id,
        nameFr: exercises.nameFr,
        nameEn: exercises.nameEn,
        muscleGroup: exercises.muscleGroup,
        secondaryMuscles: exercises.secondaryMuscles,
        equipment: exercises.equipment,
        difficulty: exercises.difficulty,
        morphotypeRecommendations: exercises.morphotypeRecommendations,
      })
      .from(exercises)
      .where(
        and(
          eq(exercises.muscleGroup, currentExercise.muscleGroup),
          sql`${exercises.id} != ${exerciseId}`
        )
      )
      .orderBy(exercises.nameFr);
    return similarExercises;
  }

  // Get exercises that share at least one primary muscle
  // Using array overlap operator &&
  const primaryMusclesLiteral = `ARRAY[${primaryMuscles.map(m => `'${m}'`).join(',')}]::text[]`;
  const similarExercises = await db
    .select({
      id: exercises.id,
      nameFr: exercises.nameFr,
      nameEn: exercises.nameEn,
      muscleGroup: exercises.muscleGroup,
      primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
      morphotypeRecommendations: exercises.morphotypeRecommendations,
    })
    .from(exercises)
    .where(
      and(
        sql`${exercises.primaryMuscles} && ${sql.raw(primaryMusclesLiteral)}`,
        sql`${exercises.id} != ${exerciseId}`
      )
    )
    .orderBy(exercises.nameFr);

  // Sort by number of shared primary muscles (most shared first)
  return similarExercises.sort((a, b) => {
    const aShared = (a.primaryMuscles || []).filter(m => primaryMuscles.includes(m)).length;
    const bShared = (b.primaryMuscles || []).filter(m => primaryMuscles.includes(m)).length;
    return bShared - aShared;
  });
}

// Swap an exercise in a template (for a session)
export async function swapTemplateExercise(
  sessionId: string,
  oldExerciseId: string,
  newExerciseId: string
): Promise<{ success: boolean }> {
  // Get session to find templateId
  const [session] = await db
    .select({ templateId: workoutSessions.templateId })
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));

  if (!session?.templateId) {
    return { success: false };
  }

  // Get the new exercise name for the notes
  const [newExercise] = await db
    .select({ nameFr: exercises.nameFr })
    .from(exercises)
    .where(eq(exercises.id, newExerciseId));

  // Update the template exercise
  await db
    .update(workoutTemplateExercises)
    .set({
      exerciseId: newExerciseId,
    })
    .where(
      and(
        eq(workoutTemplateExercises.templateId, session.templateId),
        eq(workoutTemplateExercises.exerciseId, oldExerciseId)
      )
    );

  return { success: true };
}
