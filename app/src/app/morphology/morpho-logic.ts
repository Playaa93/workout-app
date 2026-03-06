// Pure logic for morphology analysis - no DB access, client-safe
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

export const MORPHO_QUESTIONS: MorphoQuestion[] = [
  // BLOC 1 : STRUCTURE OSSEUSE
  {
    id: 'q1', questionKey: 'wrist_circumference',
    questionTextFr: 'Mesure ton tour de poignet (au plus fin, sous l\'os). Si tu n\'as pas de mètre, entoure ton poignet avec ton pouce et majeur.',
    questionType: 'single_choice', category: 'structure',
    helpText: 'Indique ta structure osseuse (frame)',
    options: [
      { label: '< 16 cm (ou doigts se chevauchent)', value: 'fine', description: 'Ossature fine' },
      { label: '16-18 cm (ou doigts se touchent)', value: 'medium', description: 'Ossature moyenne' },
      { label: '> 18 cm (ou doigts ne se touchent pas)', value: 'large', description: 'Ossature large' },
    ],
    orderIndex: 1,
  },
  {
    id: 'q2', questionKey: 'shoulder_hip_ratio',
    questionTextFr: 'De face dans un miroir, comment sont tes épaules par rapport à tes hanches ?',
    questionType: 'single_choice', category: 'structure',
    helpText: 'Structure du haut du corps',
    options: [
      { label: 'Épaules nettement plus larges (forme en V)', value: 'wide', description: 'Avantage pressing' },
      { label: 'Épaules légèrement plus larges ou égales', value: 'medium', description: 'Équilibré' },
      { label: 'Hanches aussi larges ou plus larges', value: 'narrow', description: 'Travailler les épaules' },
    ],
    orderIndex: 2,
  },
  {
    id: 'q3', questionKey: 'ribcage_depth',
    questionTextFr: 'De profil, comment est ta cage thoracique ?',
    questionType: 'single_choice', category: 'structure',
    helpText: 'Impacte le développé couché',
    options: [
      { label: 'Cage profonde et bombée (thorax épais)', value: 'wide', description: 'Avantage développé couché' },
      { label: 'Cage moyenne', value: 'medium', description: 'Standard' },
      { label: 'Cage plate et étroite', value: 'narrow', description: 'Grande amplitude au développé couché' },
    ],
    orderIndex: 3,
  },
  // BLOC 2 : PROPORTIONS SEGMENTAIRES
  {
    id: 'q4', questionKey: 'torso_length',
    questionTextFr: 'Assis sur une chaise à côté de quelqu\'un de même taille que toi debout, comment est ton buste ?',
    questionType: 'single_choice', category: 'proportions',
    helpText: 'Ratio torse/jambes',
    options: [
      { label: 'Mon buste est plus bas (j\'ai les jambes longues)', value: 'short', description: 'Torse court' },
      { label: 'On est à peu près au même niveau', value: 'medium', description: 'Équilibré' },
      { label: 'Mon buste est plus haut (j\'ai le torse long)', value: 'long', description: 'Torse long' },
    ],
    orderIndex: 4,
  },
  {
    id: 'q5', questionKey: 'arm_length',
    questionTextFr: 'Écarte les bras en croix (comme un T). Demande à quelqu\'un de mesurer la distance entre tes deux majeurs. Compare ce chiffre à ta taille.',
    questionType: 'single_choice', category: 'proportions',
    helpText: 'Ex: taille 175cm, distance bras 180cm = bras longs',
    options: [
      { label: 'Distance bras < taille (bras courts)', value: 'short', description: 'Avantage développé couché' },
      { label: 'Distance bras = taille (± 2cm)', value: 'medium', description: 'Standard' },
      { label: 'Distance bras > taille (bras longs)', value: 'long', description: 'Avantage soulevé de terre' },
    ],
    orderIndex: 5,
  },
  {
    id: 'q6', questionKey: 'femur_length',
    questionTextFr: 'Fais un squat profond pieds à plat, sans charge. Que se passe-t-il naturellement ?',
    questionType: 'single_choice', category: 'proportions',
    helpText: 'Longueur des fémurs',
    options: [
      { label: 'Je descends facilement, dos droit, talons au sol', value: 'short', description: 'Fémurs courts = squat facile' },
      { label: 'Position correcte avec légère inclinaison du buste', value: 'medium', description: 'Fémurs moyens' },
      { label: 'Mes talons se lèvent ou je penche beaucoup en avant', value: 'long', description: 'Fémurs longs = squat difficile' },
    ],
    orderIndex: 6,
  },
  {
    id: 'q7', questionKey: 'knee_valgus',
    questionTextFr: 'Quand tu fais un squat ou que tu te relèves d\'une chaise, tes genoux ont tendance à :',
    questionType: 'single_choice', category: 'proportions',
    helpText: 'Valgus du genou (genoux vers l\'intérieur)',
    options: [
      { label: 'Rester bien alignés avec les pieds', value: 'none', description: 'Bon tracking' },
      { label: 'Rentrer légèrement vers l\'intérieur', value: 'slight', description: 'Valgus léger - renforcer fessiers' },
      { label: 'Rentrer nettement vers l\'intérieur', value: 'pronounced', description: 'Valgus prononcé - travail correctif' },
    ],
    orderIndex: 7,
  },
  // BLOC 3 : MOBILITÉ
  {
    id: 'q8', questionKey: 'ankle_mobility',
    questionTextFr: 'Test du genou au mur : pied à 10cm du mur, peux-tu toucher le mur avec ton genou sans lever le talon ?',
    questionType: 'single_choice', category: 'mobility',
    helpText: 'Dorsiflexion de cheville - crucial pour le squat',
    options: [
      { label: 'Oui facilement, je peux même reculer le pied', value: 'good', description: 'Bonne mobilité' },
      { label: 'Oui mais c\'est juste', value: 'average', description: 'Mobilité correcte' },
      { label: 'Non, mon talon se lève ou je n\'atteins pas', value: 'limited', description: 'Mobilité limitée - travail requis' },
    ],
    orderIndex: 8,
  },
  {
    id: 'q9', questionKey: 'posterior_chain',
    questionTextFr: 'Debout, jambes tendues, essaie de toucher tes orteils :',
    questionType: 'single_choice', category: 'mobility',
    helpText: 'Souplesse ischio-jambiers et chaîne postérieure',
    options: [
      { label: 'Je touche facilement mes orteils ou au-delà', value: 'good', description: 'Bonne souplesse' },
      { label: 'J\'arrive aux chevilles ou orteils', value: 'average', description: 'Souplesse moyenne' },
      { label: 'J\'arrive aux tibias ou plus haut', value: 'limited', description: 'Souplesse limitée' },
    ],
    orderIndex: 9,
  },
  {
    id: 'q10', questionKey: 'wrist_mobility',
    questionTextFr: 'Mets-toi en position de développé couché (ou pompe) bras tendus. Regarde tes poignets de face : sont-ils alignés avec tes coudes et épaules ?',
    questionType: 'single_choice', category: 'mobility',
    helpText: 'Valgus des poignets - impact sur les exercices de poussée',
    options: [
      { label: 'Oui, poignets bien droits dans l\'axe', value: 'none', description: 'Bon alignement' },
      { label: 'Légèrement inclinés vers l\'intérieur ou l\'extérieur', value: 'slight', description: 'Valgus léger' },
      { label: 'Nettement désaxés, inconfort ou douleur', value: 'pronounced', description: 'Valgus prononcé - barre droite déconseillée' },
    ],
    orderIndex: 10,
  },
  // BLOC 4 : INSERTIONS MUSCULAIRES
  {
    id: 'q11', questionKey: 'biceps_insertion',
    questionTextFr: 'Contracte ton biceps à 90°. Combien de doigts entre le pli du coude et le début du muscle ?',
    questionType: 'single_choice', category: 'insertions',
    helpText: 'Test d\'insertion du biceps (méthode Delavier)',
    options: [
      { label: '0-1 doigt (muscle proche du coude)', value: 'high', description: 'Excellent potentiel biceps' },
      { label: '1-2 doigts', value: 'medium', description: 'Potentiel moyen' },
      { label: '2+ doigts (grand espace)', value: 'low', description: 'Potentiel limité mais meilleur "pic"' },
    ],
    orderIndex: 11,
  },
  {
    id: 'q12', questionKey: 'calf_insertion',
    questionTextFr: 'Regarde tes mollets de profil. Le muscle descend :',
    questionType: 'single_choice', category: 'insertions',
    helpText: 'Insertion des mollets',
    options: [
      { label: 'Bas, proche du talon d\'Achille', value: 'high', description: 'Fort potentiel mollets' },
      { label: 'À mi-chemin', value: 'medium', description: 'Potentiel moyen' },
      { label: 'Haut, loin du talon ("mollet de coq")', value: 'low', description: 'Développement plus difficile' },
    ],
    orderIndex: 12,
  },
  {
    id: 'q13', questionKey: 'chest_insertion',
    questionTextFr: 'Contracte tes pectoraux. L\'écart entre les deux pecs au niveau du sternum :',
    questionType: 'single_choice', category: 'insertions',
    helpText: 'Insertion des pectoraux',
    options: [
      { label: 'Très peu d\'écart, les pecs se touchent presque', value: 'high', description: 'Pecs complets' },
      { label: 'Écart moyen (2-3 cm)', value: 'medium', description: 'Standard' },
      { label: 'Grand écart, pecs bien séparés', value: 'low', description: 'Intérieur plus difficile' },
    ],
    orderIndex: 13,
  },
  // BLOC 5 : MÉTABOLISME & EXPÉRIENCE
  {
    id: 'q14', questionKey: 'weight_tendency',
    questionTextFr: 'Si tu manges plus que d\'habitude pendant 2 semaines :',
    questionType: 'single_choice', category: 'metabolism',
    helpText: 'Tendance métabolique',
    options: [
      { label: 'Je ne prends quasiment pas de poids', value: 'fast', description: 'Métabolisme rapide (ecto)' },
      { label: 'Je prends un peu, mix muscle et gras', value: 'balanced', description: 'Métabolisme équilibré (méso)' },
      { label: 'Je stocke facilement, surtout au ventre', value: 'slow', description: 'Métabolisme lent (endo)' },
    ],
    orderIndex: 14,
  },
  {
    id: 'q15', questionKey: 'natural_strength',
    questionTextFr: 'AVANT de faire de la musculation, tu étais naturellement :',
    questionType: 'single_choice', category: 'metabolism',
    helpText: 'Force de base naturelle',
    options: [
      { label: 'Plutôt faible, peu de force', value: 'low', description: 'Focus technique d\'abord' },
      { label: 'Dans la moyenne', value: 'average', description: 'Progression standard' },
      { label: 'Naturellement costaud/fort', value: 'high', description: 'Peut charger plus vite' },
    ],
    orderIndex: 15,
  },
  {
    id: 'q16', questionKey: 'best_responders',
    questionTextFr: 'Quels muscles semblent répondre le mieux à ton entraînement ?',
    questionType: 'single_choice', category: 'metabolism',
    helpText: 'Identifier tes points forts génétiques',
    options: [
      { label: 'Dos et épaules', value: 'back_shoulders', description: 'Exercices de tirage' },
      { label: 'Pectoraux et bras', value: 'chest_arms', description: 'Exercices de poussée' },
      { label: 'Jambes (quadriceps, fessiers)', value: 'legs', description: 'Bas du corps' },
      { label: 'Tout est difficile / Je débute', value: 'none', description: 'Travail global nécessaire' },
    ],
    orderIndex: 16,
  },
];

