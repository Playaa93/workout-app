'use server';

import { db, morphoQuestions, morphoProfiles, users } from '@/db';
import { eq, asc } from 'drizzle-orm';

export type MorphoQuestion = {
  id: string;
  questionKey: string;
  questionTextFr: string;
  questionType: string;
  options: unknown;
  orderIndex: number;
};

export type MorphotypeResult = {
  primary: 'ectomorph' | 'mesomorph' | 'endomorph';
  secondary: 'ectomorph' | 'mesomorph' | 'endomorph' | null;
  scores: { ecto: number; meso: number; endo: number };
  strengths: string[];
  weaknesses: string[];
  recommendedExercises: string[];
  exercisesToAvoid: string[];
};

export async function getMorphoQuestions(): Promise<MorphoQuestion[]> {
  const questions = await db
    .select()
    .from(morphoQuestions)
    .where(eq(morphoQuestions.isActive, true))
    .orderBy(asc(morphoQuestions.orderIndex));

  return questions.map((q) => ({
    id: q.id,
    questionKey: q.questionKey,
    questionTextFr: q.questionTextFr,
    questionType: q.questionType,
    options: q.options,
    orderIndex: q.orderIndex,
  }));
}

export async function calculateMorphotype(
  answers: Record<string, string>
): Promise<MorphotypeResult> {
  // Initialize scores
  const scores = { ecto: 0, meso: 0, endo: 0 };

  // Get questions to process answers
  const questions = await getMorphoQuestions();

  // Process each answer
  for (const question of questions) {
    const answer = answers[question.questionKey];
    if (!answer) continue;

    const options = question.options as Array<{
      value: string;
      morpho_impact?: { ecto: number; meso: number; endo: number };
    }>;

    if (Array.isArray(options)) {
      const selectedOption = options.find((opt) => opt.value === answer);
      if (selectedOption?.morpho_impact) {
        scores.ecto += selectedOption.morpho_impact.ecto || 0;
        scores.meso += selectedOption.morpho_impact.meso || 0;
        scores.endo += selectedOption.morpho_impact.endo || 0;
      }
    }
  }

  // Determine primary and secondary morphotype
  const sortedTypes = Object.entries(scores).sort(([, a], [, b]) => b - a) as [
    'ecto' | 'meso' | 'endo',
    number
  ][];

  const morphoMap = {
    ecto: 'ectomorph' as const,
    meso: 'mesomorph' as const,
    endo: 'endomorph' as const,
  };

  const primary = morphoMap[sortedTypes[0][0]];
  const secondary = sortedTypes[1][1] > 2 ? morphoMap[sortedTypes[1][0]] : null;

  // Generate recommendations based on morphotype
  const recommendations = getMorphotypeRecommendations(primary, secondary);

  return {
    primary,
    secondary,
    scores,
    ...recommendations,
  };
}

function getMorphotypeRecommendations(
  primary: 'ectomorph' | 'mesomorph' | 'endomorph',
  secondary: 'ectomorph' | 'mesomorph' | 'endomorph' | null
) {
  const recommendations: Record<
    string,
    {
      strengths: string[];
      weaknesses: string[];
      recommended: string[];
      avoid: string[];
    }
  > = {
    ectomorph: {
      strengths: ['Endurance', 'Définition musculaire', 'Récupération rapide'],
      weaknesses: ['Prise de masse difficile', 'Force brute', 'Puissance'],
      recommended: [
        'Développé couché haltères',
        'Rowing barre',
        'Squat barre',
        'Soulevé de terre',
        'Dips pectoraux',
        'Tractions pronation',
      ],
      avoid: ['Trop de cardio', 'Séances trop longues (>60min)', 'Isolation excessive'],
    },
    mesomorph: {
      strengths: ['Prise de muscle facile', 'Force naturelle', 'Récupération', 'Polyvalence'],
      weaknesses: ['Peut prendre du gras si inactif', 'Tendance à la complaisance'],
      recommended: [
        'Développé couché barre',
        'Squat barre',
        'Soulevé de terre',
        'Développé militaire',
        'Tractions',
        'Rowing',
      ],
      avoid: ['Négliger le cardio', 'Entraînement monotone'],
    },
    endomorph: {
      strengths: ['Force naturelle', 'Puissance', 'Récupération', 'Masse musculaire'],
      weaknesses: ['Stockage de graisse facile', 'Définition difficile', 'Cardio'],
      recommended: [
        'Circuit training',
        'Supersets',
        'Squat',
        'Presse à cuisses',
        'Rowing',
        'Soulevé de terre roumain',
      ],
      avoid: ['Repos trop longs', 'Séances basse intensité', 'Négliger le cardio'],
    },
  };

  const base = recommendations[primary];

  // Mix in secondary traits if present
  if (secondary) {
    const secondaryRecs = recommendations[secondary];
    return {
      strengths: [...new Set([...base.strengths, secondaryRecs.strengths[0]])],
      weaknesses: [...new Set([...base.weaknesses, secondaryRecs.weaknesses[0]])],
      recommendedExercises: [...new Set([...base.recommended, ...secondaryRecs.recommended.slice(0, 2)])],
      exercisesToAvoid: [...new Set([...base.avoid, secondaryRecs.avoid[0]])],
    };
  }

  return {
    strengths: base.strengths,
    weaknesses: base.weaknesses,
    recommendedExercises: base.recommended,
    exercisesToAvoid: base.avoid,
  };
}

export async function saveMorphoProfile(
  answers: Record<string, string>,
  result: MorphotypeResult
) {
  // For now, create a demo user if none exists (we'll add proper auth later)
  let user = await db.select().from(users).limit(1);

  if (user.length === 0) {
    const [newUser] = await db
      .insert(users)
      .values({
        email: 'demo@workout.app',
        displayName: 'haze',
      })
      .returning();
    user = [newUser];
  }

  const userId = user[0].id;

  // Determine combined morphotype for DB enum
  const morphoTypeMap: Record<string, 'ectomorph' | 'mesomorph' | 'endomorph' | 'ecto_meso' | 'meso_endo' | 'ecto_endo'> = {
    'ectomorph-mesomorph': 'ecto_meso',
    'mesomorph-ectomorph': 'ecto_meso',
    'mesomorph-endomorph': 'meso_endo',
    'endomorph-mesomorph': 'meso_endo',
    'ectomorph-endomorph': 'ecto_endo',
    'endomorph-ectomorph': 'ecto_endo',
  };

  const combinedKey = result.secondary
    ? `${result.primary}-${result.secondary}`
    : result.primary;
  const primaryMorphotype = morphoTypeMap[combinedKey] || result.primary;

  // Upsert morpho profile
  await db
    .insert(morphoProfiles)
    .values({
      userId,
      primaryMorphotype,
      secondaryMorphotype: result.secondary,
      morphotypeScore: result.scores,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendedExercises: result.recommendedExercises,
      exercisesToAvoid: result.exercisesToAvoid,
      questionnaireResponses: answers,
    })
    .onConflictDoUpdate({
      target: morphoProfiles.userId,
      set: {
        primaryMorphotype,
        secondaryMorphotype: result.secondary,
        morphotypeScore: result.scores,
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
  const user = await db.select().from(users).limit(1);
  if (user.length === 0) return null;

  const profile = await db
    .select()
    .from(morphoProfiles)
    .where(eq(morphoProfiles.userId, user[0].id))
    .limit(1);

  return profile[0] || null;
}
