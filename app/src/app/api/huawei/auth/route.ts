import { NextResponse } from 'next/server';
import { db, userSettings } from '@/db';
import { eq } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';

const HUAWEI_AUTH_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/authorize';

export async function GET() {
  try {
    const userId = await requireUserId();

    const [settings] = await db
      .select({
        clientId: userSettings.huaweiClientId,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (!settings?.clientId) {
      return NextResponse.json(
        { error: 'Client ID Huawei non configuré. Va dans Profil > Paramètres.' },
        { status: 400 }
      );
    }

    // Build the callback URL from the request
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3015';
    const redirectUri = `${baseUrl}/api/huawei/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: settings.clientId,
      redirect_uri: redirectUri,
      scope: 'openid https://www.huawei.com/healthkit/activity.read https://www.huawei.com/healthkit/heartrate.read https://www.huawei.com/healthkit/calories.read https://www.huawei.com/healthkit/distance.read',
      access_type: 'offline',
    });

    return NextResponse.redirect(`${HUAWEI_AUTH_URL}?${params.toString()}`);
  } catch {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }
}
