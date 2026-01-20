// =============================================================================
// MORPHO-EXERCISE SCORING ENGINE
// Calcule un score de compatibilité exercice/morphotype
// =============================================================================

import type {
  MorphotypeResult,
  ProportionsProfile,
  MobilityProfile,
  InsertionsProfile,
  MetabolismProfile,
  StructureProfile,
} from '@/app/morphology/types';

export type ExerciseScore = {
  score: number; // 0-100
  advantages: string[];
  disadvantages: string[];
  modifications: string[];
  cues: string[]; // Conseils de placement
};

export type MorphoRecommendation = {
  // Segment proportions that affect this exercise
  armLength?: { short: number; medium: number; long: number };
  femurLength?: { short: number; medium: number; long: number };
  torsoLength?: { short: number; medium: number; long: number };
  // Mobility requirements
  ankleMobility?: { limited: number; average: number; good: number };
  posteriorChain?: { limited: number; average: number; good: number };
  wristMobility?: { none: number; slight: number; pronounced: number };
  // Structure impacts
  ribcageDepth?: { narrow: number; medium: number; wide: number };
  shoulderWidth?: { narrow: number; medium: number; wide: number };
  frameSize?: { fine: number; medium: number; large: number };
  // Insertion impacts (for isolation exercises)
  bicepsInsertion?: { high: number; medium: number; low: number };
  chestInsertion?: { high: number; medium: number; low: number };
  calvesInsertion?: { high: number; medium: number; low: number };
  // Metabolism adjustments
  metabolism?: { fast: number; balanced: number; slow: number };
  // Tips and modifications per morphotype
  tips?: {
    longArms?: string[];
    shortArms?: string[];
    longFemurs?: string[];
    shortFemurs?: string[];
    limitedAnkle?: string[];
    limitedPosterior?: string[];
    wristValgus?: string[];
    narrowRibcage?: string[];
    wideRibcage?: string[];
    kneeValgus?: string[];
  };
};

// Default scoring weights
const WEIGHTS = {
  proportions: 0.40,  // 40% of score
  mobility: 0.25,     // 25% of score
  structure: 0.20,    // 20% of score
  insertions: 0.10,   // 10% of score (for isolation)
  metabolism: 0.05,   // 5% of score
};

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

export function scoreExercise(
  morphotype: MorphotypeResult,
  recommendation: MorphoRecommendation | null
): ExerciseScore {
  if (!recommendation) {
    // No morpho data for this exercise - neutral score
    return {
      score: 70,
      advantages: [],
      disadvantages: [],
      modifications: [],
      cues: [],
    };
  }

  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const modifications: string[] = [];
  const cues: string[] = [];

  let totalScore = 0;
  let totalWeight = 0;

  // Score proportions
  const proportionsResult = scoreProportions(morphotype.proportions, recommendation);
  totalScore += proportionsResult.score * WEIGHTS.proportions;
  totalWeight += WEIGHTS.proportions;
  advantages.push(...proportionsResult.advantages);
  disadvantages.push(...proportionsResult.disadvantages);

  // Score mobility
  const mobilityResult = scoreMobility(morphotype.mobility, recommendation);
  totalScore += mobilityResult.score * WEIGHTS.mobility;
  totalWeight += WEIGHTS.mobility;
  advantages.push(...mobilityResult.advantages);
  disadvantages.push(...mobilityResult.disadvantages);

  // Score structure
  const structureResult = scoreStructure(morphotype.structure, recommendation);
  totalScore += structureResult.score * WEIGHTS.structure;
  totalWeight += WEIGHTS.structure;
  advantages.push(...structureResult.advantages);
  disadvantages.push(...structureResult.disadvantages);

  // Score insertions (mainly for isolation exercises)
  const insertionsResult = scoreInsertions(morphotype.insertions, recommendation);
  if (insertionsResult.hasData) {
    totalScore += insertionsResult.score * WEIGHTS.insertions;
    totalWeight += WEIGHTS.insertions;
    advantages.push(...insertionsResult.advantages);
    disadvantages.push(...insertionsResult.disadvantages);
  }

  // Collect tips based on morphotype
  if (recommendation.tips) {
    collectTips(morphotype, recommendation.tips, modifications, cues);
  }

  // Normalize score to 0-100
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 70;

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    advantages: [...new Set(advantages)], // Remove duplicates
    disadvantages: [...new Set(disadvantages)],
    modifications: [...new Set(modifications)],
    cues: [...new Set(cues)],
  };
}

