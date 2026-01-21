// =============================================================================
// ENRICHED EXERCISE TYPES
// Based on SuperPhysique (Rudy Coia) and Delavier methodology
// =============================================================================

// Movement pattern classification
export type MovementPattern = 'push' | 'pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'rotation' | 'isolation';

// Exercise type classification
export type ExerciseType = 'compound' | 'isolation';

// Difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Data source
export type DataSource = 'superphysique' | 'delavier' | 'manual' | 'combined';

// =============================================================================
// ANATOMICAL MUSCLE LIST (Delavier precision)
// =============================================================================

export const ANATOMICAL_MUSCLES = {
  // Chest
  pec_major_clavicular: 'Pectoral majeur claviculaire (haut)',
  pec_major_sternal: 'Pectoral majeur sternal (milieu)',
  pec_major_abdominal: 'Pectoral majeur abdominal (bas)',
  pec_minor: 'Petit pectoral',

  // Back
  latissimus_dorsi: 'Grand dorsal',
  rhomboids: 'Rhomboïdes',
  trapezius_upper: 'Trapèze supérieur',
  trapezius_mid: 'Trapèze moyen',
  trapezius_lower: 'Trapèze inférieur',
  erector_spinae: 'Érecteurs du rachis',
  teres_major: 'Grand rond',
  teres_minor: 'Petit rond',
  infraspinatus: 'Infra-épineux',

  // Shoulders
  anterior_delt: 'Deltoïde antérieur',
  lateral_delt: 'Deltoïde latéral',
  posterior_delt: 'Deltoïde postérieur',
  rotator_cuff: 'Coiffe des rotateurs',

  // Arms
  biceps_long_head: 'Biceps longue portion',
  biceps_short_head: 'Biceps courte portion',
  brachialis: 'Brachial',
  brachioradialis: 'Brachio-radial',
  triceps_long_head: 'Triceps longue portion',
  triceps_lateral_head: 'Triceps vaste externe',
  triceps_medial_head: 'Triceps vaste interne',
  forearm_flexors: 'Fléchisseurs avant-bras',
  forearm_extensors: 'Extenseurs avant-bras',

  // Legs
  quadriceps_rectus_femoris: 'Droit fémoral',
  quadriceps_vastus_lateralis: 'Vaste externe',
  quadriceps_vastus_medialis: 'Vaste interne',
  quadriceps_vastus_intermedius: 'Vaste intermédiaire',
  hamstrings_biceps_femoris: 'Biceps fémoral',
  hamstrings_semitendinosus: 'Semi-tendineux',
  hamstrings_semimembranosus: 'Semi-membraneux',
  gluteus_maximus: 'Grand fessier',
  gluteus_medius: 'Moyen fessier',
  gluteus_minimus: 'Petit fessier',
  hip_flexors: 'Fléchisseurs de hanche',
  adductors: 'Adducteurs',
  tensor_fasciae_latae: 'Tenseur du fascia lata',
  calves_gastrocnemius: 'Gastrocnémien',
  calves_soleus: 'Soléaire',
  tibialis_anterior: 'Tibial antérieur',

  // Core
  rectus_abdominis: 'Grand droit',
  obliques_external: 'Obliques externes',
  obliques_internal: 'Obliques internes',
  transverse_abdominis: 'Transverse',
  serratus_anterior: 'Dentelé antérieur',
} as const;

export type AnatomicalMuscle = keyof typeof ANATOMICAL_MUSCLES;

// =============================================================================
// MORPHOTYPE CRITERIA (SuperPhysique methodology)
// =============================================================================

export const MORPHOTYPE_CRITERIA = {
  // Limb proportions
  arm_length_short: 'Bras courts',
  arm_length_long: 'Bras longs',
  femur_length_short: 'Fémurs courts',
  femur_length_long: 'Fémurs longs',
  torso_length_short: 'Torse court',
  torso_length_long: 'Torse long',

  // Structure
  narrow_clavicles: 'Clavicules étroites',
  wide_clavicles: 'Clavicules larges',
  narrow_hips: 'Hanches étroites',
  wide_hips: 'Hanches larges',
  narrow_ribcage: 'Cage thoracique étroite',
  wide_ribcage: 'Cage thoracique large',
  fine_bone_structure: 'Ossature fine',
  large_bone_structure: 'Ossature large',

  // Global types
  longiligne: 'Longiligne (ecto)',
  breviligne: 'Bréviligne (endo)',
  balanced: 'Équilibré (meso)',
} as const;

