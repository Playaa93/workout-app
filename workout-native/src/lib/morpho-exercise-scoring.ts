// Morpho-Exercise Scoring Engine - ported from web app
// Pure calculation functions, no DB dependency

import type {
  MorphotypeResult,
  ProportionsProfile,
  MobilityProfile,
  StructureProfile,
  InsertionsProfile,
} from './morphology-types';

export type ExerciseScore = {
  score: number;
  advantages: string[];
  disadvantages: string[];
  modifications: string[];
  cues: string[];
};

export type MorphoRecommendation = {
  armLength?: { short: number; medium: number; long: number };
  femurLength?: { short: number; medium: number; long: number };
  torsoLength?: { short: number; medium: number; long: number };
  ankleMobility?: { limited: number; average: number; good: number };
  posteriorChain?: { limited: number; average: number; good: number };
  wristMobility?: { none: number; slight: number; pronounced: number };
  ribcageDepth?: { narrow: number; medium: number; wide: number };
  shoulderWidth?: { narrow: number; medium: number; wide: number };
  frameSize?: { fine: number; medium: number; large: number };
  bicepsInsertion?: { high: number; medium: number; low: number };
  chestInsertion?: { high: number; medium: number; low: number };
  calvesInsertion?: { high: number; medium: number; low: number };
  metabolism?: { fast: number; balanced: number; slow: number };
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

const WEIGHTS = {
  proportions: 0.40,
  mobility: 0.25,
  structure: 0.20,
  insertions: 0.10,
  metabolism: 0.05,
};

export function scoreExercise(
  morphotype: MorphotypeResult,
  recommendation: MorphoRecommendation | null
): ExerciseScore {
  if (!recommendation) {
    return { score: 70, advantages: [], disadvantages: [], modifications: [], cues: [] };
  }

  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const modifications: string[] = [];
  const cues: string[] = [];

  let totalScore = 0;
  let totalWeight = 0;

  const proportionsResult = scoreProportions(morphotype.proportions, recommendation);
  totalScore += proportionsResult.score * WEIGHTS.proportions;
  totalWeight += WEIGHTS.proportions;
  advantages.push(...proportionsResult.advantages);
  disadvantages.push(...proportionsResult.disadvantages);

  const mobilityResult = scoreMobility(morphotype.mobility, recommendation);
  totalScore += mobilityResult.score * WEIGHTS.mobility;
  totalWeight += WEIGHTS.mobility;
  advantages.push(...mobilityResult.advantages);
  disadvantages.push(...mobilityResult.disadvantages);

  const structureResult = scoreStructure(morphotype.structure, recommendation);
  totalScore += structureResult.score * WEIGHTS.structure;
  totalWeight += WEIGHTS.structure;
  advantages.push(...structureResult.advantages);
  disadvantages.push(...structureResult.disadvantages);

  const insertionsResult = scoreInsertions(morphotype.insertions, recommendation);
  if (insertionsResult.hasData) {
    totalScore += insertionsResult.score * WEIGHTS.insertions;
    totalWeight += WEIGHTS.insertions;
    advantages.push(...insertionsResult.advantages);
    disadvantages.push(...insertionsResult.disadvantages);
  }

  if (recommendation.tips) {
    collectTips(morphotype, recommendation.tips, modifications, cues);
  }

  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 70;

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    advantages: [...new Set(advantages)],
    disadvantages: [...new Set(disadvantages)],
    modifications: [...new Set(modifications)],
    cues: [...new Set(cues)],
  };
}

