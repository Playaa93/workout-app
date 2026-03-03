'use server';

import { db, exercises, workoutTemplates, workoutTemplateExercises } from '@/db';
import { eq } from 'drizzle-orm';
import type { MorphotypeResult } from '@/app/morphology/types';
import { requireUserId } from '@/lib/auth';
import { getUserMorphotype } from '@/lib/morphotype-utils';
import {
  type ProgramGoal,
  type ProgramApproach,
  type ProgramSplit,
  type ProgramConfig,
  GOAL_LABELS,
  APPROACH_LABELS,
  SPLIT_LABELS,
} from './constants';
import type { MorphotypeCriterion, Condition } from '@/lib/exercise-types';

// Types for expert data
type GoalScores = { strength: number; hypertrophy: number; athletic: number; rehab: number };
type MorphoProtocol = { sets_modifier: number; reps: string; tempo: string; notes: string };
type RestModifiers = Record<string, number>;

export type GeneratedExercise = {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  movementPattern: string;
  exerciseType: string;
  sets: number;
  reps: string;
  restSeconds: number;
  morphoScore: number;
  goalScore: number;
  priority: string;
  tempo?: string;
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

// Convert morphotype result to morphotype criteria for matching
function getMorphotypeCriteria(morphotype: MorphotypeResult): MorphotypeCriterion[] {
  const criteria: MorphotypeCriterion[] = [];

  // Arm length
  if (morphotype.proportions.armLength === 'long') criteria.push('arm_length_long');
  if (morphotype.proportions.armLength === 'short') criteria.push('arm_length_short');

  // Femur length
  if (morphotype.proportions.femurLength === 'long') criteria.push('femur_length_long');
  if (morphotype.proportions.femurLength === 'short') criteria.push('femur_length_short');

  // Torso length
  if (morphotype.proportions.torsoLength === 'long') criteria.push('torso_length_long');
  if (morphotype.proportions.torsoLength === 'short') criteria.push('torso_length_short');

  // Structure
  if (morphotype.structure.ribcageDepth === 'narrow') criteria.push('narrow_ribcage');
  if (morphotype.structure.ribcageDepth === 'wide') criteria.push('wide_ribcage');
  if (morphotype.structure.shoulderToHip === 'narrow') criteria.push('narrow_clavicles');
  if (morphotype.structure.shoulderToHip === 'wide') criteria.push('wide_clavicles');
  if (morphotype.structure.frameSize === 'fine') criteria.push('fine_bone_structure');
  if (morphotype.structure.frameSize === 'large') criteria.push('large_bone_structure');

  // Global type
  if (morphotype.globalType === 'longiligne') criteria.push('longiligne');
  if (morphotype.globalType === 'breviligne') criteria.push('breviligne');
  if (morphotype.globalType === 'balanced') criteria.push('balanced');

  return criteria;
}

// Get conditions from morphotype
function getConditions(morphotype: MorphotypeResult): Condition[] {
  const conditions: Condition[] = [];

  if (morphotype.mobility.ankleDorsiflexion === 'limited') conditions.push('limited_ankle_mobility');
  if (morphotype.mobility.posteriorChain === 'limited') conditions.push('limited_hip_mobility');
  if (morphotype.proportions.kneeValgus !== 'none') conditions.push('knee_valgus');

  return conditions;
}

// Calculate morpho score based on new good_for/bad_for fields
function calculateMorphoScore(
  goodFor: { morphotypes: string[]; conditions: string[] } | null,
  badFor: { morphotypes: string[]; conditions: string[] } | null,
  userCriteria: MorphotypeCriterion[],
  userConditions: Condition[]
): number {
  let score = 70; // Base score

  if (goodFor) {
    // Bonus for matching good_for criteria
    const goodMorphoMatches = goodFor.morphotypes.filter(m =>
      userCriteria.includes(m as MorphotypeCriterion)
    ).length;
    const goodCondMatches = goodFor.conditions.filter(c =>
      userConditions.includes(c as Condition)
    ).length;
    score += (goodMorphoMatches + goodCondMatches) * 10;
  }

  if (badFor) {
    // Penalty for matching bad_for criteria
    const badMorphoMatches = badFor.morphotypes.filter(m =>
      userCriteria.includes(m as MorphotypeCriterion)
    ).length;
    const badCondMatches = badFor.conditions.filter(c =>
      userConditions.includes(c as Condition)
    ).length;
    score -= (badMorphoMatches + badCondMatches) * 15;
  }

  return Math.max(0, Math.min(100, score));
}

// Get applicable modifications for the user
function getApplicableModifications(
  modifications: Array<{ condition: string; adjustment: string }> | null,
  userCriteria: MorphotypeCriterion[],
  userConditions: Condition[]
): string[] {
  if (!modifications || !Array.isArray(modifications)) return [];

  const allUserTraits = [...userCriteria, ...userConditions];

  return modifications
    .filter(mod => allUserTraits.includes(mod.condition as MorphotypeCriterion | Condition))
    .map(mod => mod.adjustment);
}

// Get all exercises with their morpho scores using expert data
async function getExercisesWithScores(morphotype: MorphotypeResult | null, goal: ProgramGoal) {
  const allExercises = await db
    .select({
      id: exercises.id,
      nameFr: exercises.nameFr,
      muscleGroup: exercises.muscleGroup,
      movementPattern: exercises.movementPattern,
      exerciseType: exercises.exerciseType,
      primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
      equipment: exercises.equipment,
      difficulty: exercises.difficulty,
      goodFor: exercises.goodFor,
      badFor: exercises.badFor,
      modifications: exercises.modifications,
      techniqueCues: exercises.techniqueCues,
      // New expert fields
      goalScores: exercises.goalScores,
      morphoProtocols: exercises.morphoProtocols,
      programmingPriority: exercises.programmingPriority,
      restModifiers: exercises.restModifiers,
      tempoRecommendations: exercises.tempoRecommendations,
    })
    .from(exercises);

  // Get user criteria
  const userCriteria = morphotype ? getMorphotypeCriteria(morphotype) : [];
  const userConditions = morphotype ? getConditions(morphotype) : [];

  // Map goal to goal_scores key
  const goalToScoreKey: Record<ProgramGoal, keyof GoalScores> = {
    strength: 'strength',
    hypertrophy: 'hypertrophy',
    metabolic: 'hypertrophy', // fallback
    powerbuilding: 'strength',
    athletic: 'athletic',
    recomposition: 'hypertrophy',
  };
  const scoreKey = goalToScoreKey[goal];

  return allExercises.map((ex) => {
    // Calculate morpho score using good_for/bad_for
    const goodFor = ex.goodFor as { morphotypes: string[]; conditions: string[] } | null;
    const badFor = ex.badFor as { morphotypes: string[]; conditions: string[] } | null;
    const mods = ex.modifications as Array<{ condition: string; adjustment: string }> | null;

    const morphoScore = morphotype
      ? calculateMorphoScore(goodFor, badFor, userCriteria, userConditions)
      : 70;

    // Get goal score from goal_scores
    const goalScoresData = ex.goalScores as GoalScores | null;
    const goalScore = goalScoresData ? goalScoresData[scoreKey] : 70;

    // Get morpho-specific protocol if available
    const morphoProtocols = ex.morphoProtocols as Record<string, MorphoProtocol> | null;
    let morphoProtocol: MorphoProtocol | null = null;
    if (morphoProtocols && userCriteria.length > 0) {
      // Find the first matching morphotype protocol
      for (const criterion of userCriteria) {
        if (morphoProtocols[criterion]) {
          morphoProtocol = morphoProtocols[criterion];
          break;
        }
      }
    }

    // Get rest modifiers
    const restMods = ex.restModifiers as RestModifiers | null;
    let restModifier = 1.0;
    if (restMods && userCriteria.length > 0) {
      for (const criterion of userCriteria) {
        if (restMods[criterion]) {
          restModifier = restMods[criterion];
          break;
        }
      }
    }

    // Get tempo recommendation
    const tempoRecs = ex.tempoRecommendations as Record<string, string> | null;
    let tempo: string | undefined;
    if (tempoRecs) {
      tempo = tempoRecs[goal] || tempoRecs.default;
    }

    // Build notes from modifications and morpho protocol
    const modifications = morphotype
      ? getApplicableModifications(mods, userCriteria, userConditions)
      : [];
    const techniqueCues = (ex.techniqueCues || []) as string[];

    const notes: string[] = [...modifications];
    if (morphoProtocol?.notes) {
      notes.unshift(morphoProtocol.notes); // Protocol notes first
    }
    notes.push(...techniqueCues.slice(0, 1)); // Only 1 technique cue

    return {
      ...ex,
      morphoScore,
      goalScore,
      priority: ex.programmingPriority || 'accessory',
      morphoProtocol,
      restModifier,
      tempo,
      notes,
    };
  });
}

// Split configurations
const SPLIT_CONFIGS: Record<ProgramSplit, { name: string; days: { name: string; muscles: string[]; patterns?: string[] }[] }> = {
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
      { name: 'Push', muscles: ['chest', 'shoulders', 'arms'], patterns: ['push'] },
      { name: 'Pull', muscles: ['back', 'shoulders', 'arms'], patterns: ['pull', 'hinge'] },
      { name: 'Legs', muscles: ['legs'], patterns: ['squat', 'hinge', 'lunge'] },
      { name: 'Push 2', muscles: ['chest', 'shoulders', 'arms'], patterns: ['push'] },
      { name: 'Pull 2', muscles: ['back', 'shoulders', 'arms'], patterns: ['pull', 'hinge'] },
      { name: 'Legs 2', muscles: ['legs'], patterns: ['squat', 'hinge', 'lunge'] },
      { name: 'Push 3', muscles: ['chest', 'shoulders', 'arms'], patterns: ['push'] },
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
  strength: { sets: 5, reps: '3-5', rest: 180 },
  hypertrophy: { sets: 4, reps: '8-12', rest: 90, tempo: '3-1-2-0' },
  metabolic: { sets: 3, reps: '15-20', rest: 45 },
  powerbuilding: { sets: 4, reps: '6-8', rest: 120 },
  athletic: { sets: 4, reps: '5-8', rest: 90 },
  recomposition: { sets: 3, reps: '10-15', rest: 60 },
};

// Priority order for exercise selection
const PRIORITY_ORDER: Record<string, number> = {
  primary: 0,
  secondary: 1,
  accessory: 2,
  finisher: 3,
};

// Score combiné morpho + objectif
const combinedScore = (ex: { morphoScore: number; goalScore: number }) =>
  ex.morphoScore * 0.6 + ex.goalScore * 0.4;

// Quotas compound/isolation par split
const EXERCISE_SLOTS: Record<ProgramSplit, { compoundPerMuscle: number; isolationPerMuscle: number; maxTotal: number }> = {
  full_body:   { compoundPerMuscle: 1, isolationPerMuscle: 0, maxTotal: 8 },
  ppl:         { compoundPerMuscle: 1, isolationPerMuscle: 1, maxTotal: 6 },
  upper_lower: { compoundPerMuscle: 1, isolationPerMuscle: 1, maxTotal: 6 },
  bro_split:   { compoundPerMuscle: 2, isolationPerMuscle: 2, maxTotal: 6 },
};

// Generate program based on config, morphotype, and approach
export async function generateProgram(config: ProgramConfig): Promise<GeneratedProgram> {
  const morphotype = await getUserMorphotype();
  const exercisesWithScores = await getExercisesWithScores(morphotype, config.goal);
  const splitConfig = SPLIT_CONFIGS[config.split];
  const goalScheme = GOAL_SCHEMES[config.goal];

  // Get the days we'll use based on daysPerWeek
  const daysToUse = splitConfig.days.slice(0, config.daysPerWeek);

  const workouts: GeneratedWorkout[] = daysToUse.map((day) => {
    // Filter exercises for this day
    let relevantExercises = exercisesWithScores.filter((ex) => {
      // Must match muscle group
      if (!day.muscles.includes(ex.muscleGroup.toLowerCase())) return false;

      // If day has pattern restrictions (PPL), filter by movement pattern
      if (day.patterns && day.patterns.length > 0) {
        const exPattern = ex.movementPattern || 'isolation';

        // Pour les bras en PPL : séparer biceps (pull) et triceps (push)
        if (ex.muscleGroup.toLowerCase() === 'arms') {
          const PUSH_ARM_MUSCLES = ['triceps_long_head', 'triceps_lateral_head', 'triceps_medial_head'];
          const PULL_ARM_MUSCLES = ['biceps_long_head', 'biceps_short_head', 'brachialis', 'brachioradialis'];
          const primaryMuscles = (ex.primaryMuscles || []) as string[];

          if (day.patterns.includes('push') && !primaryMuscles.some(m => PUSH_ARM_MUSCLES.includes(m))) return false;
          if (day.patterns.includes('pull') && !primaryMuscles.some(m => PULL_ARM_MUSCLES.includes(m))) return false;
        } else {
          if (day.patterns.includes('push') && !['push', 'isolation'].includes(exPattern)) {
            if (exPattern === 'pull') return false;
          }
          if (day.patterns.includes('pull') && !['pull', 'hinge', 'isolation'].includes(exPattern)) {
            if (exPattern === 'push') return false;
          }
        }
      }

      return true;
    });

    // Apply approach-based filtering with goal score consideration
    let filteredExercises: typeof relevantExercises;

    switch (config.approach) {
      case 'leverage_strengths':
        // High morpho score AND good for the goal
        filteredExercises = relevantExercises.filter(ex =>
          ex.morphoScore >= 55 && ex.goalScore >= 60
        );
        break;
      case 'fix_weaknesses':
        // Moderate morpho scores (corrective work) but still good for goal
        filteredExercises = relevantExercises.filter(ex =>
          ex.morphoScore >= 40 && ex.morphoScore <= 75 && ex.goalScore >= 50
        );
        break;
      case 'balanced':
      default:
        // Filter by goal score minimum
        filteredExercises = relevantExercises.filter(ex => ex.goalScore >= 50);
        break;
    }

    // Fallback if filters removed too many exercises
    if (filteredExercises.length < 3) {
      filteredExercises = relevantExercises;
    }

    // Sort by: 1) programming_priority, 2) combined score (morpho + goal)
    const sortedExercises = [...filteredExercises].sort((a, b) => {
      const aPriority = PRIORITY_ORDER[a.priority] ?? 2;
      const bPriority = PRIORITY_ORDER[b.priority] ?? 2;

      // Primary exercises first
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Within same priority, sort by combined score
      const aScore = combinedScore(a);
      const bScore = combinedScore(b);

      if (config.approach === 'fix_weaknesses') {
        return aScore - bScore; // Lowest morpho first for weakness work
      }
      return bScore - aScore; // Highest combined first otherwise
    });

    // Helper: build a GeneratedExercise from a scored exercise
    const buildGeneratedExercise = (ex: typeof sortedExercises[number]): GeneratedExercise => {
      let sets = goalScheme.sets;
      let reps = goalScheme.reps;
      let tempo = goalScheme.tempo || ex.tempo;
      let restSeconds = goalScheme.rest;

      if (ex.morphoProtocol) {
        sets = Math.max(2, Math.min(6, sets + ex.morphoProtocol.sets_modifier));
        reps = ex.morphoProtocol.reps;
        tempo = ex.morphoProtocol.tempo;
      }

      restSeconds = Math.round(restSeconds * ex.restModifier);

      if (config.approach === 'fix_weaknesses' && ex.morphoScore < 60) {
        sets = Math.min(5, sets + 1);
      } else if (ex.morphoScore < 50) {
        sets = Math.max(2, sets - 1);
      }

      const approachNotes = [...ex.notes];
      if (config.approach === 'fix_weaknesses' && ex.morphoScore < 60) {
        approachNotes.push('Focus correctif - technique prioritaire');
      } else if (config.approach === 'leverage_strengths' && ex.morphoScore >= 80) {
        approachNotes.push('Point fort - pousser l\'intensité');
      }

      return {
        exerciseId: ex.id,
        exerciseName: ex.nameFr,
        muscleGroup: ex.muscleGroup,
        movementPattern: ex.movementPattern || 'isolation',
        exerciseType: ex.exerciseType || 'isolation',
        sets,
        reps,
        restSeconds,
        morphoScore: ex.morphoScore,
        goalScore: ex.goalScore,
        priority: ex.priority,
        tempo,
        notes: approachNotes,
      };
    };

    // --- Sélection en 2 phases : compounds puis isolations ---
    const slots = EXERCISE_SLOTS[config.split];
    const selectedExercises: GeneratedExercise[] = [];
    const usedExerciseIds = new Set<string>();
    const compoundCounts = new Map<string, number>();
    const isolationCounts = new Map<string, number>();

    // Quotas dynamiques selon le nombre de groupes musculaires du jour
    // Ex PPL Push (3 muscles) : 1 compound + 1 isolation par muscle = 6
    // Ex PPL Legs (1 muscle)  : 3 compounds + 3 isolations = 6
    const numMuscles = day.muscles.length;
    const compoundPerMuscle = Math.max(slots.compoundPerMuscle, Math.ceil(Math.floor(slots.maxTotal / 2) / numMuscles));
    const isolationPerMuscle = Math.max(slots.isolationPerMuscle, Math.ceil(Math.floor(slots.maxTotal / 2) / numMuscles));

    // Séparer compounds et isolations
    const compounds = sortedExercises.filter(ex => ex.exerciseType === 'compound');
    const isolations = sortedExercises.filter(ex => ex.exerciseType !== 'compound');

    // Phase 1 : Sélectionner les compounds
    for (const ex of compounds) {
      if (selectedExercises.length >= slots.maxTotal) break;
      const muscle = ex.muscleGroup.toLowerCase();
      const count = compoundCounts.get(muscle) ?? 0;
      if (count < compoundPerMuscle && !usedExerciseIds.has(ex.id)) {
        selectedExercises.push(buildGeneratedExercise(ex));
        usedExerciseIds.add(ex.id);
        compoundCounts.set(muscle, count + 1);
      }
    }

    // Phase 2 : Sélectionner les isolations
    if (isolationPerMuscle > 0) {
      for (const ex of isolations) {
        if (selectedExercises.length >= slots.maxTotal) break;
        const muscle = ex.muscleGroup.toLowerCase();
        const count = isolationCounts.get(muscle) ?? 0;
        if (count < isolationPerMuscle && !usedExerciseIds.has(ex.id)) {
          selectedExercises.push(buildGeneratedExercise(ex));
          usedExerciseIds.add(ex.id);
          isolationCounts.set(muscle, count + 1);
        }
      }
    }

    // Ordre des exercices selon le type de split
    const muscleOrder = new Map<string, number>();
    day.muscles.forEach((m, i) => muscleOrder.set(m, i));

    // Compounds d'abord (charges lourdes quand frais), puis isolations par score
    // Fonctionne pour tous les splits : bro_split n'a qu'un muscle donc muscleOrder est un no-op
    selectedExercises.sort((a, b) => {
      const aIsCompound = a.exerciseType === 'compound' ? 0 : 1;
      const bIsCompound = b.exerciseType === 'compound' ? 0 : 1;
      if (aIsCompound !== bIsCompound) return aIsCompound - bIsCompound;

      if (aIsCompound === 0) {
        const aOrder = muscleOrder.get(a.muscleGroup.toLowerCase()) ?? 99;
        const bOrder = muscleOrder.get(b.muscleGroup.toLowerCase()) ?? 99;
        return aOrder - bOrder;
      }

      return combinedScore(b) - combinedScore(a);
    });

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
  const userId = await requireUserId();

  const templateIds: string[] = [];

  for (const workout of program.workouts) {
    // Create template
    const [template] = await db
      .insert(workoutTemplates)
      .values({
        userId,
        name: workout.name,
        description: `${GOAL_LABELS[program.config.goal]} • ${APPROACH_LABELS[program.config.approach]} • ${SPLIT_LABELS[program.config.split]}`,
        targetMuscles: workout.targetMuscles,
        estimatedDuration: workout.exercises.length * 8,
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