export type MorphotypeCriterion = keyof typeof MORPHOTYPE_CRITERIA;

// =============================================================================
// CONDITIONS / LIMITATIONS
// =============================================================================

export const CONDITIONS = {
  limited_ankle_mobility: 'Mobilité cheville limitée',
  limited_hip_mobility: 'Mobilité hanche limitée',
  limited_shoulder_mobility: 'Mobilité épaule limitée',
  limited_thoracic_mobility: 'Mobilité thoracique limitée',
  wrist_pain: 'Douleur poignet',
  shoulder_pain: 'Douleur épaule',
  lower_back_pain: 'Douleur lombaire',
  knee_valgus: 'Genoux valgus',
  anterior_pelvic_tilt: 'Antéversion du bassin',
} as const;

export type Condition = keyof typeof CONDITIONS;

// =============================================================================
// EQUIPMENT
// =============================================================================

export const EQUIPMENT = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  ez_bar: 'Barre EZ',
  cable: 'Poulie',
  machine: 'Machine',
  smith_machine: 'Smith machine',
  bodyweight: 'Poids de corps',
  kettlebell: 'Kettlebell',
  resistance_band: 'Élastique',
  bench_flat: 'Banc plat',
  bench_incline: 'Banc incliné',
  bench_decline: 'Banc décliné',
  squat_rack: 'Rack à squat',
  pull_up_bar: 'Barre de traction',
  dip_bars: 'Barres parallèles',
  leg_press_machine: 'Presse à cuisses',
  hack_squat_machine: 'Hack squat',
  preacher_bench: 'Pupitre Larry Scott',
  ab_wheel: 'Roue abdominale',
  trap_bar: 'Trap bar',
  landmine: 'Landmine',
} as const;

export type Equipment = keyof typeof EQUIPMENT;

// =============================================================================
// ENRICHED EXERCISE INTERFACE
// =============================================================================

export interface MorphoSuitability {
  morphotypes: MorphotypeCriterion[];
  conditions?: Condition[];
}

export interface ExerciseModification {
  condition: MorphotypeCriterion | Condition;
  adjustment: string;
}

export interface EnrichedExercise {
  // Identification
  id: string;
  name_fr: string;
  name_en: string;
  aliases: string[];

  // Classification
  movement_pattern: MovementPattern;
  exercise_type: ExerciseType;
  muscle_group: string; // For backward compatibility with existing DB

  // Muscles (anatomical precision - Delavier)
  primary_muscles: AnatomicalMuscle[];
  secondary_muscles: AnatomicalMuscle[];
  stabilizers: AnatomicalMuscle[];

  // Equipment
  equipment: Equipment[];
  equipment_alternatives?: Equipment[];

  // Morphology (SuperPhysique/Delavier)
  good_for: MorphoSuitability;
  bad_for: MorphoSuitability;
  modifications: ExerciseModification[];

  // Execution
  difficulty: DifficultyLevel;
  technique_cues: string[];
  common_mistakes: string[];

  // Metadata
  source: DataSource;
  video_url?: string;
}

// =============================================================================
// DB-COMPATIBLE EXERCISE TYPE (for Drizzle schema)
// Uses JSON fields for complex nested structures
// =============================================================================

export interface ExerciseDBRecord {
  id: string;
  name_fr: string;
  name_en: string | null;
  aliases: string[];
  movement_pattern: MovementPattern;
  exercise_type: ExerciseType;
  muscle_group: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  stabilizers: string[];
  equipment: string[];
  equipment_alternatives: string[];
  good_for: {
    morphotypes: string[];
    conditions: string[];
  };
  bad_for: {
    morphotypes: string[];
    conditions: string[];
  };
  modifications: Array<{
    condition: string;
    adjustment: string;
  }>;
  difficulty: DifficultyLevel;
  technique_cues: string[];
  common_mistakes: string[];
  source: DataSource;
  video_url: string | null;
  image_url: string | null;
  is_custom: boolean;
  created_by: string | null;
  created_at: Date;
}

