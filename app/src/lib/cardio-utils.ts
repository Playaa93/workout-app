import type { CardioActivity } from '@/db/schema';

export const CARDIO_ACTIVITIES: Record<CardioActivity, { label: string; emoji: string }> = {
  running:    { label: 'Course',          emoji: '🏃' },
  walking:    { label: 'Marche',          emoji: '🚶' },
  cycling:    { label: 'Vélo',            emoji: '🚴' },
  rowing:     { label: 'Rameur',          emoji: '🚣' },
  jump_rope:  { label: 'Corde à sauter',  emoji: '⏭️' },
  swimming:   { label: 'Natation',        emoji: '🏊' },
  elliptical: { label: 'Elliptique',      emoji: '🔄' },
  stepper:    { label: 'Stepper',         emoji: '🪜' },
  hiit:       { label: 'HIIT',            emoji: '⚡' },
  other:      { label: 'Autre',           emoji: '💪' },
};

// MET values per activity (Compendium of Physical Activities)
export const CARDIO_MET: Record<CardioActivity, { low: number; moderate: number; vigorous: number }> = {
  running:    { low: 6.0,  moderate: 9.8,  vigorous: 12.8 },
  walking:    { low: 2.5,  moderate: 3.5,  vigorous: 5.0  },
  cycling:    { low: 4.0,  moderate: 6.8,  vigorous: 10.0 },
  rowing:     { low: 4.8,  moderate: 7.0,  vigorous: 12.0 },
  jump_rope:  { low: 8.8,  moderate: 11.8, vigorous: 14.0 },
  swimming:   { low: 4.8,  moderate: 7.0,  vigorous: 10.0 },
  elliptical: { low: 4.6,  moderate: 6.3,  vigorous: 8.0  },
  stepper:    { low: 4.0,  moderate: 6.0,  vigorous: 8.5  },
  hiit:       { low: 6.0,  moderate: 8.0,  vigorous: 12.0 },
  other:      { low: 4.0,  moderate: 6.0,  vigorous: 8.0  },
};

/** "5:32/km" */
export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = Math.round(secondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}/km`;
}

/** "5.2 km" or "850 m" */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/** Returns seconds per km */
export function calculatePace(durationSeconds: number, distanceMeters: number): number {
  if (distanceMeters <= 0) return 0;
  return Math.round((durationSeconds / distanceMeters) * 1000);
}

/** Returns km/h */
export function calculateSpeed(durationSeconds: number, distanceMeters: number): number {
  if (durationSeconds <= 0) return 0;
  return (distanceMeters / 1000) / (durationSeconds / 3600);
}

/** Calculate XP earned for a cardio session: 50 base + 5 per 10min + 10 per km */
export function calculateCardioXp(durationMinutes: number, distanceMeters: number): number {
  const baseXp = (durationMinutes >= 5 || distanceMeters >= 500) ? 50 : 0;
  const timeBonus = Math.floor(durationMinutes / 10) * 5;
  const distanceBonus = Math.floor(distanceMeters / 1000) * 10;
  return baseXp + timeBonus + distanceBonus;
}

/** Estimate calories for a cardio session */
export function estimateCardioCalories(
  activity: CardioActivity,
  durationMinutes: number,
  weightKg: number,
  perceivedDifficulty?: number,
): number {
  const metValues = CARDIO_MET[activity];
  let intensity: 'low' | 'moderate' | 'vigorous' = 'moderate';
  if (perceivedDifficulty) {
    if (perceivedDifficulty <= 3) intensity = 'low';
    else if (perceivedDifficulty >= 7) intensity = 'vigorous';
  }
  const met = metValues[intensity];
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}
