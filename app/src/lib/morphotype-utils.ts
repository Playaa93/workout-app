import { db, morphoProfiles } from '@/db';
import { eq } from 'drizzle-orm';
import type { MorphotypeResult } from '@/app/morphology/types';
import { requireUserId } from '@/lib/auth';

export async function getUserMorphotype(): Promise<MorphotypeResult | null> {
  const userId = await requireUserId();

  const profile = await db
    .select()
    .from(morphoProfiles)
    .where(eq(morphoProfiles.userId, userId))
    .limit(1);

  if (profile.length === 0) return null;

  const stored = profile[0];
  const scores = stored.morphotypeScore as Record<string, unknown> | null;
  if (!scores) return null;

  return {
    globalType: (scores.globalType as 'longiligne' | 'breviligne' | 'balanced') || 'balanced',
    structure: (scores.structure as MorphotypeResult['structure']) || {
      frameSize: 'medium',
      shoulderToHip: 'medium',
      ribcageDepth: 'medium',
    },
    proportions: (scores.proportions as MorphotypeResult['proportions']) || {
      torsoLength: stored.torsoProportion || 'medium',
      armLength: stored.armProportion || 'medium',
      femurLength: stored.legProportion || 'medium',
      kneeValgus: 'none',
    },
    mobility: (scores.mobility as MorphotypeResult['mobility']) || {
      ankleDorsiflexion: 'average',
      posteriorChain: 'average',
      wristMobility: 'none',
    },
    insertions: (scores.insertions as MorphotypeResult['insertions']) || {
      biceps: 'medium',
      calves: 'medium',
      chest: 'medium',
    },
    metabolism: (scores.metabolism as MorphotypeResult['metabolism']) || {
      weightTendency: 'balanced',
      naturalStrength: 'average',
      bestResponders: 'none',
    },
    squat: { exercise: 'Squat', advantages: [], disadvantages: [], variants: [], tips: [] },
    deadlift: { exercise: 'Deadlift', advantages: [], disadvantages: [], variants: [], tips: [] },
    bench: { exercise: 'Bench', advantages: [], disadvantages: [], variants: [], tips: [] },
    curls: { exercise: 'Curls', advantages: [], disadvantages: [], variants: [], tips: [] },
    mobilityWork: [],
    primary: stored.primaryMorphotype,
    secondary: stored.secondaryMorphotype,
    scores: {
      ecto: (scores.ecto as number) || 0,
      meso: (scores.meso as number) || 0,
      endo: (scores.endo as number) || 0,
    },
    strengths: stored.strengths || [],
    weaknesses: stored.weaknesses || [],
    recommendedExercises: stored.recommendedExercises || [],
    exercisesToAvoid: stored.exercisesToAvoid || [],
  };
}