// =============================================================================
// SCORING HELPERS
// =============================================================================

function scoreProportions(
  proportions: ProportionsProfile,
  rec: MorphoRecommendation
): { score: number; advantages: string[]; disadvantages: string[] } {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  let scores: number[] = [];

  // Arm length
  if (rec.armLength) {
    const s = rec.armLength[proportions.armLength];
    scores.push(s);
    if (s >= 80) advantages.push(`Bras ${proportions.armLength === 'long' ? 'longs' : proportions.armLength === 'short' ? 'courts' : 'moyens'} avantageux`);
    if (s <= 40) disadvantages.push(`Bras ${proportions.armLength === 'long' ? 'longs' : proportions.armLength === 'short' ? 'courts' : 'moyens'} désavantageux`);
  }

  // Femur length
  if (rec.femurLength) {
    const s = rec.femurLength[proportions.femurLength];
    scores.push(s);
    if (s >= 80) advantages.push(`Fémurs ${proportions.femurLength === 'long' ? 'longs' : proportions.femurLength === 'short' ? 'courts' : 'moyens'} avantageux`);
    if (s <= 40) disadvantages.push(`Fémurs ${proportions.femurLength === 'long' ? 'longs' : proportions.femurLength === 'short' ? 'courts' : 'moyens'} désavantageux`);
  }

  // Torso length
  if (rec.torsoLength) {
    const s = rec.torsoLength[proportions.torsoLength];
    scores.push(s);
    if (s >= 80) advantages.push(`Torse ${proportions.torsoLength === 'long' ? 'long' : proportions.torsoLength === 'short' ? 'court' : 'moyen'} avantageux`);
    if (s <= 40) disadvantages.push(`Torse ${proportions.torsoLength === 'long' ? 'long' : proportions.torsoLength === 'short' ? 'court' : 'moyen'} désavantageux`);
  }

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 70;
  return { score: avgScore, advantages, disadvantages };
}

function scoreMobility(
  mobility: MobilityProfile,
  rec: MorphoRecommendation
): { score: number; advantages: string[]; disadvantages: string[] } {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  let scores: number[] = [];

  // Ankle mobility
  if (rec.ankleMobility) {
    const s = rec.ankleMobility[mobility.ankleDorsiflexion];
    scores.push(s);
    if (s >= 80) advantages.push('Bonne mobilité de cheville');
    if (s <= 40) disadvantages.push('Mobilité de cheville limitée');
  }

  // Posterior chain
  if (rec.posteriorChain) {
    const s = rec.posteriorChain[mobility.posteriorChain];
    scores.push(s);
    if (s >= 80) advantages.push('Bonne souplesse ischio-jambiers');
    if (s <= 40) disadvantages.push('Ischio-jambiers raides');
  }

  // Wrist mobility
  if (rec.wristMobility) {
    const s = rec.wristMobility[mobility.wristMobility];
    scores.push(s);
    if (s <= 40) disadvantages.push('Valgus poignet - adapter la prise');
  }

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 70;
  return { score: avgScore, advantages, disadvantages };
}

function scoreStructure(
  structure: StructureProfile,
  rec: MorphoRecommendation
): { score: number; advantages: string[]; disadvantages: string[] } {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  let scores: number[] = [];

  // Ribcage
  if (rec.ribcageDepth) {
    const s = rec.ribcageDepth[structure.ribcageDepth];
    scores.push(s);
    if (s >= 80) advantages.push(`Cage thoracique ${structure.ribcageDepth === 'wide' ? 'profonde' : 'étroite'} avantageuse`);
    if (s <= 40) disadvantages.push(`Cage thoracique ${structure.ribcageDepth === 'wide' ? 'profonde' : 'étroite'} désavantageuse`);
  }

  // Shoulder width
  if (rec.shoulderWidth) {
    const s = rec.shoulderWidth[structure.shoulderToHip];
    scores.push(s);
    if (s >= 80) advantages.push('Largeur d\'épaules avantageuse');
    if (s <= 40) disadvantages.push('Largeur d\'épaules désavantageuse');
  }

  // Frame size
  if (rec.frameSize) {
    const s = rec.frameSize[structure.frameSize];
    scores.push(s);
  }

  const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 70;
  return { score: avgScore, advantages, disadvantages };
}

