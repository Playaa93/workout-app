'use server';

import {
  db,
  workoutSessions,
  cardioIntervals,
  userGamification,
  xpTransactions,
} from '@/db';
import type { CardioActivity } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';
import { estimateCardioCalories, calculatePace, calculateSpeed, calculateCardioXp } from '@/lib/cardio-utils';
import { getLocalDateStr } from '@/lib/date-utils';
import { updateStreak } from '@/app/profile/actions';
import { getUserWeightKg } from '@/lib/user-utils';

export async function startCardioSession(activity: CardioActivity): Promise<string> {
  const userId = await requireUserId();

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
      sessionType: 'cardio',
      cardioActivity: activity,
      startedAt: new Date(),
    })
    .returning();

  return session.id;
}

export type CardioSessionData = {
  id: string;
  cardioActivity: CardioActivity;
  startedAt: Date;
  endedAt: Date | null;
  durationMinutes: number | null;
  distanceMeters: string | null;
  avgPaceSecondsPerKm: number | null;
  avgSpeedKmh: string | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  caloriesBurned: number | null;
  perceivedDifficulty: number | null;
  notes: string | null;
  intervals: {
    id: string;
    intervalNumber: number;
    durationSeconds: number | null;
    distanceMeters: string | null;
    paceSecondsPerKm: number | null;
    heartRate: number | null;
  }[];
};

export async function getCardioSession(sessionId: string): Promise<CardioSessionData | null> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));

  if (!session || session.sessionType !== 'cardio') return null;

  const intervals = await db
    .select()
    .from(cardioIntervals)
    .where(eq(cardioIntervals.sessionId, sessionId))
    .orderBy(cardioIntervals.intervalNumber);

  return {
    id: session.id,
    cardioActivity: session.cardioActivity!,
    startedAt: session.startedAt!,
    endedAt: session.endedAt,
    durationMinutes: session.durationMinutes,
    distanceMeters: session.distanceMeters,
    avgPaceSecondsPerKm: session.avgPaceSecondsPerKm,
    avgSpeedKmh: session.avgSpeedKmh,
    avgHeartRate: session.avgHeartRate,
    maxHeartRate: session.maxHeartRate,
    caloriesBurned: session.caloriesBurned,
    perceivedDifficulty: session.perceivedDifficulty,
    notes: session.notes,
    intervals: intervals.map((i) => ({
      id: i.id,
      intervalNumber: i.intervalNumber,
      durationSeconds: i.durationSeconds,
      distanceMeters: i.distanceMeters,
      paceSecondsPerKm: i.paceSecondsPerKm,
      heartRate: i.heartRate,
    })),
  };
}

export async function addCardioInterval(
  sessionId: string,
  data: {
    intervalNumber: number;
    durationSeconds?: number;
    distanceMeters?: number;
    paceSecondsPerKm?: number;
    heartRate?: number;
  }
): Promise<string> {
  const [interval] = await db
    .insert(cardioIntervals)
    .values({
      sessionId,
      intervalNumber: data.intervalNumber,
      durationSeconds: data.durationSeconds,
      distanceMeters: data.distanceMeters?.toString(),
      paceSecondsPerKm: data.paceSecondsPerKm,
      heartRate: data.heartRate,
    })
    .returning();

  return interval.id;
}

