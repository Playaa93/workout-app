'use server';

import { db, morphoProfiles } from '@/db';
import { eq } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';
import type {
  MorphoQuestion,
  FrameSize,
  SegmentLength,
  SegmentWidth,
  InsertionPotential,
  MobilityLevel,
  ValgusLevel,
  MetabolismType,
  StructureProfile,
  ProportionsProfile,
  MobilityProfile,
  InsertionsProfile,
  MetabolismProfile,
  ExerciseRecommendation,
  MobilityWork,
  MorphotypeResult,
} from './types';

// =============================================================================
// QUESTIONS (16 questions en 5 blocs)
// =============================================================================

const MORPHO_QUESTIONS: MorphoQuestion[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BLOC 1 : STRUCTURE OSSEUSE (3 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'q1',
    questionKey: 'wrist_circumference',
    questionTextFr: 'Mesure ton tour de poignet (au plus fin, sous l\'os). Si tu n\'as pas de mètre, entoure ton poignet avec ton pouce et majeur.',
    questionType: 'single_choice',
    category: 'structure',
    helpText: 'Indique ta structure osseuse (frame)',
    options: [
      { label: '< 16 cm (ou doigts se chevauchent)', value: 'fine', description: 'Ossature fine' },
      { label: '16-18 cm (ou doigts se touchent)', value: 'medium', description: 'Ossature moyenne' },
      { label: '> 18 cm (ou doigts ne se touchent pas)', value: 'large', description: 'Ossature large' },
    ],
    orderIndex: 1,
  },
  {
    id: 'q2',
    questionKey: 'shoulder_hip_ratio',
    questionTextFr: 'De face dans un miroir, comment sont tes épaules par rapport à tes hanches ?',
    questionType: 'single_choice',
    category: 'structure',
    helpText: 'Structure du haut du corps',
    options: [
      { label: 'Épaules nettement plus larges (forme en V)', value: 'wide', description: 'Avantage pressing' },
      { label: 'Épaules légèrement plus larges ou égales', value: 'medium', description: 'Équilibré' },
      { label: 'Hanches aussi larges ou plus larges', value: 'narrow', description: 'Travailler les épaules' },
    ],
    orderIndex: 2,
  },
  {
    id: 'q3',
    questionKey: 'ribcage_depth',
    questionTextFr: 'De profil, comment est ta cage thoracique ?',
    questionType: 'single_choice',
    category: 'structure',
    helpText: 'Impacte le développé couché',
    options: [
      { label: 'Cage profonde et bombée (thorax épais)', value: 'wide', description: 'Avantage bench' },
      { label: 'Cage moyenne', value: 'medium', description: 'Standard' },
      { label: 'Cage plate et étroite', value: 'narrow', description: 'Grande amplitude bench' },
    ],
    orderIndex: 3,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOC 2 : PROPORTIONS SEGMENTAIRES (4 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'q4',
    questionKey: 'torso_length',
    questionTextFr: 'Assis sur une chaise à côté de quelqu\'un de même taille que toi debout, comment est ton buste ?',
    questionType: 'single_choice',
    category: 'proportions',
    helpText: 'Ratio torse/jambes',
    options: [
      { label: 'Mon buste est plus bas (j\'ai les jambes longues)', value: 'short', description: 'Torse court' },
      { label: 'On est à peu près au même niveau', value: 'medium', description: 'Équilibré' },
      { label: 'Mon buste est plus haut (j\'ai le torse long)', value: 'long', description: 'Torse long' },
    ],
    orderIndex: 4,
  },
  {
    id: 'q5',
    questionKey: 'arm_length',
    questionTextFr: 'Écarte les bras en croix (comme un T). Demande à quelqu\'un de mesurer la distance entre tes deux majeurs. Compare ce chiffre à ta taille.',
    questionType: 'single_choice',
    category: 'proportions',
    helpText: 'Ex: taille 175cm, distance bras 180cm = bras longs',
    options: [
      { label: 'Distance bras < taille (bras courts)', value: 'short', description: 'Avantage bench' },
      { label: 'Distance bras = taille (± 2cm)', value: 'medium', description: 'Standard' },
      { label: 'Distance bras > taille (bras longs)', value: 'long', description: 'Avantage deadlift' },
    ],
    orderIndex: 5,
  },
  {
    id: 'q6',
    questionKey: 'femur_length',
    questionTextFr: 'Fais un squat profond pieds à plat, sans charge. Que se passe-t-il naturellement ?',
    questionType: 'single_choice',
    category: 'proportions',
    helpText: 'Longueur des fémurs',
    options: [
      { label: 'Je descends facilement, dos droit, talons au sol', value: 'short', description: 'Fémurs courts = squat facile' },
      { label: 'Position correcte avec légère inclinaison du buste', value: 'medium', description: 'Fémurs moyens' },
      { label: 'Mes talons se lèvent ou je penche beaucoup en avant', value: 'long', description: 'Fémurs longs = squat difficile' },
    ],
    orderIndex: 6,
  },
  {
    id: 'q7',
    questionKey: 'knee_valgus',
    questionTextFr: 'Quand tu fais un squat ou que tu te relèves d\'une chaise, tes genoux ont tendance à :',
    questionType: 'single_choice',
    category: 'proportions',
    helpText: 'Valgus du genou (genoux vers l\'intérieur)',
    options: [
      { label: 'Rester bien alignés avec les pieds', value: 'none', description: 'Bon tracking' },
      { label: 'Rentrer légèrement vers l\'intérieur', value: 'slight', description: 'Valgus léger - renforcer fessiers' },
      { label: 'Rentrer nettement vers l\'intérieur', value: 'pronounced', description: 'Valgus prononcé - travail correctif' },
    ],
    orderIndex: 7,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOC 3 : MOBILITÉ (3 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'q8',
    questionKey: 'ankle_mobility',
    questionTextFr: 'Test du genou au mur : pied à 10cm du mur, peux-tu toucher le mur avec ton genou sans lever le talon ?',
    questionType: 'single_choice',
    category: 'mobility',
    helpText: 'Dorsiflexion de cheville - crucial pour le squat',
    options: [
      { label: 'Oui facilement, je peux même reculer le pied', value: 'good', description: 'Bonne mobilité' },
      { label: 'Oui mais c\'est juste', value: 'average', description: 'Mobilité correcte' },
      { label: 'Non, mon talon se lève ou je n\'atteins pas', value: 'limited', description: 'Mobilité limitée - travail requis' },
    ],
    orderIndex: 8,
  },
  {
    id: 'q9',
    questionKey: 'posterior_chain',
    questionTextFr: 'Debout, jambes tendues, essaie de toucher tes orteils :',
    questionType: 'single_choice',
    category: 'mobility',
    helpText: 'Souplesse ischio-jambiers et chaîne postérieure',
    options: [
      { label: 'Je touche facilement mes orteils ou au-delà', value: 'good', description: 'Bonne souplesse' },
      { label: 'J\'arrive aux chevilles ou orteils', value: 'average', description: 'Souplesse moyenne' },
      { label: 'J\'arrive aux tibias ou plus haut', value: 'limited', description: 'Souplesse limitée' },
    ],
    orderIndex: 9,
  },
  {
    id: 'q10',
    questionKey: 'wrist_mobility',
    questionTextFr: 'Mets-toi en position de développé couché (ou pompe) bras tendus. Regarde tes poignets de face : sont-ils alignés avec tes coudes et épaules ?',
    questionType: 'single_choice',
    category: 'mobility',
    helpText: 'Valgus des poignets - impact sur les exercices de poussée',
    options: [
      { label: 'Oui, poignets bien droits dans l\'axe', value: 'none', description: 'Bon alignement' },
      { label: 'Légèrement inclinés vers l\'intérieur ou l\'extérieur', value: 'slight', description: 'Valgus léger' },
      { label: 'Nettement désaxés, inconfort ou douleur', value: 'pronounced', description: 'Valgus prononcé - barre droite déconseillée' },
    ],
    orderIndex: 10,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOC 4 : INSERTIONS MUSCULAIRES (3 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'q11',
    questionKey: 'biceps_insertion',
    questionTextFr: 'Contracte ton biceps à 90°. Combien de doigts entre le pli du coude et le début du muscle ?',
    questionType: 'single_choice',
    category: 'insertions',
    helpText: 'Test d\'insertion du biceps (méthode Delavier)',
    options: [
      { label: '0-1 doigt (muscle proche du coude)', value: 'high', description: 'Excellent potentiel biceps' },
      { label: '1-2 doigts', value: 'medium', description: 'Potentiel moyen' },
      { label: '2+ doigts (grand espace)', value: 'low', description: 'Potentiel limité mais meilleur "pic"' },
    ],
    orderIndex: 11,
  },
  {
    id: 'q12',
    questionKey: 'calf_insertion',
    questionTextFr: 'Regarde tes mollets de profil. Le muscle descend :',
    questionType: 'single_choice',
    category: 'insertions',
    helpText: 'Insertion des mollets',
    options: [
      { label: 'Bas, proche du talon d\'Achille', value: 'high', description: 'Fort potentiel mollets' },
      { label: 'À mi-chemin', value: 'medium', description: 'Potentiel moyen' },
      { label: 'Haut, loin du talon ("mollet de coq")', value: 'low', description: 'Développement plus difficile' },
    ],
    orderIndex: 12,
  },
  {
    id: 'q13',
    questionKey: 'chest_insertion',
    questionTextFr: 'Contracte tes pectoraux. L\'écart entre les deux pecs au niveau du sternum :',
    questionType: 'single_choice',
    category: 'insertions',
    helpText: 'Insertion des pectoraux',
    options: [
      { label: 'Très peu d\'écart, les pecs se touchent presque', value: 'high', description: 'Pecs complets' },
      { label: 'Écart moyen (2-3 cm)', value: 'medium', description: 'Standard' },
      { label: 'Grand écart, pecs bien séparés', value: 'low', description: 'Intérieur plus difficile' },
    ],
    orderIndex: 13,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOC 5 : MÉTABOLISME & EXPÉRIENCE (3 questions)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'q14',
    questionKey: 'weight_tendency',
    questionTextFr: 'Si tu manges plus que d\'habitude pendant 2 semaines :',
    questionType: 'single_choice',
    category: 'metabolism',
    helpText: 'Tendance métabolique',
    options: [
      { label: 'Je ne prends quasiment pas de poids', value: 'fast', description: 'Métabolisme rapide (ecto)' },
      { label: 'Je prends un peu, mix muscle et gras', value: 'balanced', description: 'Métabolisme équilibré (méso)' },
      { label: 'Je stocke facilement, surtout au ventre', value: 'slow', description: 'Métabolisme lent (endo)' },
    ],
    orderIndex: 14,
  },
  {
    id: 'q15',
    questionKey: 'natural_strength',
    questionTextFr: 'AVANT de faire de la musculation, tu étais naturellement :',
    questionType: 'single_choice',
    category: 'metabolism',
    helpText: 'Force de base naturelle',
    options: [
      { label: 'Plutôt faible, peu de force', value: 'low', description: 'Focus technique d\'abord' },
      { label: 'Dans la moyenne', value: 'average', description: 'Progression standard' },
      { label: 'Naturellement costaud/fort', value: 'high', description: 'Peut charger plus vite' },
    ],
    orderIndex: 15,
  },
  {
    id: 'q16',
    questionKey: 'best_responders',
    questionTextFr: 'Quels muscles semblent répondre le mieux à ton entraînement ?',
    questionType: 'single_choice',
    category: 'metabolism',
    helpText: 'Identifier tes points forts génétiques',
    options: [
      { label: 'Dos et épaules', value: 'back_shoulders', description: 'Pulling movements' },
      { label: 'Pectoraux et bras', value: 'chest_arms', description: 'Pushing movements' },
      { label: 'Jambes (quadriceps, fessiers)', value: 'legs', description: 'Lower body' },
      { label: 'Tout est difficile / Je débute', value: 'none', description: 'Travail global nécessaire' },
    ],
    orderIndex: 16,
  },
];

// =============================================================================
// EXPORTED FUNCTIONS
// =============================================================================

export async function getMorphoQuestions(): Promise<MorphoQuestion[]> {
  return MORPHO_QUESTIONS;
}

export async function calculateMorphotype(answers: Record<string, string>): Promise<MorphotypeResult> {
  // Extract profiles from answers
  const structure = extractStructure(answers);
  const proportions = extractProportions(answers);
  const mobility = extractMobility(answers);
  const insertions = extractInsertions(answers);
  const metabolism = extractMetabolism(answers);

  // Determine global type
  const globalType = determineGlobalType(proportions);

  // Generate exercise recommendations
  const squat = generateSquatRecommendation(proportions, mobility, structure);
  const deadlift = generateDeadliftRecommendation(proportions, structure);
  const bench = generateBenchRecommendation(proportions, structure, mobility);
  const curls = generateCurlsRecommendation(insertions, mobility);
  const mobilityWork = generateMobilityWork(mobility, proportions);

  // Generate legacy fields
  const { primary, scores } = determineSomatotype(metabolism, structure);
  const strengths = generateStrengths(structure, proportions, insertions, metabolism);
  const weaknesses = generateWeaknesses(structure, proportions, insertions, mobility);
  const recommendedExercises = [...squat.variants.slice(0, 2), ...deadlift.variants.slice(0, 2), ...bench.variants.slice(0, 2)];
  const exercisesToAvoid = [
    ...squat.disadvantages.length > 1 ? ['Squat ATG lourd'] : [],
    ...bench.disadvantages.length > 1 ? ['Bench prise très large'] : [],
  ];

  return {
    globalType,
    structure,
    proportions,
    mobility,
    insertions,
    metabolism,
    squat,
    deadlift,
    bench,
    curls,
    mobilityWork,
    primary,
    secondary: null,
    scores,
    strengths,
    weaknesses,
    recommendedExercises,
    exercisesToAvoid,
  };
}

export async function saveMorphoProfile(answers: Record<string, string>, result: MorphotypeResult) {
  const userId = await requireUserId();

  await db
    .insert(morphoProfiles)
    .values({
      userId,
      primaryMorphotype: result.primary,
      secondaryMorphotype: null,
      morphotypeScore: {
        ...result.scores,
        globalType: result.globalType,
        structure: result.structure,
        proportions: result.proportions,
        mobility: result.mobility,
        insertions: result.insertions,
        metabolism: result.metabolism,
      },
      torsoProportion: result.proportions.torsoLength,
      armProportion: result.proportions.armLength,
      legProportion: result.proportions.femurLength,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendedExercises: result.recommendedExercises,
      exercisesToAvoid: result.exercisesToAvoid,
      questionnaireResponses: answers,
    })
    .onConflictDoUpdate({
      target: morphoProfiles.userId,
      set: {
        primaryMorphotype: result.primary,
        morphotypeScore: {
          ...result.scores,
          globalType: result.globalType,
          structure: result.structure,
          proportions: result.proportions,
          mobility: result.mobility,
          insertions: result.insertions,
          metabolism: result.metabolism,
        },
        torsoProportion: result.proportions.torsoLength,
        armProportion: result.proportions.armLength,
        legProportion: result.proportions.femurLength,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendedExercises: result.recommendedExercises,
        exercisesToAvoid: result.exercisesToAvoid,
        questionnaireResponses: answers,
        updatedAt: new Date(),
      },
    });

  return { success: true };
}

export async function getMorphoProfile() {
  const userId = await requireUserId();

  const profile = await db
    .select()
    .from(morphoProfiles)
    .where(eq(morphoProfiles.userId, userId))
    .limit(1);

  return profile[0] || null;
}

// =============================================================================
// EXTRACTION FUNCTIONS
// =============================================================================

function extractStructure(answers: Record<string, string>): StructureProfile {
  return {
    frameSize: (answers.wrist_circumference as FrameSize) || 'medium',
    shoulderToHip: (answers.shoulder_hip_ratio as SegmentWidth) || 'medium',
    ribcageDepth: (answers.ribcage_depth as SegmentWidth) || 'medium',
  };
}

function extractProportions(answers: Record<string, string>): ProportionsProfile {
  return {
    torsoLength: (answers.torso_length as SegmentLength) || 'medium',
    armLength: (answers.arm_length as SegmentLength) || 'medium',
    femurLength: (answers.femur_length as SegmentLength) || 'medium',
    kneeValgus: (answers.knee_valgus as ValgusLevel) || 'none',
  };
}

function extractMobility(answers: Record<string, string>): MobilityProfile {
  return {
    ankleDorsiflexion: (answers.ankle_mobility as MobilityLevel) || 'average',
    posteriorChain: (answers.posterior_chain as MobilityLevel) || 'average',
    wristMobility: (answers.wrist_mobility as ValgusLevel) || 'none',
  };
}

function extractInsertions(answers: Record<string, string>): InsertionsProfile {
  return {
    biceps: (answers.biceps_insertion as InsertionPotential) || 'medium',
    calves: (answers.calf_insertion as InsertionPotential) || 'medium',
    chest: (answers.chest_insertion as InsertionPotential) || 'medium',
  };
}

function extractMetabolism(answers: Record<string, string>): MetabolismProfile {
  return {
    weightTendency: (answers.weight_tendency as MetabolismType) || 'balanced',
    naturalStrength: (answers.natural_strength as 'low' | 'average' | 'high') || 'average',
    bestResponders: answers.best_responders || 'none',
  };
}

// =============================================================================
// CLASSIFICATION FUNCTIONS
// =============================================================================

function determineGlobalType(proportions: ProportionsProfile): 'longiligne' | 'breviligne' | 'balanced' {
  const longCount = [proportions.torsoLength, proportions.armLength, proportions.femurLength]
    .filter(v => v === 'long').length;
  const shortCount = [proportions.torsoLength, proportions.armLength, proportions.femurLength]
    .filter(v => v === 'short').length;

  if (longCount >= 2) return 'longiligne';
  if (shortCount >= 2) return 'breviligne';
  return 'balanced';
}

function determineSomatotype(metabolism: MetabolismProfile, structure: StructureProfile): {
  primary: 'ectomorph' | 'mesomorph' | 'endomorph' | 'ecto_meso' | 'meso_endo' | 'ecto_endo';
  scores: { ecto: number; meso: number; endo: number };
} {
  const scores = { ecto: 0, meso: 0, endo: 0 };

  // Frame size
  if (structure.frameSize === 'fine') scores.ecto += 2;
  else if (structure.frameSize === 'large') { scores.endo += 1; scores.meso += 1; }
  else scores.meso += 1;

  // Shoulders
  if (structure.shoulderToHip === 'wide') scores.meso += 2;
  else if (structure.shoulderToHip === 'narrow') scores.ecto += 1;

  // Weight tendency
  if (metabolism.weightTendency === 'fast') scores.ecto += 3;
  else if (metabolism.weightTendency === 'slow') scores.endo += 3;
  else scores.meso += 2;

  // Strength
  if (metabolism.naturalStrength === 'high') scores.meso += 2;
  else if (metabolism.naturalStrength === 'low') scores.ecto += 1;

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const primaryKey = sorted[0][0] as 'ecto' | 'meso' | 'endo';

  const map: Record<string, 'ectomorph' | 'mesomorph' | 'endomorph'> = {
    ecto: 'ectomorph',
    meso: 'mesomorph',
    endo: 'endomorph',
  };

  return { primary: map[primaryKey], scores };
}

// =============================================================================
// RECOMMENDATION GENERATORS
// =============================================================================

function generateSquatRecommendation(
  proportions: ProportionsProfile,
  mobility: MobilityProfile,
  structure: StructureProfile
): ExerciseRecommendation {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const tips: string[] = [];

  // Analyze limiting factors
  const longFemurs = proportions.femurLength === 'long';
  const shortFemurs = proportions.femurLength === 'short';
  const limitedAnkle = mobility.ankleDorsiflexion === 'limited';
  const kneeValgus = proportions.kneeValgus !== 'none';
  const severeValgus = proportions.kneeValgus === 'pronounced';
  const longTorso = proportions.torsoLength === 'long';

  // Count disadvantages for free squat
  const freeSquatIssues = [longFemurs, limitedAnkle, severeValgus].filter(Boolean).length;

  // Advantages
  if (shortFemurs) advantages.push('Fémurs courts = biomécanique idéale');
  if (longTorso) advantages.push('Torse long = bon levier');

  // Disadvantages
  if (longFemurs) {
    disadvantages.push('Fémurs longs = inclinaison du buste importante');
    tips.push('Écarter les pieds en stance large');
  }
  if (limitedAnkle) {
    disadvantages.push('Mobilité cheville limitée');
    tips.push('Talonnettes obligatoires', 'Travailler la dorsiflexion quotidiennement');
  }
  if (severeValgus) {
    disadvantages.push('Valgus prononcé = risque blessure');
    tips.push('Élastique autour des genoux', 'Renforcer fessiers avant de charger lourd');
  } else if (kneeValgus) {
    tips.push('Attention au tracking des genoux', 'Activation fessiers en échauffement');
  }

  // Build variants based on suitability (best first, never recommend unsuitable)
  const variants: string[] = [];

  if (freeSquatIssues >= 2) {
    // Multiple issues = avoid free squat, prioritize machines
    variants.push('Hack squat machine', 'Leg press pieds hauts', 'Belt squat');
    if (longFemurs && !severeValgus) variants.push('Box squat');
  } else if (longFemurs) {
    // Long femurs only = modified free squat OK
    variants.push('Box squat', 'Hack squat', 'Squat stance large');
    if (!limitedAnkle) variants.push('Safety bar squat');
  } else if (limitedAnkle) {
    // Ankle only = heeled squat OK
    variants.push('Back squat avec talonnettes', 'Hack squat', 'Goblet squat surélevé');
  } else if (shortFemurs) {
    // Ideal proportions
    variants.push('Back squat classique', 'Front squat', 'Squat ATG');
  } else {
    // Average - most options work
    variants.push('Back squat', 'Goblet squat', 'Front squat');
  }

  return { exercise: 'Squat', advantages, disadvantages, variants, tips };
}

function generateDeadliftRecommendation(
  proportions: ProportionsProfile,
  structure: StructureProfile
): ExerciseRecommendation {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const tips: string[] = [];

  // Analyze factors
  const longArms = proportions.armLength === 'long';
  const shortArms = proportions.armLength === 'short';
  const longFemurs = proportions.femurLength === 'long';
  const shortFemurs = proportions.femurLength === 'short';
  const longTorso = proportions.torsoLength === 'long';
  const shortTorso = proportions.torsoLength === 'short';

  // Count risk factors for conventional deadlift from floor
  const deadliftRiskFactors = [longTorso, shortArms, longFemurs && longTorso].filter(Boolean).length;

  // Advantages
  if (longArms) advantages.push('Bras longs = amplitude réduite');
  if (shortTorso) advantages.push('Torse court = moins de stress lombaire');
  if (longFemurs && !longTorso) advantages.push('Fémurs longs = levier favorable en sumo');
  if (shortFemurs && !shortArms) advantages.push('Position de départ basse naturelle');

  // Disadvantages
  if (shortArms) {
    disadvantages.push('Bras courts = amplitude augmentée');
  }
  if (longTorso) {
    disadvantages.push('Torse long = stress lombaire augmenté');
    tips.push('Gainage strict obligatoire');
  }
  if (longTorso && shortArms) {
    disadvantages.push('Combinaison défavorable pour le deadlift');
  }

  // Build variants based on severity
  const variants: string[] = [];

  if (deadliftRiskFactors >= 2) {
    // High risk profile - prioritize alternatives to classic deadlift
    tips.push('Le deadlift classique n\'est pas idéal pour toi');
    tips.push('Privilégie les alternatives ci-dessous');

    variants.push('Romanian deadlift (RDL)'); // Less lower back stress
    variants.push('Trap bar (poignées hautes)'); // Reduced ROM
    variants.push('Hip thrust'); // Posterior chain without spinal load
    variants.push('Tirage rack (au-dessus du genou)'); // Partial ROM

    if (longFemurs && !shortArms) {
      variants.push('Sumo (si mobilité hanches OK)');
    }
  } else if (longTorso) {
    // Moderate risk - modified deadlifts OK
    tips.push('Éviter les charges maximales en conventionnel');

    variants.push('Trap bar');
    variants.push('Sumo');
    variants.push('RDL');
    if (longArms) variants.push('Conventionnel (charges modérées)');
  } else if (shortArms) {
    // Short arms only - sumo/trap bar preferred
    tips.push('Sumo ou trap bar réduisent l\'amplitude');

    variants.push('Sumo');
    variants.push('Trap bar');
    if (shortFemurs) variants.push('Conventionnel');
  } else {
    // Favorable or neutral profile
    if (longArms && shortTorso) {
      tips.push('Excellent profil pour le deadlift conventionnel');
      variants.push('Conventionnel');
      variants.push('Sumo');
      variants.push('Déficit deadlift');
    } else if (longFemurs) {
      tips.push('Le sumo exploite tes fémurs longs');
      variants.push('Sumo');
      variants.push('Conventionnel');
    } else {
      variants.push('Conventionnel');
      variants.push('Sumo');
      variants.push('Trap bar');
    }
  }

  return { exercise: 'Soulevé de terre', advantages, disadvantages, variants, tips };
}

function generateBenchRecommendation(
  proportions: ProportionsProfile,
  structure: StructureProfile,
  mobility: MobilityProfile
): ExerciseRecommendation {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const variants: string[] = [];
  const tips: string[] = [];

  // Determine if barbell is suitable
  const longArms = proportions.armLength === 'long';
  const narrowRibcage = structure.ribcageDepth === 'narrow';
  const wristIssues = mobility.wristMobility !== 'none';

  // Arm length
  if (proportions.armLength === 'short') {
    advantages.push('Bras courts = course réduite');
  } else if (proportions.armLength === 'long') {
    disadvantages.push('Bras longs = grande amplitude');
    tips.push('Arc dorsal prononcé pour réduire l\'amplitude');
  }

  // Ribcage
  if (structure.ribcageDepth === 'wide') {
    advantages.push('Cage profonde = barre plus proche au départ');
  } else if (structure.ribcageDepth === 'narrow') {
    disadvantages.push('Cage plate = amplitude augmentée');
    tips.push('Arc dorsal indispensable pour compenser');
  }

  // Shoulders
  if (structure.shoulderToHip === 'wide') {
    advantages.push('Épaules larges = bonne base de poussée');
  } else if (structure.shoulderToHip === 'narrow') {
    disadvantages.push('Épaules étroites = moins de stabilité');
    tips.push('Renforcer les deltoïdes latéraux');
  }

  // Wrist mobility/valgus
  if (mobility.wristMobility === 'pronounced') {
    disadvantages.push('Valgus poignets = stress articulaire');
    tips.push('Bandes de poignets obligatoires', 'Haltères en prise neutre recommandées');
  } else if (mobility.wristMobility === 'slight') {
    tips.push('Vérifier l\'alignement poignets-coudes-épaules');
  }

  // Build variants based on suitability (best first)
  if (longArms) {
    variants.push('Floor press'); // Best for long arms
    variants.push('Développé haltères'); // Good for long arms
    if (!narrowRibcage && !wristIssues) {
      variants.push('Développé couché barre'); // OK if no other issues
    }
  } else if (narrowRibcage) {
    variants.push('Développé haltères'); // Better for narrow ribcage
    if (!wristIssues) {
      variants.push('Développé couché barre');
    }
  } else if (wristIssues) {
    variants.push('Développé haltères prise neutre');
    variants.push('Floor press');
  } else {
    // No disadvantages - barbell is great
    variants.push('Développé couché barre');
    variants.push('Développé haltères');
  }

  return { exercise: 'Développé couché', advantages, disadvantages, variants, tips };
}

function generateCurlsRecommendation(
  insertions: InsertionsProfile,
  mobility: MobilityProfile
): ExerciseRecommendation {
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const tips: string[] = [];

  // Analyze factors
  const highInsertion = insertions.biceps === 'high'; // High potential (muscle close to elbow)
  const lowInsertion = insertions.biceps === 'low';   // Lower potential (gap at elbow)
  const wristIssues = mobility.wristMobility !== 'none';
  const severeWrist = mobility.wristMobility === 'pronounced';

  // Advantages
  if (highInsertion) {
    advantages.push('Insertion basse = excellent potentiel de volume');
  }
  if (lowInsertion) {
    advantages.push('Meilleur "pic" du biceps (esthétique)');
  }

  // Disadvantages
  if (lowInsertion) {
    disadvantages.push('Volume total limité génétiquement');
    tips.push('Focus sur la contraction au sommet', 'Curl incliné pour maximiser l\'étirement');
  }
  if (severeWrist) {
    disadvantages.push('Valgus poignet = barre droite interdite');
    tips.push('Barre EZ ou haltères uniquement', 'Curl marteau pour soulager les poignets');
  } else if (wristIssues) {
    tips.push('Préférer barre EZ à la barre droite');
  }

  // Build variants (never recommend straight bar if wrist issues)
  const variants: string[] = [];

  if (severeWrist) {
    // Strict: no straight bar at all
    if (highInsertion) {
      variants.push('Curl barre EZ', 'Curl haltères incliné', 'Curl marteau');
    } else if (lowInsertion) {
      variants.push('Curl concentration', 'Curl pupitre barre EZ', 'Curl marteau');
    } else {
      variants.push('Curl barre EZ', 'Curl haltères', 'Curl marteau');
    }
  } else if (wristIssues) {
    // Moderate: prefer EZ but dumbbells OK
    if (highInsertion) {
      variants.push('Curl barre EZ', 'Curl incliné haltères', 'Preacher curl');
    } else if (lowInsertion) {
      variants.push('Curl concentration', 'Curl pupitre', 'Curl barre EZ');
    } else {
      variants.push('Curl barre EZ', 'Curl haltères', 'Curl pupitre');
    }
  } else {
    // No wrist issues: all options available
    if (highInsertion) {
      variants.push('Curl barre droite', 'Curl incliné', 'Preacher curl');
    } else if (lowInsertion) {
      variants.push('Curl concentration', 'Curl pupitre', 'Curl incliné');
    } else {
      variants.push('Curl barre', 'Curl haltères', 'Curl pupitre');
    }
  }

  return { exercise: 'Curls biceps', advantages, disadvantages, variants, tips };
}

function generateMobilityWork(mobility: MobilityProfile, proportions: ProportionsProfile): MobilityWork[] {
  const work: MobilityWork[] = [];

  if (mobility.ankleDorsiflexion === 'limited') {
    work.push({
      area: 'Chevilles (dorsiflexion)',
      priority: 'high',
      exercises: ['Genou au mur (5min/jour)', 'Squat en position basse (30s holds)', 'Étirement mollets'],
    });
  } else if (mobility.ankleDorsiflexion === 'average') {
    work.push({
      area: 'Chevilles',
      priority: 'medium',
      exercises: ['Genou au mur (3min/jour)'],
    });
  }

  if (mobility.posteriorChain === 'limited') {
    work.push({
      area: 'Chaîne postérieure',
      priority: 'high',
      exercises: ['Good morning léger', 'Étirement ischio-jambiers', 'Romanian deadlift léger'],
    });
  }

  if (mobility.wristMobility === 'pronounced') {
    work.push({
      area: 'Poignets (valgus)',
      priority: 'high',
      exercises: [
        'Renforcement avant-bras (wrist curls)',
        'Étirements fléchisseurs et extenseurs',
        'Pompes sur poignées parallèles',
        'Éviter barre droite au curl et bench',
      ],
    });
  } else if (mobility.wristMobility === 'slight') {
    work.push({
      area: 'Poignets',
      priority: 'medium',
      exercises: ['Échauffement poignets avant pressing', 'Rotations de poignets'],
    });
  }

  if (proportions.kneeValgus !== 'none') {
    work.push({
      area: 'Fessiers / Abducteurs',
      priority: proportions.kneeValgus === 'pronounced' ? 'high' : 'medium',
      exercises: ['Clamshells', 'Monster walks (élastique)', 'Abductions hanche', 'Squats avec élastique genoux'],
    });
  }

  return work;
}

// =============================================================================
// STRENGTHS & WEAKNESSES GENERATORS
// =============================================================================

function generateStrengths(
  structure: StructureProfile,
  proportions: ProportionsProfile,
  insertions: InsertionsProfile,
  metabolism: MetabolismProfile
): string[] {
  const strengths: string[] = [];

  if (proportions.armLength === 'long') strengths.push('Deadlift : bras longs avantageux');
  if (proportions.armLength === 'short') strengths.push('Bench : bras courts = course réduite');
  if (proportions.femurLength === 'short') strengths.push('Squat : fémurs courts = position idéale');
  if (proportions.femurLength === 'long') strengths.push('Deadlift sumo : fémurs longs avantageux');
  if (structure.ribcageDepth === 'wide') strengths.push('Bench : cage profonde réduit l\'amplitude');
  if (structure.shoulderToHip === 'wide') strengths.push('Épaules larges = bonne stabilité');
  if (insertions.biceps === 'high') strengths.push('Fort potentiel biceps (insertion basse)');
  if (insertions.calves === 'high') strengths.push('Fort potentiel mollets');
  if (insertions.chest === 'high') strengths.push('Pectoraux complets (insertions proches)');
  if (metabolism.naturalStrength === 'high') strengths.push('Force naturelle élevée');
  if (structure.frameSize === 'large') strengths.push('Ossature solide = bon potentiel de masse');

  if (strengths.length === 0) strengths.push('Profil équilibré sans désavantage majeur');

  return strengths;
}

function generateWeaknesses(
  structure: StructureProfile,
  proportions: ProportionsProfile,
  insertions: InsertionsProfile,
  mobility: MobilityProfile
): string[] {
  const weaknesses: string[] = [];

  if (proportions.femurLength === 'long') weaknesses.push('Squat : fémurs longs = inclinaison du buste');
  if (proportions.armLength === 'long') weaknesses.push('Bench : bras longs = grande amplitude');
  if (proportions.armLength === 'short') weaknesses.push('Deadlift : bras courts = amplitude augmentée');
  if (proportions.torsoLength === 'long') weaknesses.push('Deadlift : torse long = stress lombaire');
  if (structure.ribcageDepth === 'narrow') weaknesses.push('Bench : cage plate = amplitude augmentée');
  if (structure.shoulderToHip === 'narrow') weaknesses.push('Épaules étroites à développer');
  if (structure.frameSize === 'fine') weaknesses.push('Ossature fine = prise de masse plus lente');
  if (mobility.ankleDorsiflexion === 'limited') weaknesses.push('Chevilles raides = squat limité');
  if (proportions.kneeValgus !== 'none') weaknesses.push('Valgus genoux à corriger');
  if (mobility.wristMobility !== 'none') weaknesses.push('Poignets fragiles = adapter les prises');
  if (insertions.biceps === 'low') weaknesses.push('Biceps : insertion haute = volume limité');
  if (insertions.calves === 'low') weaknesses.push('Mollets : insertion haute = développement difficile');
  if (insertions.chest === 'low') weaknesses.push('Pecs : insertion large = intérieur difficile');

  return weaknesses;
}
