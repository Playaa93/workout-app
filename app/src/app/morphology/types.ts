// =============================================================================
// TYPES for Morphology Quiz
// =============================================================================

export type MorphoQuestion = {
  id: string;
  questionKey: string;
  questionTextFr: string;
  questionType: string;
  category: string;
  helpText?: string;
  options: Array<{ label: string; value: string; description?: string }>;
  orderIndex: number;
};

export type FrameSize = 'fine' | 'medium' | 'large';
export type SegmentLength = 'short' | 'medium' | 'long';
export type SegmentWidth = 'narrow' | 'medium' | 'wide';
export type InsertionPotential = 'high' | 'medium' | 'low';
export type MobilityLevel = 'limited' | 'average' | 'good';
export type ValgusLevel = 'none' | 'slight' | 'pronounced';
export type MetabolismType = 'fast' | 'balanced' | 'slow';

export type StructureProfile = {
  frameSize: FrameSize;
  shoulderToHip: SegmentWidth;
  ribcageDepth: SegmentWidth;
};

export type ProportionsProfile = {
  torsoLength: SegmentLength;
  armLength: SegmentLength;
  femurLength: SegmentLength;
  kneeValgus: ValgusLevel;
};

export type MobilityProfile = {
  ankleDorsiflexion: MobilityLevel;
  posteriorChain: MobilityLevel;
  wristMobility: ValgusLevel;
};

export type InsertionsProfile = {
  biceps: InsertionPotential;
  calves: InsertionPotential;
  chest: InsertionPotential;
};

export type MetabolismProfile = {
  weightTendency: MetabolismType;
  naturalStrength: 'low' | 'average' | 'high';
  bestResponders: string;
};

export type ExerciseRecommendation = {
  exercise: string;
  advantages: string[];
  disadvantages: string[];
  variants: string[];
  tips: string[];
};

export type MobilityWork = {
  area: string;
  priority: 'high' | 'medium' | 'low';
  exercises: string[];
};

export type MorphotypeResult = {
  // Global classification
  globalType: 'longiligne' | 'breviligne' | 'balanced';

  // Detailed profiles
  structure: StructureProfile;
  proportions: ProportionsProfile;
  mobility: MobilityProfile;
  insertions: InsertionsProfile;
  metabolism: MetabolismProfile;

  // Recommendations
  squat: ExerciseRecommendation;
  deadlift: ExerciseRecommendation;
  bench: ExerciseRecommendation;
  curls: ExerciseRecommendation;
  mobilityWork: MobilityWork[];

  // Legacy fields for DB compatibility
  primary: 'ectomorph' | 'mesomorph' | 'endomorph' | 'ecto_meso' | 'meso_endo' | 'ecto_endo';
  secondary: string | null;
  scores: { ecto: number; meso: number; endo: number };
  strengths: string[];
  weaknesses: string[];
  recommendedExercises: string[];
  exercisesToAvoid: string[];
};
