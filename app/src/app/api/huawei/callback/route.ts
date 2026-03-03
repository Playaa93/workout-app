import { NextRequest, NextResponse } from 'next/server';
import { db, userSettings } from '@/db';
import { eq } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth';

const HUAWEI_TOKEN_URL = 'https://oauth-login.cloud.huawei.com/oauth2/v3/token';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3015';

    if (error) {
      return NextResponse.redirect(
        `${baseUrl}/profile?huawei=error&message=${encodeURIComponent(error)}`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${baseUrl}/profile?huawei=error&message=${encodeURIComponent('Code manquant')}`
      );
    }

    // Get user's client credentials
    const [settings] = await db
      .select({
        clientId: userSettings.huaweiClientId,
        clientSecret: userSettings.huaweiClientSecret,
      })
      .from(userSettings)
      .where(eq(userSettings.userId, userId));

    if (!settings?.clientId || !settings?.clientSecret) {
      return NextResponse.redirect(
        `${baseUrl}/profile?huawei=error&message=${encodeURIComponent('Credentials manquants')}`
      );
    }

    const redirectUri = `${baseUrl}/api/huawei/callback`;

    // Exchange authorization code for tokens
    const tokenRes = await fetch(HUAWEI_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: settings.clientId,
        client_secret: settings.clientSecret,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || 'Erreur token';
      return NextResponse.redirect(
        `${baseUrl}/profile?huawei=error&message=${encodeURIComponent(errMsg)}`
      );
    }

    // Store tokens
    const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000);

    await db
      .update(userSettings)
      .set({
        huaweiAccessToken: tokenData.access_token,
        huaweiRefreshToken: tokenData.refresh_token || null,
        huaweiTokenExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));

    return NextResponse.redirect(`${baseUrl}/profile?huawei=success`);
  } catch {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3015';
    return NextResponse.redirect(
      `${baseUrl}/profile?huawei=error&message=${encodeURIComponent('Erreur authentification')}`
    );
  }
}