export async function endCardioSession(
  sessionId: string,
  data: {
    distanceMeters?: number;
    avgHeartRate?: number;
    maxHeartRate?: number;
    perceivedDifficulty?: number;
    notes?: string;
  }
): Promise<{
  xpEarned: number;
  duration: number;
  distanceMeters: number;
  avgPaceSecondsPerKm: number;
  caloriesBurned: number;
}> {
  const [session] = await db
    .select()
    .from(workoutSessions)
    .where(eq(workoutSessions.id, sessionId));

  if (!session) throw new Error('Session not found');

  const userId = await requireUserId();
  const endTime = new Date();
  const startTime = new Date(session.startedAt!);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

  const distanceM = data.distanceMeters || 0;
  const pace = distanceM > 0 ? calculatePace(durationSeconds, distanceM) : 0;
  const speed = distanceM > 0 ? calculateSpeed(durationSeconds, distanceM) : 0;

  // Get user weight for calorie calc
  const weightKg = await getUserWeightKg(userId);

  const caloriesBurned = estimateCardioCalories(
    session.cardioActivity!,
    durationMinutes,
    weightKg,
    data.perceivedDifficulty,
  );

  // Update session
  await db
    .update(workoutSessions)
    .set({
      endedAt: endTime,
      durationMinutes,
      distanceMeters: distanceM.toString(),
      avgPaceSecondsPerKm: pace,
      avgSpeedKmh: speed.toFixed(2),
      avgHeartRate: data.avgHeartRate,
      maxHeartRate: data.maxHeartRate,
      caloriesBurned,
      perceivedDifficulty: data.perceivedDifficulty,
      notes: data.notes,
    })
    .where(eq(workoutSessions.id, sessionId));

  // XP: 50 base + 5 per 10min + 10 per km
  const totalXp = calculateCardioXp(durationMinutes, distanceM);

  // Add XP transaction + update gamification (skip if no XP earned)
  const today = getLocalDateStr();
  if (totalXp > 0) {
    await Promise.all([
      db.insert(xpTransactions).values({
        userId,
        amount: totalXp,
        reason: 'cardio_completed',
        referenceType: 'workout_session',
        referenceId: sessionId,
      }),
      db
        .insert(userGamification)
        .values({
          userId,
          totalXp,
          lastActivityDate: today,
        })
        .onConflictDoUpdate({
          target: userGamification.userId,
          set: {
            totalXp: sql`${userGamification.totalXp} + ${totalXp}`,
            lastActivityDate: today,
            updatedAt: new Date(),
          },
        }),
    ]);
    await updateStreak(userId);
  }

  return {
    xpEarned: totalXp,
    duration: durationMinutes,
    distanceMeters: distanceM,
    avgPaceSecondsPerKm: pace,
    caloriesBurned,
  };
}

export async function importCardioSession(data: {
  activity: CardioActivity;
  durationMinutes: number;
  distanceMeters?: number;
  avgPaceSecondsPerKm?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  caloriesBurned?: number;
  dateTime?: string;
}): Promise<{ sessionId: string; xpEarned: number }> {
  // Validation
  if (!data.durationMinutes || data.durationMinutes <= 0) throw new Error('La durée doit être supérieure à 0');
  if (data.distanceMeters != null && data.distanceMeters < 0) throw new Error('La distance ne peut pas être négative');
  if (data.durationMinutes > 1440) throw new Error('La durée ne peut pas dépasser 24h');
  if (data.distanceMeters && data.distanceMeters > 500000) throw new Error('La distance ne peut pas dépasser 500 km');

  const userId = await requireUserId();

  const startedAt = data.dateTime ? new Date(data.dateTime) : new Date();
  const endedAt = new Date(startedAt.getTime() + data.durationMinutes * 60000);

  const distanceM = data.distanceMeters || 0;
  const durationSeconds = data.durationMinutes * 60;
  const pace = data.avgPaceSecondsPerKm ?? (distanceM > 0 ? calculatePace(durationSeconds, distanceM) : 0);
  const speed = distanceM > 0 ? calculateSpeed(durationSeconds, distanceM) : 0;

  // Calories: use provided value or estimate
  let calories = data.caloriesBurned;
  if (!calories) {
    const weightKg = await getUserWeightKg(userId);
    calories = estimateCardioCalories(data.activity, data.durationMinutes, weightKg);
  }

  const [session] = await db
    .insert(workoutSessions)
    .values({
      userId,
      sessionType: 'cardio',
      cardioActivity: data.activity,
      startedAt,
      endedAt,
      durationMinutes: data.durationMinutes,
      distanceMeters: distanceM.toString(),
      avgPaceSecondsPerKm: pace,
      avgSpeedKmh: speed.toFixed(2),
      avgHeartRate: data.avgHeartRate,
      maxHeartRate: data.maxHeartRate,
      caloriesBurned: calories,
    })
    .returning();

  // XP: 50 base + 5 per 10min + 10 per km
  const totalXp = calculateCardioXp(data.durationMinutes, distanceM);

  const todayStr = getLocalDateStr();
  if (totalXp > 0) {
    await Promise.all([
      db.insert(xpTransactions).values({
        userId,
        amount: totalXp,
        reason: 'cardio_completed',
        referenceType: 'workout_session',
        referenceId: session.id,
      }),
      db
        .insert(userGamification)
        .values({
          userId,
          totalXp,
          lastActivityDate: todayStr,
        })
        .onConflictDoUpdate({
          target: userGamification.userId,
          set: {
            totalXp: sql`${userGamification.totalXp} + ${totalXp}`,
            lastActivityDate: todayStr,
            updatedAt: new Date(),
          },
        }),
    ]);
    await updateStreak(userId);
  }

  return { sessionId: session.id, xpEarned: totalXp };
}
