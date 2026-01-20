'use server';

import { db, exercises, workoutTemplates, workoutTemplateExercises, users, morphoProfiles } from '@/db';
import { eq } from 'drizzle-orm';
import type { MorphotypeResult } from '@/app/morphology/types';
import {
  scoreExercise,
  getCategoryDefault,
  type MorphoRecommendation,
} from '@/lib/morpho-exercise-scoring';
import {
  type ProgramGoal,
  type ProgramApproach,
  type ProgramSplit,
  type ProgramConfig,
  GOAL_LABELS,
  APPROACH_LABELS,
  SPLIT_LABELS,
} from './constants';

export type GeneratedExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  morphoScore: number;
  notes: string[];
};

export type GeneratedWorkout = {
  name: string;
  targetMuscles: string[];
  exercises: GeneratedExercise[];
};

export type GeneratedProgram = {
  workouts: GeneratedWorkout[];
  config: ProgramConfig;
};

// Get user morphotype for program generation
async function getUserMorphotype(): Promise<MorphotypeResult | null> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return null;

  const profile = await db
    .select()
    .from(morphoProfiles)
    .where(eq(morphoProfiles.userId, user[0].id))
    .limit(1);

  if (profile.length === 0) return null;

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

// Get all exercises with their morpho scores
async function getExercisesWithScores(morphotype: MorphotypeResult | null) {
  const allExercises = await db
    .select({
      id: exercises.id,
      nameFr: exercises.nameFr,
      muscleGroup: exercises.muscleGroup,
      secondaryMuscles: exercises.secondaryMuscles,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
      morphotypeRecommendations: exercises.morphotypeRecommendations,
    })
    .from(exercises);

  return allExercises.map((ex) => {
    let score = 70;
    let notes: string[] = [];

    if (morphotype) {
      const rec = (ex.morphotypeRecommendations as MorphoRecommendation | null)
        || getCategoryDefault(ex.muscleGroup, ex.nameFr);
      const result = scoreExercise(morphotype, rec);
      score = result.score;
      notes = [...result.modifications, ...result.cues];
    }

    return {
      ...ex,
      morphoScore: score,
      notes,
    };
  });
}

