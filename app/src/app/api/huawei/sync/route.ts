import { NextResponse } from 'next/server';
import { db, userSettings, workoutSessions } from '@/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';
import { importCardioSession } from '@/app/workout/cardio-actions';
import type { CardioActivity } from '@/db/schema';

const HUAWEI_HEALTH_API = 'https://health-api.cloud.huawei.com/healthkit/v1';
const HUAWEI_TOKEN_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token';

// Map Huawei activity types to our cardio activity enum
const HUAWEI_ACTIVITY_MAP: Record<number, CardioActivity> = {
  // Running
  1: 'running',
  258: 'running', // Indoor running
  // Walking
  7: 'walking',
  263: 'walking', // Indoor walking
  // Cycling
  2: 'cycling',
  259: 'cycling', // Indoor cycling
  260: 'cycling', // Spinning
  // Swimming
  4: 'swimming',
  262: 'swimming', // Pool swimming
  // Rowing
  16: 'rowing',
  280: 'rowing', // Indoor rowing
  // Jump rope
  10: 'jump_rope',
  // Elliptical
  12: 'elliptical',
  // Stepper / Stair climbing
  13: 'stepper',
  // HIIT
  15: 'hiit',
};

async function refreshTokenIfNeeded(userId: string): Promise<string | null> {
  const [settings] = await db
    .select({
      accessToken: userSettings.huaweiAccessToken,
      refreshToken: userSettings.huaweiRefreshToken,
      tokenExpiresAt: userSettings.huaweiTokenExpiresAt,
      clientId: userSettings.huaweiClientId,
      clientSecret: userSettings.huaweiClientSecret,
    })
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (!settings?.accessToken) return null;

  // Check if token is still valid (with 5 min buffer)
  const expiresAt = settings.tokenExpiresAt ? new Date(settings.tokenExpiresAt) : new Date(0);
  if (expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return settings.accessToken;
  }

  // Token expired, try refresh
  if (!settings.refreshToken || !settings.clientId || !settings.clientSecret) {
    return null;
  }

  const res = await fetch(HUAWEI_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      refresh_token: settings.refreshToken,
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) return null;

  const newExpiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);
  await db
    .update(userSettings)
    .set({
      huaweiAccessToken: data.access_token,
      huaweiRefreshToken: data.refresh_token || settings.refreshToken,
      huaweiTokenExpiresAt: newExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));

  return data.access_token;
}

export async function POST() {
  try {
    const userId = await requireUserId();
    const accessToken = await refreshTokenIfNeeded(userId);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Huawei non connecté ou token expiré. Reconnecte-toi.' },
        { status: 401 }
      );
    }

    // Get workouts from last 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Fetch exercise records from Huawei Health Kit
    const res = await fetch(`${HUAWEI_HEALTH_API}/activityRecord/getActivityRecord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        startTime: thirtyDaysAgo,
        endTime: now,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Erreur Huawei API: ${errData.errorCode || res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const records = data.activityRecord || [];

    // Get existing sessions to avoid duplicates (check by startedAt timestamp)
    const existingSessions = await db
      .select({ startedAt: workoutSessions.startedAt })
      .from(workoutSessions)
      .where(
        and(
          eq(workoutSessions.userId, userId),
          eq(workoutSessions.sessionType, 'cardio'),
          gte(workoutSessions.startedAt, new Date(thirtyDaysAgo)),
          lte(workoutSessions.startedAt, new Date(now))
        )
      );

    const existingTimestamps = new Set(
      existingSessions.map((s) => new Date(s.startedAt!).getTime())
    );

    let imported = 0;
    let skipped = 0;
    let totalXp = 0;

    for (const record of records) {
      const activityType = record.activityType;
      const activity = HUAWEI_ACTIVITY_MAP[activityType];
      if (!activity) {
        skipped++;
        continue;
      }

      const startTime = record.startTime;
      const endTime = record.endTime;
      if (!startTime || !endTime) {
        skipped++;
        continue;
      }

      // Check for duplicate
      if (existingTimestamps.has(startTime)) {
        skipped++;
        continue;
      }

      const durationMs = endTime - startTime;
      const durationMinutes = Math.round(durationMs / 60000);
      if (durationMinutes < 1) {
        skipped++;
        continue;
      }

      // Extract stats from summary
      const summary = record.activitySummary || {};
      const distanceMeters = summary.totalDistance ? Math.round(summary.totalDistance) : undefined;
      const caloriesBurned = summary.totalCalories ? Math.round(summary.totalCalories) : undefined;

      // Heart rate from dataSummary if available
      let avgHr: number | undefined;
      let maxHr: number | undefined;
      if (record.dataSummary) {
        for (const ds of record.dataSummary) {
          if (ds.dataTypeName === 'com.huawei.continuous.heart_rate.statistics') {
            avgHr = ds.fieldValues?.avg ? Math.round(ds.fieldValues.avg) : undefined;
            maxHr = ds.fieldValues?.max ? Math.round(ds.fieldValues.max) : undefined;
          }
        }
      }

      // Calculate pace if we have distance
      let avgPace: number | undefined;
      if (distanceMeters && distanceMeters > 0) {
        avgPace = Math.round((durationMinutes * 60 * 1000) / distanceMeters);
      }

      const result = await importCardioSession({
        activity,
        durationMinutes,
        distanceMeters,
        avgPaceSecondsPerKm: avgPace,
        avgHeartRate: avgHr,
        maxHeartRate: maxHr,
        caloriesBurned,
        dateTime: new Date(startTime).toISOString(),
      });

      imported++;
      totalXp += result.xpEarned;
      existingTimestamps.add(startTime);
    }

    return NextResponse.json({
      imported,
      skipped,
      totalXp,
      totalRecords: records.length,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur lors de la synchronisation' }, { status: 500 });
  }
}
