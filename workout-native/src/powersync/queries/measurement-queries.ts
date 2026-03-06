import { useQuery } from '@powersync/react';
import { useUserId } from '../auth-context';
import type { Database } from '../schema';

export type MeasurementRow = Database['measurements'];
export type ProgressPhotoRow = Database['progress_photos'];

export function useMeasurements(limit = 50) {
  const userId = useUserId();
  return useQuery<MeasurementRow>(
    `SELECT * FROM measurements WHERE user_id = ? ORDER BY measured_at DESC LIMIT ?`,
    [userId, limit]
  );
}

export function useLatestMeasurement() {
  const userId = useUserId();
  return useQuery<MeasurementRow>(
    `SELECT * FROM measurements WHERE user_id = ? ORDER BY measured_at DESC LIMIT 1`,
    [userId]
  );
}

export function useMeasurementHistory(field: string, limit = 30) {
  const userId = useUserId();
  const validFields = [
    'height', 'weight', 'body_fat_percentage', 'neck', 'shoulders', 'chest',
    'left_arm', 'right_arm', 'left_forearm', 'right_forearm', 'waist', 'abdomen',
    'hips', 'glutes', 'left_thigh', 'right_thigh', 'left_calf', 'right_calf',
    'wrist', 'ankle',
  ];
  const safeField = validFields.includes(field) ? field : 'weight';

  return useQuery<MeasurementRow>(
    `SELECT measured_at, ${safeField} FROM measurements
     WHERE user_id = ? AND ${safeField} IS NOT NULL
     ORDER BY measured_at DESC LIMIT ?`,
    [userId, limit]
  );
}

export function useProgressPhotos(limit = 20) {
  const userId = useUserId();
  return useQuery<ProgressPhotoRow>(
    `SELECT * FROM progress_photos WHERE user_id = ? ORDER BY taken_at DESC LIMIT ?`,
    [userId, limit]
  );
}

export function useMeasurementCount() {
  const userId = useUserId();
  return useQuery<{ count: number }>(
    `SELECT COUNT(*) as count FROM measurements WHERE user_id = ?`,
    [userId]
  );
}

export function useFirstAndLastMeasurement() {
  const userId = useUserId();
  const first = useQuery<MeasurementRow>(
    `SELECT * FROM measurements WHERE user_id = ? ORDER BY measured_at ASC LIMIT 1`,
    [userId]
  );
  const latest = useQuery<MeasurementRow>(
    `SELECT * FROM measurements WHERE user_id = ? ORDER BY measured_at DESC LIMIT 1`,
    [userId]
  );
  return { first, latest };
}