function scoreInsertions(
  insertions: InsertionsProfile,
  rec: MorphoRecommendation
): { score: number; advantages: string[]; disadvantages: string[]; hasData: boolean } {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  let scores: number[] = [];

  // Biceps
  if (rec.bicepsInsertion) {
    const s = rec.bicepsInsertion[insertions.biceps];
    scores.push(s);
    if (s >= 80) advantages.push('Insertion biceps favorable');
    if (s <= 40) disadvantages.push('Insertion biceps défavorable');
  }

  // Chest
  if (rec.chestInsertion) {
    const s = rec.chestInsertion[insertions.chest];
    scores.push(s);
    if (s >= 80) advantages.push('Insertion pectoraux favorable');
    if (s <= 40) disadvantages.push('Insertion pectoraux défavorable');
  }

  // Calves
  if (rec.calvesInsertion) {
    const s = rec.calvesInsertion[insertions.calves];
    scores.push(s);
    if (s >= 80) advantages.push('Insertion mollets favorable');
    if (s <= 40) disadvantages.push('Insertion mollets défavorable');
  }

  const hasData = scores.length > 0;
  const avgScore = hasData ? scores.reduce((a, b) => a + b, 0) / scores.length : 70;
  return { score: avgScore, advantages, disadvantages, hasData };
}

function collectTips(
  morphotype: MorphotypeResult,
  tips: MorphoRecommendation['tips'],
  modifications: string[],
  cues: string[]
): void {
  if (!tips) return;

  const { proportions, mobility } = morphotype;

  // Arm length tips
  if (proportions.armLength === 'long' && tips.longArms) {
    modifications.push(...tips.longArms);
  }
  if (proportions.armLength === 'short' && tips.shortArms) {
    modifications.push(...tips.shortArms);
  }

  // Femur length tips
  if (proportions.femurLength === 'long' && tips.longFemurs) {
    modifications.push(...tips.longFemurs);
  }
  if (proportions.femurLength === 'short' && tips.shortFemurs) {
    cues.push(...tips.shortFemurs);
  }

  // Mobility tips
  if (mobility.ankleDorsiflexion === 'limited' && tips.limitedAnkle) {
    modifications.push(...tips.limitedAnkle);
  }
  if (mobility.posteriorChain === 'limited' && tips.limitedPosterior) {
    modifications.push(...tips.limitedPosterior);
  }
  if (mobility.wristMobility !== 'none' && tips.wristValgus) {
    modifications.push(...tips.wristValgus);
  }

  // Knee valgus tips
  if (proportions.kneeValgus !== 'none' && tips.kneeValgus) {
    modifications.push(...tips.kneeValgus);
  }

  // Ribcage tips
  if (morphotype.structure.ribcageDepth === 'narrow' && tips.narrowRibcage) {
    cues.push(...tips.narrowRibcage);
  }
  if (morphotype.structure.ribcageDepth === 'wide' && tips.wideRibcage) {
    cues.push(...tips.wideRibcage);
  }
}

// =============================================================================
// EXERCISE CATEGORY DEFAULTS
// Default recommendations for exercises without specific morpho data
// =============================================================================

