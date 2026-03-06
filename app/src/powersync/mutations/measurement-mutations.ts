'use client';

import { usePowerSync } from '@powersync/react';
import { useUserId } from '../auth-context';
import { uuid, nowISO } from '../helpers';

export type MeasurementInput = {
  height?: number;
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

export function useMeasurementMutations() {
  const db = usePowerSync();
  const userId = useUserId();

  async function addMeasurement(data: MeasurementInput): Promise<string> {
    const id = uuid();
    const now = nowISO();

    await db.execute(
      `INSERT INTO measurements (
        id, user_id, measured_at, height, weight, body_fat_percentage,
        neck, shoulders, chest, left_arm, right_arm, left_forearm, right_forearm,
        waist, abdomen, hips, glutes, left_thigh, right_thigh,
        left_calf, right_calf, wrist, ankle, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId, now,
        data.height?.toString() ?? null,
        data.weight?.toString() ?? null,
        data.bodyFatPercentage?.toString() ?? null,
        data.neck?.toString() ?? null,
        data.shoulders?.toString() ?? null,
        data.chest?.toString() ?? null,
        data.leftArm?.toString() ?? null,
        data.rightArm?.toString() ?? null,
        data.leftForearm?.toString() ?? null,
        data.rightForearm?.toString() ?? null,
        data.waist?.toString() ?? null,
        data.abdomen?.toString() ?? null,
        data.hips?.toString() ?? null,
        data.glutes?.toString() ?? null,
        data.leftThigh?.toString() ?? null,
        data.rightThigh?.toString() ?? null,
        data.leftCalf?.toString() ?? null,
        data.rightCalf?.toString() ?? null,
        data.wrist?.toString() ?? null,
        data.ankle?.toString() ?? null,
        data.notes ?? null,
        now,
      ]
    );

    return id;
  }

  async function updateMeasurement(id: string, data: MeasurementInput): Promise<void> {
    await db.execute(
      `UPDATE measurements SET
        height = ?, weight = ?, body_fat_percentage = ?,
        neck = ?, shoulders = ?, chest = ?, left_arm = ?, right_arm = ?,
        left_forearm = ?, right_forearm = ?, waist = ?, abdomen = ?,
        hips = ?, glutes = ?, left_thigh = ?, right_thigh = ?,
        left_calf = ?, right_calf = ?, wrist = ?, ankle = ?, notes = ?
      WHERE id = ?`,
      [
        data.height?.toString() ?? null,
        data.weight?.toString() ?? null,
        data.bodyFatPercentage?.toString() ?? null,
        data.neck?.toString() ?? null,
        data.shoulders?.toString() ?? null,
        data.chest?.toString() ?? null,
        data.leftArm?.toString() ?? null,
        data.rightArm?.toString() ?? null,
        data.leftForearm?.toString() ?? null,
        data.rightForearm?.toString() ?? null,
        data.waist?.toString() ?? null,
        data.abdomen?.toString() ?? null,
        data.hips?.toString() ?? null,
        data.glutes?.toString() ?? null,
        data.leftThigh?.toString() ?? null,
        data.rightThigh?.toString() ?? null,
        data.leftCalf?.toString() ?? null,
        data.rightCalf?.toString() ?? null,
        data.wrist?.toString() ?? null,
        data.ankle?.toString() ?? null,
        data.notes ?? null,
        id,
      ]
    );
  }

  async function deleteMeasurement(id: string): Promise<void> {
    await db.execute(`DELETE FROM measurements WHERE id = ?`, [id]);
  }

  async function addProgressPhoto(
    photoUrl: string,
    photoType: string,
    measurementId?: string,
    notes?: string
  ): Promise<string> {
    const id = uuid();
    const now = nowISO();

    await db.execute(
      `INSERT INTO progress_photos (id, user_id, photo_url, photo_type, taken_at, measurement_id, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, photoUrl, photoType, now, measurementId ?? null, notes ?? null, now]
    );

    return id;
  }

  async function updatePhotoType(id: string, photoType: string): Promise<void> {
    await db.execute(`UPDATE progress_photos SET photo_type = ? WHERE id = ?`, [photoType, id]);
  }

  async function deletePhoto(id: string): Promise<void> {
    await db.execute(`DELETE FROM progress_photos WHERE id = ?`, [id]);
  }

  return {
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    addProgressPhoto,
    updatePhotoType,
    deletePhoto,
  };
}
