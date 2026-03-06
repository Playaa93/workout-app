import { useQuery } from '@powersync/react';
import { useUserId } from '../auth-context';
import type { Database } from '../schema';

export type MorphoProfileRow = Database['morpho_profiles'];
export type MorphoQuestionRow = Database['morpho_questions'];

export function useMorphoProfile() {
  const userId = useUserId();
  return useQuery<MorphoProfileRow>(
    `SELECT * FROM morpho_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
}

export function useMorphoQuestions() {
  return useQuery<MorphoQuestionRow>(
    `SELECT * FROM morpho_questions WHERE is_active = 1 ORDER BY order_index ASC`
  );
}
