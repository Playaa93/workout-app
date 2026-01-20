// Program configuration constants (shared between client and server)
// Based on Gundill/Delavier/Rudy Coia methodology

export type ProgramGoal =
  | 'strength'           // Force pure / Powerlifting
  | 'hypertrophy'        // Hypertrophie classique (tension mécanique)
  | 'metabolic'          // Stress métabolique (pump, séries géantes)
  | 'powerbuilding'      // Mix force + hypertrophie
  | 'athletic'           // Performance athlétique / explosivité
  | 'recomposition';     // Recomposition corporelle

export type ProgramApproach =
  | 'leverage_strengths' // Exploiter mes points forts morpho
  | 'fix_weaknesses'     // Corriger mes faiblesses génétiques
  | 'balanced';          // Programme équilibré

export type ProgramSplit = 'full_body' | 'ppl' | 'upper_lower' | 'bro_split';

export type ProgramConfig = {
  goal: ProgramGoal;
  approach: ProgramApproach;
  split: ProgramSplit;
  daysPerWeek: number;
};

export const GOAL_LABELS: Record<ProgramGoal, string> = {
  strength: 'Force Pure',
  hypertrophy: 'Hypertrophie',
  metabolic: 'Stress Métabolique',
  powerbuilding: 'Powerbuilding',
  athletic: 'Athlétique',
  recomposition: 'Recomposition',
};

export const GOAL_DESCRIPTIONS: Record<ProgramGoal, string> = {
  strength: 'Charges lourdes, progression linéaire',
  hypertrophy: 'Tension mécanique, tempo contrôlé',
  metabolic: 'Congestion, séries courtes',
  powerbuilding: 'Mix force et volume',
  athletic: 'Puissance, explosivité',
  recomposition: 'Déficit + stimulus musculaire',
};

export const APPROACH_LABELS: Record<ProgramApproach, string> = {
  leverage_strengths: 'Exploiter mes points forts',
  fix_weaknesses: 'Corriger mes faiblesses',
  balanced: 'Programme équilibré',
};

export const APPROACH_DESCRIPTIONS: Record<ProgramApproach, string> = {
  leverage_strengths: 'Exercices où tu excelles',
  fix_weaknesses: 'Travail correctif ciblé',
  balanced: 'Développement harmonieux',
};

export const SPLIT_LABELS: Record<ProgramSplit, string> = {
  full_body: 'Full Body',
  ppl: 'Push/Pull/Legs',
  upper_lower: 'Upper/Lower',
  bro_split: 'Bro Split',
};

export const SPLIT_MIN_DAYS: Record<ProgramSplit, number> = {
  full_body: 2,
  ppl: 3,
  upper_lower: 3,
  bro_split: 4,
};
