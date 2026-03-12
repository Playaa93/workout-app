/** XP needed to complete a given level (exponential growth) */
export function getXpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

/** Calculate current level info from total XP */
export function calculateLevel(totalXp: number): { level: number; xpInCurrentLevel: number; xpToNext: number } {
  let level = 1;
  let xpNeeded = getXpForLevel(level);
  let xpRemaining = totalXp;
  while (xpRemaining >= xpNeeded) {
    xpRemaining -= xpNeeded;
    level++;
    xpNeeded = getXpForLevel(level);
  }
  return { level, xpInCurrentLevel: xpRemaining, xpToNext: xpNeeded };
}

const XP_REASON_LABELS: Record<string, string> = {
  workout_completed: 'Entraînement terminé',
  cardio_completed: 'Cardio terminé',
  pr_achieved: 'Record personnel',
  streak_bonus: 'Bonus de série',
  food_logged: 'Repas enregistré',
  measurement_added: 'Mesure ajoutée',
  photo_ai: 'Photo IA',
  boss_fight_won: 'Boss vaincu',
};

export function xpReasonLabel(reason: string): string {
  if (XP_REASON_LABELS[reason]) return XP_REASON_LABELS[reason];
  if (reason.startsWith('Achievement: ')) return reason.replace('Achievement: ', 'Succès : ');
  return reason;
}
