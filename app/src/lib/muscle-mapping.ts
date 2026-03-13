// Shared muscle mapping utilities for react-body-highlighter
// Extracted from ExerciseDetailModal for reuse across recap/summary pages

// Mapping from our muscle names to react-body-highlighter muscle names
export const MUSCLE_MAPPING: Record<string, string[]> = {
  // Pectoraux
  pec_major_sternal: ['chest'],
  pec_major_clavicular: ['chest'],
  pec_major_abdominal: ['chest'],
  chest: ['chest'],

  // Dos
  latissimus_dorsi: ['upper-back'],
  teres_major: ['upper-back'],
  rhomboids: ['upper-back'],
  trapezius_mid: ['trapezius'],
  trapezius_upper: ['trapezius'],
  erector_spinae: ['lower-back'],
  back: ['upper-back', 'lower-back'],

  // Épaules
  anterior_delt: ['front-deltoids'],
  lateral_delt: ['front-deltoids'],
  posterior_delt: ['back-deltoids'],
  infraspinatus: ['back-deltoids'],
  teres_minor: ['back-deltoids'],
  shoulders: ['front-deltoids', 'back-deltoids'],

  // Bras
  biceps_long_head: ['biceps'],
  biceps_short_head: ['biceps'],
  brachialis: ['biceps'],
  brachioradialis: ['forearm'],
  triceps_long_head: ['triceps'],
  triceps_lateral_head: ['triceps'],
  triceps_medial_head: ['triceps'],
  forearm_flexors: ['forearm'],
  forearm_extensors: ['forearm'],
  arms: ['biceps', 'triceps', 'forearm'],

  // Jambes
  quadriceps_rectus_femoris: ['quadriceps'],
  quadriceps_vastus_lateralis: ['quadriceps'],
  quadriceps_vastus_medialis: ['quadriceps'],
  gluteus_maximus: ['gluteal'],
  gluteus_medius: ['gluteal'],
  hamstrings_biceps_femoris: ['hamstring'],
  hamstrings_semitendinosus: ['hamstring'],
  calves_gastrocnemius: ['calves'],
  calves_soleus: ['calves'],
  hip_flexors: ['quadriceps'],
  tensor_fasciae_latae: ['gluteal'],
  adductors: ['adductor'],
  legs: ['quadriceps', 'hamstring', 'gluteal', 'calves'],

  // Core
  rectus_abdominis: ['abs'],
  obliques: ['obliques'],
  obliques_external: ['obliques'],
  obliques_internal: ['obliques'],
  transverse_abdominis: ['abs'],
  serratus_anterior: ['obliques'],
  core: ['abs', 'obliques'],
};

export const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  'upper-back': 'Haut du dos',
  'lower-back': 'Lombaires',
  trapezius: 'Trapèzes',
  'front-deltoids': 'Épaules avant',
  'back-deltoids': 'Épaules arrière',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Avant-bras',
  abs: 'Abdominaux',
  obliques: 'Obliques',
  quadriceps: 'Quadriceps',
  hamstring: 'Ischio-jambiers',
  gluteal: 'Fessiers',
  calves: 'Mollets',
  adductor: 'Adducteurs',
};

export const ANTERIOR_MUSCLES = ['chest', 'abs', 'obliques', 'quadriceps', 'biceps', 'forearm', 'front-deltoids', 'adductor'];
export const POSTERIOR_MUSCLES = ['upper-back', 'lower-back', 'trapezius', 'back-deltoids', 'triceps', 'hamstring', 'gluteal', 'calves'];

export function getMappedMuscles(muscles: string[] | null): string[] {
  if (!muscles) return [];
  const mapped = new Set<string>();
  muscles.forEach(muscle => {
    const mappings = MUSCLE_MAPPING[muscle] || MUSCLE_MAPPING[muscle.toLowerCase()];
    if (mappings) {
      mappings.forEach(m => mapped.add(m));
    }
  });
  return Array.from(mapped);
}

export function getBestView(allMuscles: string[]): 'anterior' | 'posterior' {
  const hasAnt = allMuscles.some(m => ANTERIOR_MUSCLES.includes(m));
  const hasPost = allMuscles.some(m => POSTERIOR_MUSCLES.includes(m));
  if (hasPost && !hasAnt) return 'posterior';
  return 'anterior';
}

// ─── react-body-highlighter data builders ────────────────────────────

import type { Muscle, IExerciseData } from 'react-body-highlighter';

/** Build Model data for a single exercise (primary freq=2, secondary freq=1) */
export function buildExerciseModelData(
  exerciseName: string,
  primaryMuscles: string[],
  secondaryMuscles: string[],
): IExerciseData[] {
  const primary = getMappedMuscles(primaryMuscles);
  const primarySet = new Set(primary);
  const secondary = getMappedMuscles(secondaryMuscles).filter(m => !primarySet.has(m));
  return [
    ...primary.map(m => ({ name: exerciseName, muscles: [m] as Muscle[], frequency: 2 })),
    ...secondary.map(m => ({ name: exerciseName, muscles: [m] as Muscle[], frequency: 1 })),
  ];
}

/** Build Model data for a full session from muscle frequency map */
export function buildGlobalModelData(muscleFrequency: Map<string, number>): IExerciseData[] {
  const maxFreq = Math.max(...muscleFrequency.values(), 1);
  return Array.from(muscleFrequency.entries()).map(([muscle, freq]) => ({
    name: 'Session',
    muscles: [muscle] as Muscle[],
    frequency: Math.max(1, Math.round((freq / maxFreq) * 2)),
  }));
}
