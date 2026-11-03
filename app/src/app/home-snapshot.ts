export type HomeSnapshot = {
  displayName: string | null;
  totalXp: number;
  streak: number;
  totalWorkouts: number;
  totalPRs: number;
  weeklySessions: number;
  hasMorphoProfile: boolean;
  activeSession: { id: string; sessionType: string | null } | null;
  nutrition: { cal: number; prot: number; carbs: number; fat: number; targetCal: number; targetProt: number } | null;
  recentSessions: {
    id: string; startedAt: string; templateName: string | null; muscleGroups: string[];
    sessionType: string | null; cardioActivity: string | null;
  }[];
  recentPRs: { exerciseName: string; value: number }[];
  bodyEvolution: { weight: number; bodyFat: number | null; weightDiff: number | null } | null;
};