// Split configurations (muscle names match database: chest, back, shoulders, legs, arms, core, full_body)
const SPLIT_CONFIGS: Record<ProgramSplit, { name: string; days: { name: string; muscles: string[] }[] }> = {
  full_body: {
    name: 'Full Body',
    days: [
      { name: 'Full Body A', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
      { name: 'Full Body B', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
      { name: 'Full Body C', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
      { name: 'Full Body D', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
      { name: 'Full Body E', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
      { name: 'Full Body F', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
      { name: 'Full Body G', muscles: ['chest', 'back', 'shoulders', 'legs', 'arms'] },
    ],
  },
  ppl: {
    name: 'Push/Pull/Legs',
    days: [
      { name: 'Push', muscles: ['chest', 'shoulders', 'arms'] },
      { name: 'Pull', muscles: ['back', 'arms'] },
      { name: 'Legs', muscles: ['legs'] },
      { name: 'Push 2', muscles: ['chest', 'shoulders', 'arms'] },
      { name: 'Pull 2', muscles: ['back', 'arms'] },
      { name: 'Legs 2', muscles: ['legs'] },
      { name: 'Push 3', muscles: ['chest', 'shoulders', 'arms'] },
    ],
  },
  upper_lower: {
    name: 'Upper/Lower',
    days: [
      { name: 'Upper A', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { name: 'Lower A', muscles: ['legs'] },
      { name: 'Upper B', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { name: 'Lower B', muscles: ['legs'] },
      { name: 'Upper C', muscles: ['chest', 'back', 'shoulders', 'arms'] },
      { name: 'Lower C', muscles: ['legs'] },
      { name: 'Upper D', muscles: ['chest', 'back', 'shoulders', 'arms'] },
    ],
  },
  bro_split: {
    name: 'Bro Split',
    days: [
      { name: 'Pectoraux', muscles: ['chest'] },
      { name: 'Dos', muscles: ['back'] },
      { name: 'Épaules', muscles: ['shoulders'] },
      { name: 'Jambes', muscles: ['legs'] },
      { name: 'Bras', muscles: ['arms'] },
      { name: 'Pectoraux 2', muscles: ['chest'] },
      { name: 'Dos 2', muscles: ['back'] },
    ],
  },
};

// Goal-based rep schemes (based on Gundill/Delavier methodology)
const GOAL_SCHEMES: Record<ProgramGoal, { sets: number; reps: string; rest: number; tempo?: string }> = {
  strength: { sets: 5, reps: '3-5', rest: 180 },           // Force pure - charges max
  hypertrophy: { sets: 4, reps: '8-12', rest: 90, tempo: '3-1-2-0' },  // Tension mécanique
  metabolic: { sets: 3, reps: '15-20', rest: 45 },        // Stress métabolique - pump
  powerbuilding: { sets: 4, reps: '6-8', rest: 120 },     // Mix force/volume
  athletic: { sets: 4, reps: '5-8', rest: 90 },           // Explosivité
  recomposition: { sets: 3, reps: '10-15', rest: 60 },    // Optimisé métabolisme
};

// Generate program based on config, morphotype, and approach
export async function generateProgram(config: ProgramConfig): Promise<GeneratedProgram> {
  const morphotype = await getUserMorphotype();
  const exercisesWithScores = await getExercisesWithScores(morphotype);
  const splitConfig = SPLIT_CONFIGS[config.split];
  const goalScheme = GOAL_SCHEMES[config.goal];

  // Get the days we'll use based on daysPerWeek
  const daysToUse = splitConfig.days.slice(0, config.daysPerWeek);

  const workouts: GeneratedWorkout[] = daysToUse.map((day) => {
    // Filter exercises for this day's target muscles (exact match with DB values)
    let relevantExercises = exercisesWithScores.filter((ex) => {
      return day.muscles.includes(ex.muscleGroup.toLowerCase());
    });

    // Apply approach-based sorting and filtering
    let sortedExercises: typeof relevantExercises;

    switch (config.approach) {
      case 'leverage_strengths':
        // Prioritize exercises where morphology gives advantage (score >= 65)
        // Sort by score DESC, filter out poorly-suited exercises
        sortedExercises = [...relevantExercises]
          .filter(ex => ex.morphoScore >= 55) // Only exercises that work for this body
          .sort((a, b) => b.morphoScore - a.morphoScore);
        break;

      case 'fix_weaknesses':
        // Prioritize working on weak points (exercises with medium scores 40-70)
        // These are areas where work is needed but not contraindicated
        sortedExercises = [...relevantExercises]
          .filter(ex => ex.morphoScore >= 40 && ex.morphoScore <= 75) // Avoid extreme scores
          .sort((a, b) => a.morphoScore - b.morphoScore); // Work hardest areas first
        break;

      case 'balanced':
      default:
        // Balanced: prefer good scores but include variety
        sortedExercises = [...relevantExercises]
          .sort((a, b) => b.morphoScore - a.morphoScore);
        break;
    }

    // Fallback if filters removed too many exercises
    if (sortedExercises.length < 3) {
      sortedExercises = [...relevantExercises].sort((a, b) => b.morphoScore - a.morphoScore);
    }

    // Select exercises (2-4 per muscle group depending on split)
    const exercisesPerMuscle = config.split === 'bro_split' ? 4 : config.split === 'full_body' ? 1 : 2;
    const selectedExercises: GeneratedExercise[] = [];
    const usedMuscles = new Set<string>();

    for (const ex of sortedExercises) {
      const muscleCount = Array.from(usedMuscles).filter((m) =>
        ex.muscleGroup.toLowerCase().includes(m)
      ).length;

      if (muscleCount < exercisesPerMuscle) {
        // Adjust sets based on morpho score, goal, and approach
        let sets = goalScheme.sets;

        if (config.approach === 'fix_weaknesses' && ex.morphoScore < 60) {
          // For weakness correction: more volume on weak areas
          sets = Math.min(5, sets + 1);
        } else if (ex.morphoScore < 50) {
          sets = Math.max(2, sets - 1); // Reduce volume for poor-fit exercises
        }

        // Add approach-specific notes
        const approachNotes = [...ex.notes];
        if (config.approach === 'fix_weaknesses' && ex.morphoScore < 60) {
          approachNotes.push('Focus correctif - travailler la technique');
        } else if (config.approach === 'leverage_strengths' && ex.morphoScore >= 80) {
          approachNotes.push('Point fort morphologique - pousser l\'intensité');
        }

        selectedExercises.push({
          exerciseId: ex.id,
          exerciseName: ex.nameFr,
          muscleGroup: ex.muscleGroup,
          sets,
          reps: goalScheme.reps,
          restSeconds: goalScheme.rest,
          morphoScore: ex.morphoScore,
          notes: approachNotes,
        });

        usedMuscles.add(ex.muscleGroup.toLowerCase());

        // Limit total exercises per workout
        if (selectedExercises.length >= (config.split === 'full_body' ? 8 : 6)) {
          break;
        }
      }
    }

    return {
      name: day.name,
      targetMuscles: day.muscles,
      exercises: selectedExercises,
    };
  });

  return {
    workouts,
    config,
  };
}

// Save generated program as templates
export async function saveProgramAsTemplates(program: GeneratedProgram): Promise<{ success: boolean; templateIds: string[] }> {
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) throw new Error('No user found');

  const templateIds: string[] = [];

  for (const workout of program.workouts) {
    // Create template
    const [template] = await db
      .insert(workoutTemplates)
      .values({
        userId: user[0].id,
        name: workout.name,
        description: `${GOAL_LABELS[program.config.goal]} • ${APPROACH_LABELS[program.config.approach]} • ${SPLIT_LABELS[program.config.split]}`,
        targetMuscles: workout.targetMuscles,
        estimatedDuration: workout.exercises.length * 8, // Rough estimate: 8 min per exercise
        isPublic: false,
      })
      .returning();

    templateIds.push(template.id);

    // Add exercises to template
    for (let i = 0; i < workout.exercises.length; i++) {
      const ex = workout.exercises[i];
      await db.insert(workoutTemplateExercises).values({
        templateId: template.id,
        exerciseId: ex.exerciseId,
        orderIndex: i + 1,
        targetSets: ex.sets,
        targetReps: ex.reps,
        restSeconds: ex.restSeconds,
        notes: ex.notes.length > 0 ? ex.notes.join(' | ') : null,
      });
    }
  }

  return { success: true, templateIds };
}