export const CATEGORY_DEFAULTS: Record<string, MorphoRecommendation> = {
  // Compound lower body
  squat: {
    femurLength: { short: 95, medium: 75, long: 50 },
    torsoLength: { short: 60, medium: 75, long: 85 },
    ankleMobility: { limited: 40, average: 70, good: 90 },
    tips: {
      longFemurs: ['Écarter les pieds plus large', 'Utiliser des talonnettes', 'Préférer le box squat'],
      shortFemurs: ['Position naturelle excellente', 'Peux aller plus profond'],
      limitedAnkle: ['Talonnettes obligatoires', 'Travailler la dorsiflexion'],
      kneeValgus: ['Élastique autour des genoux', 'Activation fessiers'],
    },
  },
  deadlift: {
    armLength: { short: 55, medium: 75, long: 95 },
    femurLength: { short: 70, medium: 75, long: 85 },
    torsoLength: { short: 85, medium: 75, long: 55 },
    posteriorChain: { limited: 50, average: 75, good: 90 },
    tips: {
      longArms: ['Position de départ favorable', 'Conventionnel avantageux'],
      shortArms: ['Préférer le sumo ou trap bar', 'Réduire l\'amplitude'],
      longFemurs: ['Sumo peut être plus confortable'],
    },
  },
  bench: {
    armLength: { short: 90, medium: 75, long: 50 },
    ribcageDepth: { narrow: 55, medium: 75, wide: 90 },
    shoulderWidth: { narrow: 60, medium: 75, wide: 85 },
    wristMobility: { none: 90, slight: 70, pronounced: 40 },
    tips: {
      longArms: ['Préférer haltères ou floor press', 'Arc dorsal prononcé obligatoire', 'Éviter la barre si inconfort'],
      shortArms: ['Bonne mécanique naturelle pour la barre'],
      narrowRibcage: ['Arc dorsal indispensable pour compenser', 'Haltères souvent plus confortables'],
      wideRibcage: ['Amplitude réduite naturellement - barre OK'],
      wristValgus: ['Bandes de poignets', 'Prise neutre aux haltères'],
    },
  },
  // Compound upper body
  row: {
    armLength: { short: 65, medium: 75, long: 80 },
    posteriorChain: { limited: 55, average: 75, good: 85 },
    tips: {
      limitedPosterior: ['Utiliser un appui poitrine', 'Limiter l\'inclinaison'],
    },
  },
  pullup: {
    armLength: { short: 65, medium: 75, long: 85 },
    shoulderWidth: { narrow: 70, medium: 80, wide: 90 },
    tips: {
      longArms: ['Plus grande amplitude = plus de travail'],
    },
  },
  ohp: {
    armLength: { short: 85, medium: 75, long: 60 },
    shoulderWidth: { narrow: 65, medium: 75, wide: 90 },
    wristMobility: { none: 90, slight: 70, pronounced: 50 },
    tips: {
      longArms: ['Grande amplitude - renforcer les épaules'],
      wristValgus: ['Utiliser haltères ou swiss bar'],
    },
  },
  // Isolation
  curl: {
    armLength: { short: 75, medium: 75, long: 75 },
    bicepsInsertion: { high: 90, medium: 70, low: 50 },
    wristMobility: { none: 90, slight: 70, pronounced: 40 },
    tips: {
      wristValgus: ['Barre EZ obligatoire', 'Préférer haltères ou marteau'],
    },
  },
  triceps: {
    armLength: { short: 75, medium: 75, long: 80 },
    wristMobility: { none: 90, slight: 75, pronounced: 60 },
    tips: {
      wristValgus: ['Éviter les dips lourds', 'Préférer corde ou haltères'],
    },
  },
  calf: {
    calvesInsertion: { high: 90, medium: 70, low: 45 },
    ankleMobility: { limited: 60, average: 80, good: 90 },
    tips: {},
  },
  chest: {
    armLength: { short: 85, medium: 75, long: 60 },
    chestInsertion: { high: 90, medium: 70, low: 55 },
    ribcageDepth: { narrow: 65, medium: 75, wide: 85 },
    tips: {
      longArms: ['Limiter la descente', 'Floor press pour réduire l\'amplitude'],
    },
  },
  // Specific bench variants with different scoring
  benchDumbbell: {
    armLength: { short: 80, medium: 80, long: 75 }, // More forgiving for long arms
    ribcageDepth: { narrow: 75, medium: 80, wide: 85 },
    shoulderWidth: { narrow: 70, medium: 80, wide: 85 },
    wristMobility: { none: 90, slight: 85, pronounced: 80 }, // Much better for wrist issues
    tips: {
      longArms: ['Excellente option pour bras longs', 'Amplitude personnalisable'],
      narrowRibcage: ['Meilleur choix que la barre'],
    },
  },
  floorPress: {
    armLength: { short: 70, medium: 80, long: 90 }, // Great for long arms
    ribcageDepth: { narrow: 85, medium: 80, wide: 70 },
    wristMobility: { none: 90, slight: 80, pronounced: 70 },
    tips: {
      longArms: ['Idéal - amplitude réduite naturellement'],
      narrowRibcage: ['Compense le désavantage de cage plate'],
    },
  },
  legPress: {
    femurLength: { short: 85, medium: 75, long: 70 },
    ankleMobility: { limited: 80, average: 85, good: 85 },
    tips: {
      longFemurs: ['Pieds hauts sur la plateforme', 'Moins de profondeur'],
    },
  },
  lunge: {
    femurLength: { short: 85, medium: 75, long: 60 },
    ankleMobility: { limited: 55, average: 75, good: 90 },
    tips: {
      longFemurs: ['Pas plus court', 'Attention à l\'équilibre'],
      limitedAnkle: ['Talonnette sur le pied avant'],
    },
  },
};

