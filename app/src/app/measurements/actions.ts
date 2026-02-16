'use server';

import { db, measurements, progressPhotos } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';

export type MeasurementData = {
  id: string;
  measuredAt: Date;
  weight: string | null;
  bodyFatPercentage: string | null;
  neck: string | null;
  shoulders: string | null;
  chest: string | null;
  leftArm: string | null;
  rightArm: string | null;
  leftForearm: string | null;
  rightForearm: string | null;
  waist: string | null;
  abdomen: string | null;
  hips: string | null;
  glutes: string | null;
  leftThigh: string | null;
  rightThigh: string | null;
  leftCalf: string | null;
  rightCalf: string | null;
  wrist: string | null;
  ankle: string | null;
  notes: string | null;
};

export type ProgressPhotoData = {
  id: string;
  photoUrl: string;
  thumbnailUrl: string | null;
  photoType: string;
  takenAt: Date;
  measurementId: string | null;
  notes: string | null;
};

export type MeasurementInput = {
  weight?: number;
  bodyFatPercentage?: number;
  neck?: number;
  shoulders?: number;
  chest?: number;
  leftArm?: number;
  rightArm?: number;
  leftForearm?: number;
  rightForearm?: number;
  waist?: number;
  abdomen?: number;
  hips?: number;
  glutes?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
  wrist?: number;
  ankle?: number;
  notes?: string;
};

// Get all measurements for user
export async function getMeasurements(limit = 50): Promise<MeasurementData[]> {
  const userId = await requireUserId();

  const result = await db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(desc(measurements.measuredAt))
    .limit(limit);

  return result.map((m) => ({
    ...m,
    measuredAt: m.measuredAt!,
  }));
}

// Get latest measurement
export async function getLatestMeasurement(): Promise<MeasurementData | null> {
  const userId = await requireUserId();

  const [result] = await db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(desc(measurements.measuredAt))
    .limit(1);

  if (!result) return null;

  return {
    ...result,
    measuredAt: result.measuredAt!,
  };
}

// Add new measurement
export async function addMeasurement(data: MeasurementInput): Promise<string> {
  const userId = await requireUserId();

  const [result] = await db
    .insert(measurements)
    .values({
      userId: userId,
      measuredAt: new Date(),
      weight: data.weight?.toString(),
      bodyFatPercentage: data.bodyFatPercentage?.toString(),
      neck: data.neck?.toString(),
      shoulders: data.shoulders?.toString(),
      chest: data.chest?.toString(),
      leftArm: data.leftArm?.toString(),
      rightArm: data.rightArm?.toString(),
      leftForearm: data.leftForearm?.toString(),
      rightForearm: data.rightForearm?.toString(),
      waist: data.waist?.toString(),
      abdomen: data.abdomen?.toString(),
      hips: data.hips?.toString(),
      glutes: data.glutes?.toString(),
      leftThigh: data.leftThigh?.toString(),
      rightThigh: data.rightThigh?.toString(),
      leftCalf: data.leftCalf?.toString(),
      rightCalf: data.rightCalf?.toString(),
      wrist: data.wrist?.toString(),
      ankle: data.ankle?.toString(),
      notes: data.notes,
    })
    .returning();

  return result.id;
}

// Get progress photos
export async function getProgressPhotos(limit = 20): Promise<ProgressPhotoData[]> {
  const userId = await requireUserId();

  const result = await db
    .select()
    .from(progressPhotos)
    .where(eq(progressPhotos.userId, userId))
    .orderBy(desc(progressPhotos.takenAt))
    .limit(limit);

  return result.map((p) => ({
    ...p,
    takenAt: p.takenAt!,
  }));
}

// Add progress photo
export async function addProgressPhoto(
  photoUrl: string,
  photoType: 'front' | 'back' | 'side_left' | 'side_right',
  measurementId?: string,
  notes?: string
): Promise<string> {
  const userId = await requireUserId();

  const [result] = await db
    .insert(progressPhotos)
    .values({
      userId: userId,
      photoUrl,
      photoType,
      measurementId,
      notes,
      takenAt: new Date(),
    })
    .returning();

  return result.id;
}

// Delete measurement
export async function deleteMeasurement(id: string): Promise<void> {
  await db.delete(measurements).where(eq(measurements.id, id));
}

// Delete photo
export async function deletePhoto(id: string): Promise<void> {
  await db.delete(progressPhotos).where(eq(progressPhotos.id, id));
}

// Get measurement history for charts (specific fields over time)
export async function getMeasurementHistory(
  field: keyof MeasurementData,
  limit = 30
): Promise<{ date: string; value: number }[]> {
  const userId = await requireUserId();

  const result = await db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(desc(measurements.measuredAt))
    .limit(limit);

  return result
    .filter((m) => m[field as keyof typeof m] !== null)
    .map((m) => ({
      date: new Date(m.measuredAt!).toISOString().split('T')[0],
      value: parseFloat(m[field as keyof typeof m] as string),
    }))
    .reverse();
}

// Calculate changes between measurements
export async function getProgressSummary(): Promise<{
  weightChange: number | null;
  waistChange: number | null;
  chestChange: number | null;
  armChange: number | null;
  daysSinceFirst: number;
  totalMeasurements: number;
}> {
  const userId = await requireUserId();

  const allMeasurements = await db
    .select()
    .from(measurements)
    .where(eq(measurements.userId, userId))
    .orderBy(desc(measurements.measuredAt));

  if (allMeasurements.length < 2) {
    return {
      weightChange: null,
      waistChange: null,
      chestChange: null,
      armChange: null,
      daysSinceFirst: 0,
      totalMeasurements: allMeasurements.length,
    };
  }

  const latest = allMeasurements[0];
  const first = allMeasurements[allMeasurements.length - 1];

  const calcChange = (latestVal: string | null, firstVal: string | null) => {
    if (!latestVal || !firstVal) return null;
    return parseFloat(latestVal) - parseFloat(firstVal);
  };

  const daysSinceFirst = Math.floor(
    (new Date(latest.measuredAt!).getTime() - new Date(first.measuredAt!).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // For arms, average left and right
  const latestArm =
    latest.leftArm && latest.rightArm
      ? (parseFloat(latest.leftArm) + parseFloat(latest.rightArm)) / 2
      : null;
  const firstArm =
    first.leftArm && first.rightArm
      ? (parseFloat(first.leftArm) + parseFloat(first.rightArm)) / 2
      : null;

  return {
    weightChange: calcChange(latest.weight, first.weight),
    waistChange: calcChange(latest.waist, first.waist),
    chestChange: calcChange(latest.chest, first.chest),
    armChange: latestArm && firstArm ? latestArm - firstArm : null,
    daysSinceFirst,
    totalMeasurements: allMeasurements.length,
  };
}
