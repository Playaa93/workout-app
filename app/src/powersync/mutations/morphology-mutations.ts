'use client';

import { usePowerSync } from '@powersync/react';
import { useUserId } from '../auth-context';
import { uuid, nowISO, toJsonObjText, toJsonText } from '../helpers';

export function useMorphologyMutations() {
  const db = usePowerSync();
  const userId = useUserId();

  async function saveMorphoProfile(data: {
    primaryMorphotype: string;
    secondaryMorphotype?: string | null;
    morphotypeScore: Record<string, unknown>;
    torsoProportion?: string;
    armProportion?: string;
    legProportion?: string;
    strengths: string[];
    weaknesses: string[];
    recommendedExercises: string[];
    exercisesToAvoid: string[];
    questionnaireResponses: Record<string, string>;
  }): Promise<void> {
    const now = nowISO();

    // Check if profile exists
    const existing = await db.getOptional<{ id: string }>(
      `SELECT id FROM morpho_profiles WHERE user_id = ?`,
      [userId]
    );

    if (existing) {
      await db.execute(
        `UPDATE morpho_profiles SET
          primary_morphotype = ?, secondary_morphotype = ?,
          morphotype_score = ?, torso_proportion = ?,
          arm_proportion = ?, leg_proportion = ?,
          strengths = ?, weaknesses = ?,
          recommended_exercises = ?, exercises_to_avoid = ?,
          questionnaire_responses = ?, updated_at = ?
        WHERE user_id = ?`,
        [
          data.primaryMorphotype,
          data.secondaryMorphotype ?? null,
          toJsonObjText(data.morphotypeScore),
          data.torsoProportion ?? null,
          data.armProportion ?? null,
          data.legProportion ?? null,
          toJsonText(data.strengths),
          toJsonText(data.weaknesses),
          toJsonText(data.recommendedExercises),
          toJsonText(data.exercisesToAvoid),
          toJsonObjText(data.questionnaireResponses),
          now,
          userId,
        ]
      );
    } else {
      const id = uuid();
      await db.execute(
        `INSERT INTO morpho_profiles (
          id, user_id, primary_morphotype, secondary_morphotype,
          morphotype_score, torso_proportion, arm_proportion, leg_proportion,
          strengths, weaknesses, recommended_exercises, exercises_to_avoid,
          questionnaire_responses, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, userId,
          data.primaryMorphotype,
          data.secondaryMorphotype ?? null,
          toJsonObjText(data.morphotypeScore),
          data.torsoProportion ?? null,
          data.armProportion ?? null,
          data.legProportion ?? null,
          toJsonText(data.strengths),
          toJsonText(data.weaknesses),
          toJsonText(data.recommendedExercises),
          toJsonText(data.exercisesToAvoid),
          toJsonObjText(data.questionnaireResponses),
          now, now,
        ]
      );
    }
  }

  return { saveMorphoProfile };
}
