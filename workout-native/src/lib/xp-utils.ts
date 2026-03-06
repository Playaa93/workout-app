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