// Map muscle groups/exercise types to category defaults
export function getCategoryDefault(muscleGroup: string, exerciseName: string): MorphoRecommendation | null {
  const name = exerciseName.toLowerCase();

  // Specific exercise variants FIRST (more specific matches)
  // Bench variants - order matters!
  if (name.includes('floor press')) return CATEGORY_DEFAULTS.floorPress;
  if ((name.includes('développé') || name.includes('bench')) && (name.includes('haltère') || name.includes('dumbbell'))) {
    return CATEGORY_DEFAULTS.benchDumbbell;
  }
  if (name.includes('bench') || name.includes('développé couché')) return CATEGORY_DEFAULTS.bench;

  // Squat variants
  if (name.includes('squat')) return CATEGORY_DEFAULTS.squat;

  // Deadlift variants
  if (name.includes('deadlift') || name.includes('soulevé')) return CATEGORY_DEFAULTS.deadlift;

  // Other compounds
  if (name.includes('row') || name.includes('tirage')) return CATEGORY_DEFAULTS.row;
  if (name.includes('pull-up') || name.includes('traction')) return CATEGORY_DEFAULTS.pullup;
  if (name.includes('overhead') || name.includes('militaire') || name.includes('développé épaules')) return CATEGORY_DEFAULTS.ohp;

  // Isolation
  if (name.includes('curl') && !name.includes('leg curl')) return CATEGORY_DEFAULTS.curl;
  if (name.includes('triceps') || name.includes('extension bras')) return CATEGORY_DEFAULTS.triceps;
  if (name.includes('mollet') || name.includes('calf')) return CATEGORY_DEFAULTS.calf;
  if (name.includes('pec') || name.includes('fly') || name.includes('écarté')) return CATEGORY_DEFAULTS.chest;
  if (name.includes('leg press') || name.includes('presse à cuisses')) return CATEGORY_DEFAULTS.legPress;
  if (name.includes('fente') || name.includes('lunge')) return CATEGORY_DEFAULTS.lunge;

  // Muscle group fallbacks
  const group = muscleGroup.toLowerCase();
  if (group.includes('quadriceps') || group.includes('jambes')) return CATEGORY_DEFAULTS.squat;
  if (group.includes('dos')) return CATEGORY_DEFAULTS.row;
  if (group.includes('pec') || group.includes('poitrine')) return CATEGORY_DEFAULTS.chest;
  if (group.includes('biceps')) return CATEGORY_DEFAULTS.curl;
  if (group.includes('triceps')) return CATEGORY_DEFAULTS.triceps;
  if (group.includes('épaules') || group.includes('delto')) return CATEGORY_DEFAULTS.ohp;
  if (group.includes('mollets')) return CATEGORY_DEFAULTS.calf;
  if (group.includes('ischio')) return CATEGORY_DEFAULTS.deadlift;

  return null;
}

// =============================================================================
// SCORE COLOR HELPERS
// =============================================================================

export function getScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Très bon';
  if (score >= 60) return 'Bon';
  if (score >= 45) return 'Moyen';
  if (score >= 30) return 'Difficile';
  return 'Déconseillé';
}

export function getScoreEmoji(score: number): string {
  if (score >= 85) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}