// =============================================================================
// MAIN CALCULATION
// =============================================================================

export function calculateMorphotype(answers: Record<string, string>): MorphotypeResult {
  const structure = extractStructure(answers);
  const proportions = extractProportions(answers);
  const mobility = extractMobility(answers);
  const insertions = extractInsertions(answers);
  const metabolism = extractMetabolism(answers);
  const globalType = determineGlobalType(proportions);
  const squat = generateSquatRecommendation(proportions, mobility, structure);
  const deadlift = generateDeadliftRecommendation(proportions, structure);
  const bench = generateBenchRecommendation(proportions, structure, mobility);
  const curls = generateCurlsRecommendation(insertions, mobility);
  const mobilityWork = generateMobilityWork(mobility, proportions);
  const { primary, scores } = determineSomatotype(metabolism, structure);
  const strengths = generateStrengths(structure, proportions, insertions, metabolism);
  const weaknesses = generateWeaknesses(structure, proportions, insertions, mobility);
  const recommendedExercises = [...squat.variants.slice(0, 2), ...deadlift.variants.slice(0, 2), ...bench.variants.slice(0, 2)];
  const exercisesToAvoid = [
    ...squat.disadvantages.length > 1 ? ['Squat ATG lourd'] : [],
    ...bench.disadvantages.length > 1 ? ['Développé couché prise très large'] : [],
  ];

  return {
    globalType, structure, proportions, mobility, insertions, metabolism,
    squat, deadlift, bench, curls, mobilityWork,
    primary, secondary: null, scores, strengths, weaknesses,
    recommendedExercises, exercisesToAvoid,
  };
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
// CLASSIFICATION
// =============================================================================

function determineGlobalType(proportions: ProportionsProfile): 'longiligne' | 'breviligne' | 'balanced' {
  const longCount = [proportions.torsoLength, proportions.armLength, proportions.femurLength].filter(v => v === 'long').length;
  const shortCount = [proportions.torsoLength, proportions.armLength, proportions.femurLength].filter(v => v === 'short').length;
  if (longCount >= 2) return 'longiligne';
  if (shortCount >= 2) return 'breviligne';
  return 'balanced';
}

function determineSomatotype(metabolism: MetabolismProfile, structure: StructureProfile) {
  const scores = { ecto: 0, meso: 0, endo: 0 };
  if (structure.frameSize === 'fine') scores.ecto += 2;
  else if (structure.frameSize === 'large') { scores.endo += 1; scores.meso += 1; }
  else scores.meso += 1;
  if (structure.shoulderToHip === 'wide') scores.meso += 2;
  else if (structure.shoulderToHip === 'narrow') scores.ecto += 1;
  if (metabolism.weightTendency === 'fast') scores.ecto += 3;
  else if (metabolism.weightTendency === 'slow') scores.endo += 3;
  else scores.meso += 2;
  if (metabolism.naturalStrength === 'high') scores.meso += 2;
  else if (metabolism.naturalStrength === 'low') scores.ecto += 1;
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const map: Record<string, 'ectomorph' | 'mesomorph' | 'endomorph'> = { ecto: 'ectomorph', meso: 'mesomorph', endo: 'endomorph' };
  return { primary: map[sorted[0][0]] as 'ectomorph' | 'mesomorph' | 'endomorph', scores };
}

// =============================================================================
// RECOMMENDATION GENERATORS
// =============================================================================

function generateSquatRecommendation(proportions: ProportionsProfile, mobility: MobilityProfile, structure: StructureProfile): ExerciseRecommendation {
  const advantages: string[] = [], disadvantages: string[] = [], tips: string[] = [];
  const longFemurs = proportions.femurLength === 'long';
  const shortFemurs = proportions.femurLength === 'short';
  const limitedAnkle = mobility.ankleDorsiflexion === 'limited';
  const kneeValgus = proportions.kneeValgus !== 'none';
  const severeValgus = proportions.kneeValgus === 'pronounced';
  const longTorso = proportions.torsoLength === 'long';
  const freeSquatIssues = [longFemurs, limitedAnkle, severeValgus].filter(Boolean).length;
  if (shortFemurs) advantages.push('Fémurs courts = biomécanique idéale');
  if (longTorso) advantages.push('Torse long = bon levier');
  if (longFemurs) { disadvantages.push('Fémurs longs = inclinaison du buste importante'); tips.push('Écarter les pieds (position pieds largeur > épaules)'); }
  if (limitedAnkle) { disadvantages.push('Mobilité cheville limitée'); tips.push('Talonnettes obligatoires', 'Travailler la dorsiflexion quotidiennement'); }
  if (severeValgus) { disadvantages.push('Valgus prononcé = risque blessure'); tips.push('Élastique autour des genoux', 'Renforcer fessiers avant de charger lourd'); }
  else if (kneeValgus) { tips.push('Attention à l\'alignement des genoux', 'Activer les fessiers en échauffement'); }
  const variants: string[] = [];
  if (freeSquatIssues >= 2) { variants.push('Hack squat (machine guidée)', 'Presse à cuisses pieds hauts', 'Squat à la ceinture'); if (longFemurs && !severeValgus) variants.push('Squat sur box (assis-debout)'); }
  else if (longFemurs) { variants.push('Squat sur box (assis-debout)', 'Hack squat (machine guidée)', 'Squat pieds écartés'); if (!limitedAnkle) variants.push('Squat barre de sécurité (safety bar)'); }
  else if (limitedAnkle) { variants.push('Squat barre avec talonnettes', 'Hack squat (machine guidée)', 'Squat gobelet sur cales'); }
  else if (shortFemurs) { variants.push('Squat barre classique', 'Squat barre devant (front squat)', 'Squat complet (fesses aux talons)'); }
  else { variants.push('Squat barre', 'Squat gobelet (haltère devant)', 'Squat barre devant'); }
  return { exercise: 'Squat', advantages, disadvantages, variants, tips };
}

function generateDeadliftRecommendation(proportions: ProportionsProfile, structure: StructureProfile): ExerciseRecommendation {
  const advantages: string[] = [], disadvantages: string[] = [], tips: string[] = [];
  const longArms = proportions.armLength === 'long', shortArms = proportions.armLength === 'short';
  const longFemurs = proportions.femurLength === 'long', shortFemurs = proportions.femurLength === 'short';
  const longTorso = proportions.torsoLength === 'long', shortTorso = proportions.torsoLength === 'short';
  const deadliftRiskFactors = [longTorso, shortArms, longFemurs && longTorso].filter(Boolean).length;
  if (longArms) advantages.push('Bras longs = amplitude réduite');
  if (shortTorso) advantages.push('Torse court = moins de stress lombaire');
  if (longFemurs && !longTorso) advantages.push('Fémurs longs = levier favorable en sumo');
  if (shortFemurs && !shortArms) advantages.push('Position de départ basse naturelle');
  if (shortArms) disadvantages.push('Bras courts = amplitude augmentée');
  if (longTorso) { disadvantages.push('Torse long = stress lombaire augmenté'); tips.push('Gainage strict obligatoire'); }
  if (longTorso && shortArms) disadvantages.push('Combinaison défavorable pour le soulevé de terre');
  const variants: string[] = [];
  if (deadliftRiskFactors >= 2) {
    tips.push('Le soulevé de terre classique n\'est pas idéal pour toi', 'Privilégie les alternatives ci-dessous');
    variants.push('Soulevé roumain (jambes semi-tendues)', 'Barre hexagonale (poignées hautes)', 'Poussée de hanches (hip thrust)', 'Tirage partiel (au-dessus du genou)');
    if (longFemurs && !shortArms) variants.push('Sumo (pieds très écartés, si mobilité hanches OK)');
  } else if (longTorso) {
    tips.push('Éviter les charges maximales en conventionnel');
    variants.push('Barre hexagonale', 'Sumo (pieds très écartés)', 'Soulevé roumain (jambes semi-tendues)');
    if (longArms) variants.push('Conventionnel (charges modérées)');
  } else if (shortArms) {
    tips.push('Le sumo ou la barre hexagonale réduisent le mouvement');
    variants.push('Sumo (pieds très écartés)', 'Barre hexagonale');
    if (shortFemurs) variants.push('Conventionnel');
  } else {
    if (longArms && shortTorso) { tips.push('Excellent profil pour le soulevé de terre conventionnel'); variants.push('Conventionnel', 'Sumo (pieds très écartés)', 'Soulevé en déficit (sur cale)'); }
    else if (longFemurs) { tips.push('Le sumo exploite tes fémurs longs'); variants.push('Sumo (pieds très écartés)', 'Conventionnel'); }
    else { variants.push('Conventionnel', 'Sumo (pieds très écartés)', 'Barre hexagonale'); }
  }
  return { exercise: 'Soulevé de terre', advantages, disadvantages, variants, tips };
}

function generateBenchRecommendation(proportions: ProportionsProfile, structure: StructureProfile, mobility: MobilityProfile): ExerciseRecommendation {
  const advantages: string[] = [], disadvantages: string[] = [], variants: string[] = [], tips: string[] = [];
  const longArms = proportions.armLength === 'long';
  const narrowRibcage = structure.ribcageDepth === 'narrow';
  const wristIssues = mobility.wristMobility !== 'none';
  if (proportions.armLength === 'short') advantages.push('Bras courts = course réduite');
  else if (proportions.armLength === 'long') { disadvantages.push('Bras longs = grande amplitude'); tips.push('Arc dorsal prononcé pour réduire l\'amplitude'); }
  if (structure.ribcageDepth === 'wide') advantages.push('Cage profonde = barre plus proche au départ');
  else if (structure.ribcageDepth === 'narrow') { disadvantages.push('Cage plate = amplitude augmentée'); tips.push('Arc dorsal indispensable pour compenser'); }
  if (structure.shoulderToHip === 'wide') advantages.push('Épaules larges = bonne base de poussée');
  else if (structure.shoulderToHip === 'narrow') { disadvantages.push('Épaules étroites = moins de stabilité'); tips.push('Renforcer les deltoïdes latéraux'); }
  if (mobility.wristMobility === 'pronounced') { disadvantages.push('Valgus poignets = stress articulaire'); tips.push('Bandes de poignets obligatoires', 'Haltères en prise neutre recommandées'); }
  else if (mobility.wristMobility === 'slight') tips.push('Vérifier l\'alignement poignets-coudes-épaules');
  if (longArms) { variants.push('Développé couché au sol', 'Développé haltères'); if (!narrowRibcage && !wristIssues) variants.push('Développé couché barre'); }
  else if (narrowRibcage) { variants.push('Développé haltères'); if (!wristIssues) variants.push('Développé couché barre'); }
  else if (wristIssues) { variants.push('Développé haltères prise neutre', 'Développé couché au sol'); }
  else { variants.push('Développé couché barre', 'Développé haltères'); }
  return { exercise: 'Développé couché', advantages, disadvantages, variants, tips };
}

function generateCurlsRecommendation(insertions: InsertionsProfile, mobility: MobilityProfile): ExerciseRecommendation {
  const advantages: string[] = [], disadvantages: string[] = [], tips: string[] = [];
  const highInsertion = insertions.biceps === 'high', lowInsertion = insertions.biceps === 'low';
  const wristIssues = mobility.wristMobility !== 'none', severeWrist = mobility.wristMobility === 'pronounced';
  if (highInsertion) advantages.push('Insertion basse = excellent potentiel de volume');
  if (lowInsertion) advantages.push('Meilleur "pic" du biceps (esthétique)');
  if (lowInsertion) { disadvantages.push('Volume total limité génétiquement'); tips.push('Focus sur la contraction au sommet', 'Curl incliné pour maximiser l\'étirement'); }
  if (severeWrist) { disadvantages.push('Valgus poignet = barre droite interdite'); tips.push('Barre EZ ou haltères uniquement', 'Curl marteau pour soulager les poignets'); }
  else if (wristIssues) tips.push('Préférer barre EZ à la barre droite');
  const variants: string[] = [];
  if (severeWrist) { if (highInsertion) variants.push('Curl barre EZ', 'Curl haltères incliné', 'Curl marteau'); else if (lowInsertion) variants.push('Curl concentration', 'Curl pupitre barre EZ', 'Curl marteau'); else variants.push('Curl barre EZ', 'Curl haltères', 'Curl marteau'); }
  else if (wristIssues) { if (highInsertion) variants.push('Curl barre EZ', 'Curl incliné haltères', 'Curl au pupitre (Larry Scott)'); else if (lowInsertion) variants.push('Curl concentration', 'Curl pupitre', 'Curl barre EZ'); else variants.push('Curl barre EZ', 'Curl haltères', 'Curl pupitre'); }
  else { if (highInsertion) variants.push('Curl barre droite', 'Curl incliné', 'Curl au pupitre (Larry Scott)'); else if (lowInsertion) variants.push('Curl concentration', 'Curl pupitre', 'Curl incliné'); else variants.push('Curl barre', 'Curl haltères', 'Curl pupitre'); }
  return { exercise: 'Curls biceps', advantages, disadvantages, variants, tips };
}

function generateMobilityWork(mobility: MobilityProfile, proportions: ProportionsProfile): MobilityWork[] {
  const work: MobilityWork[] = [];
  if (mobility.ankleDorsiflexion === 'limited') work.push({ area: 'Chevilles (dorsiflexion)', priority: 'high', exercises: ['Genou au mur (5min/jour)', 'Squat en position basse (30s holds)', 'Étirement mollets'] });
  else if (mobility.ankleDorsiflexion === 'average') work.push({ area: 'Chevilles', priority: 'medium', exercises: ['Genou au mur (3min/jour)'] });
  if (mobility.posteriorChain === 'limited') work.push({ area: 'Chaîne postérieure', priority: 'high', exercises: ['Flexion du buste barre légère (good morning)', 'Étirement ischio-jambiers', 'Soulevé roumain léger (jambes semi-tendues)'] });
  if (mobility.wristMobility === 'pronounced') work.push({ area: 'Poignets (valgus)', priority: 'high', exercises: ['Renforcement avant-bras (flexion/extension poignets)', 'Étirements fléchisseurs et extenseurs', 'Pompes sur poignées parallèles', 'Éviter barre droite au curl et développé couché'] });
  else if (mobility.wristMobility === 'slight') work.push({ area: 'Poignets', priority: 'medium', exercises: ['Échauffement poignets avant exercices de poussée', 'Rotations de poignets'] });
  if (proportions.kneeValgus !== 'none') work.push({ area: 'Fessiers / Abducteurs', priority: proportions.kneeValgus === 'pronounced' ? 'high' : 'medium', exercises: ['Ouverture de hanches allongé (clamshells)', 'Marche latérale avec élastique', 'Abductions de hanche', 'Squats avec élastique aux genoux'] });
  return work;
}

function generateStrengths(structure: StructureProfile, proportions: ProportionsProfile, insertions: InsertionsProfile, metabolism: MetabolismProfile): string[] {
  const s: string[] = [];
  if (proportions.armLength === 'long') s.push('Soulevé de terre : bras longs avantageux');
  if (proportions.armLength === 'short') s.push('Développé couché : bras courts = course réduite');
  if (proportions.femurLength === 'short') s.push('Squat : fémurs courts = position idéale');
  if (proportions.femurLength === 'long') s.push('Soulevé sumo : fémurs longs avantageux');
  if (structure.ribcageDepth === 'wide') s.push('Développé couché : cage profonde réduit l\'amplitude');
  if (structure.shoulderToHip === 'wide') s.push('Épaules larges = bonne stabilité');
  if (insertions.biceps === 'high') s.push('Fort potentiel biceps (insertion basse)');
  if (insertions.calves === 'high') s.push('Fort potentiel mollets');
  if (insertions.chest === 'high') s.push('Pectoraux complets (insertions proches)');
  if (metabolism.naturalStrength === 'high') s.push('Force naturelle élevée');
  if (structure.frameSize === 'large') s.push('Ossature solide = bon potentiel de masse');
  if (s.length === 0) s.push('Profil équilibré sans désavantage majeur');
  return s;
}

function generateWeaknesses(structure: StructureProfile, proportions: ProportionsProfile, insertions: InsertionsProfile, mobility: MobilityProfile): string[] {
  const w: string[] = [];
  if (proportions.femurLength === 'long') w.push('Squat : fémurs longs = inclinaison du buste');
  if (proportions.armLength === 'long') w.push('Développé couché : bras longs = grande amplitude');
  if (proportions.armLength === 'short') w.push('Soulevé de terre : bras courts = amplitude augmentée');
  if (proportions.torsoLength === 'long') w.push('Soulevé de terre : torse long = stress lombaire');
  if (structure.ribcageDepth === 'narrow') w.push('Développé couché : cage plate = amplitude augmentée');
  if (structure.shoulderToHip === 'narrow') w.push('Épaules étroites à développer');
  if (structure.frameSize === 'fine') w.push('Ossature fine = prise de masse plus lente');
  if (mobility.ankleDorsiflexion === 'limited') w.push('Chevilles raides = squat limité');
  if (proportions.kneeValgus !== 'none') w.push('Valgus genoux à corriger');
  if (mobility.wristMobility !== 'none') w.push('Poignets fragiles = adapter les prises');
  if (insertions.biceps === 'low') w.push('Biceps : insertion haute = volume limité');
  if (insertions.calves === 'low') w.push('Mollets : insertion haute = développement difficile');
  if (insertions.chest === 'low') w.push('Pecs : insertion large = intérieur difficile');
  return w;
}
