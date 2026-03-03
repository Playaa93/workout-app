import { db, nutritionProfiles } from '@/db';
import { eq } from 'drizzle-orm';

const DEFAULT_WEIGHT_KG = 75;

export async function getUserWeightKg(userId: string): Promise<number> {
  const [profile] = await db
    .select({ weight: nutritionProfiles.weight })
    .from(nutritionProfiles)
    .where(eq(nutritionProfiles.userId, userId));
  const w = profile?.weight ? parseFloat(profile.weight) : 0;
  return w > 0 ? w : DEFAULT_WEIGHT_KG;
}