function scoreProportions(
  proportions: ProportionsProfile,
  rec: MorphoRecommendation
): { score: number; advantages: string[]; disadvantages: string[] } {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const scores: number[] = [];

  if (rec.armLength) {
    const s = rec.armLength[proportions.armLength];
    scores.push(s);
    if (s >= 80) advantages.push(`Bras ${proportions.armLength === 'long' ? 'longs' : proportions.armLength === 'short' ? 'courts' : 'moyens'} avantageux`);
    if (s <= 40) disadvantages.push(`Bras ${proportions.armLength === 'long' ? 'longs' : proportions.armLength === 'short' ? 'courts' : 'moyens'} desavantageux`);
  }

  if (rec.femurLength) {
    const s = rec.femurLength[proportions.femurLength];
    scores.push(s);
    if (s >= 80) advantages.push(`Femurs ${proportions.femurLength === 'long' ? 'longs' : proportions.femurLength === 'short' ? 'courts' : 'moyens'} avantageux`);
    if (s <= 40) disadvantages.push(`Femurs ${proportions.femurLength === 'long' ? 'longs' : proportions.femurLength === 'short' ? 'courts' : 'moyens'} desavantageux`);
  }

  if (rec.torsoLength) {
    const s = rec.torsoLength[proportions.torsoLength];
    scores.push(s);
    if (s >= 80) advantages.push(`Torse ${proportions.torsoLength === 'long' ? 'long' : proportions.torsoLength === 'short' ? 'court' : 'moyen'} avantageux`);
    if (s <= 40) disadvantages.push(`Torse ${proportions.torsoLength === 'long' ? 'long' : proportions.torsoLength === 'short' ? 'court' : 'moyen'} desavantageux`);
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
  const scores: number[] = [];

  if (rec.ankleMobility) {
    const s = rec.ankleMobility[mobility.ankleDorsiflexion];
    scores.push(s);
    if (s >= 80) advantages.push('Bonne mobilite de cheville');
    if (s <= 40) disadvantages.push('Mobilite de cheville limitee');
  }

  if (rec.posteriorChain) {
    const s = rec.posteriorChain[mobility.posteriorChain];
    scores.push(s);
    if (s >= 80) advantages.push('Bonne souplesse ischio-jambiers');
    if (s <= 40) disadvantages.push('Ischio-jambiers raides');
  }

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
  const scores: number[] = [];

  if (rec.ribcageDepth) {
    const s = rec.ribcageDepth[structure.ribcageDepth];
    scores.push(s);
    if (s >= 80) advantages.push(`Cage thoracique ${structure.ribcageDepth === 'wide' ? 'profonde' : 'etroite'} avantageuse`);
    if (s <= 40) disadvantages.push(`Cage thoracique ${structure.ribcageDepth === 'wide' ? 'profonde' : 'etroite'} desavantageuse`);
  }

  if (rec.shoulderWidth) {
    const s = rec.shoulderWidth[structure.shoulderToHip];
    scores.push(s);
    if (s >= 80) advantages.push("Largeur d'epaules avantageuse");
    if (s <= 40) disadvantages.push("Largeur d'epaules desavantageuse");
  }

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
  const scores: number[] = [];

  if (rec.bicepsInsertion) {
    const s = rec.bicepsInsertion[insertions.biceps];
    scores.push(s);
    if (s >= 80) advantages.push('Insertion biceps favorable');
    if (s <= 40) disadvantages.push('Insertion biceps defavorable');
  }

  if (rec.chestInsertion) {
    const s = rec.chestInsertion[insertions.chest];
    scores.push(s);
    if (s >= 80) advantages.push('Insertion pectoraux favorable');
    if (s <= 40) disadvantages.push('Insertion pectoraux defavorable');
  }

  if (rec.calvesInsertion) {
    const s = rec.calvesInsertion[insertions.calves];
    scores.push(s);
    if (s >= 80) advantages.push('Insertion mollets favorable');
    if (s <= 40) disadvantages.push('Insertion mollets defavorable');
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

  if (proportions.armLength === 'long' && tips.longArms) modifications.push(...tips.longArms);
  if (proportions.armLength === 'short' && tips.shortArms) modifications.push(...tips.shortArms);
  if (proportions.femurLength === 'long' && tips.longFemurs) modifications.push(...tips.longFemurs);
  if (proportions.femurLength === 'short' && tips.shortFemurs) cues.push(...tips.shortFemurs);
  if (mobility.ankleDorsiflexion === 'limited' && tips.limitedAnkle) modifications.push(...tips.limitedAnkle);
  if (mobility.posteriorChain === 'limited' && tips.limitedPosterior) modifications.push(...tips.limitedPosterior);
  if (mobility.wristMobility !== 'none' && tips.wristValgus) modifications.push(...tips.wristValgus);
  if (proportions.kneeValgus !== 'none' && tips.kneeValgus) modifications.push(...tips.kneeValgus);
  if (morphotype.structure.ribcageDepth === 'narrow' && tips.narrowRibcage) cues.push(...tips.narrowRibcage);
  if (morphotype.structure.ribcageDepth === 'wide' && tips.wideRibcage) cues.push(...tips.wideRibcage);
}

export function getScoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 75) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Tres bon';
  if (score >= 60) return 'Bon';
  if (score >= 45) return 'Moyen';
  if (score >= 30) return 'Difficile';
  return 'Deconseille';
}