// =============================================================================
// MUSCLE GROUP MAPPING (for backward compatibility)
// =============================================================================

export const MUSCLE_TO_GROUP: Record<AnatomicalMuscle, string> = {
  // Chest -> 'chest'
  pec_major_clavicular: 'chest',
  pec_major_sternal: 'chest',
  pec_major_abdominal: 'chest',
  pec_minor: 'chest',

  // Back -> 'back'
  latissimus_dorsi: 'back',
  rhomboids: 'back',
  trapezius_upper: 'back',
  trapezius_mid: 'back',
  trapezius_lower: 'back',
  erector_spinae: 'back',
  teres_major: 'back',
  teres_minor: 'back',
  infraspinatus: 'back',

  // Shoulders -> 'shoulders'
  anterior_delt: 'shoulders',
  lateral_delt: 'shoulders',
  posterior_delt: 'shoulders',
  rotator_cuff: 'shoulders',

  // Arms -> 'arms'
  biceps_long_head: 'arms',
  biceps_short_head: 'arms',
  brachialis: 'arms',
  brachioradialis: 'arms',
  triceps_long_head: 'arms',
  triceps_lateral_head: 'arms',
  triceps_medial_head: 'arms',
  forearm_flexors: 'arms',
  forearm_extensors: 'arms',

  // Legs -> 'legs'
  quadriceps_rectus_femoris: 'legs',
  quadriceps_vastus_lateralis: 'legs',
  quadriceps_vastus_medialis: 'legs',
  quadriceps_vastus_intermedius: 'legs',
  hamstrings_biceps_femoris: 'legs',
  hamstrings_semitendinosus: 'legs',
  hamstrings_semimembranosus: 'legs',
  gluteus_maximus: 'legs',
  gluteus_medius: 'legs',
  gluteus_minimus: 'legs',
  hip_flexors: 'legs',
  adductors: 'legs',
  tensor_fasciae_latae: 'legs',
  calves_gastrocnemius: 'legs',
  calves_soleus: 'legs',
  tibialis_anterior: 'legs',

  // Core -> 'core'
  rectus_abdominis: 'core',
  obliques_external: 'core',
  obliques_internal: 'core',
  transverse_abdominis: 'core',
  serratus_anterior: 'core',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the main muscle group for an exercise based on primary muscles
 */
export function getMuscleGroup(primaryMuscles: AnatomicalMuscle[]): string {
  if (primaryMuscles.length === 0) return 'full_body';
  const group = MUSCLE_TO_GROUP[primaryMuscles[0]];
  return group || 'full_body';
}

/**
 * Check if an exercise is suitable for a given morphotype
 */
export function isSuitableForMorphotype(
  exercise: EnrichedExercise,
  morphotypeCriteria: MorphotypeCriterion[]
): { suitable: boolean; score: number; reasons: string[] } {
  const goodMatches = exercise.good_for.morphotypes.filter(m =>
    morphotypeCriteria.includes(m)
  );
  const badMatches = exercise.bad_for.morphotypes.filter(m =>
    morphotypeCriteria.includes(m)
  );

  const score = 70 + (goodMatches.length * 10) - (badMatches.length * 15);
  const reasons: string[] = [];

  if (goodMatches.length > 0) {
    reasons.push(`Adapté pour: ${goodMatches.map(m => MORPHOTYPE_CRITERIA[m]).join(', ')}`);
  }
  if (badMatches.length > 0) {
    reasons.push(`Moins adapté pour: ${badMatches.map(m => MORPHOTYPE_CRITERIA[m]).join(', ')}`);
  }

  return {
    suitable: score >= 50,
    score: Math.max(0, Math.min(100, score)),
    reasons,
  };
}

/**
 * Get applicable modifications for a morphotype
 */
export function getModifications(
  exercise: EnrichedExercise,
  criteria: (MorphotypeCriterion | Condition)[]
): string[] {
  return exercise.modifications
    .filter(mod => criteria.includes(mod.condition as MorphotypeCriterion | Condition))
    .map(mod => mod.adjustment);
}
