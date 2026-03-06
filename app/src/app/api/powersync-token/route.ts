import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const powersyncUrl = process.env.POWERSYNC_URL;
  const privateKeyPem = process.env.POWERSYNC_PRIVATE_KEY;

  if (!powersyncUrl || !privateKeyPem) {
    return NextResponse.json({ error: 'PowerSync not configured' }, { status: 500 });
  }

  // Import RSA private key
  const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, '\n'), 'RS256');

  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    sub: session.userId,
    iat: now,
    exp: now + 5 * 60, // 5 minutes (short-lived, auto-refreshed by PowerSync)
    aud: powersyncUrl,
    parameters: {
      user_id: session.userId,
    },
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'powersync-key' })
    .sign(privateKey);

  return NextResponse.json({
    token,
    powersync_url: powersyncUrl,
  });
}

// Also support POST for native apps using bearer token
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  // Verify the bearer token (same as session JWT)
  const { jwtVerify } = await import('jose');
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'AUTH_SECRET not configured' }, { status: 500 });
  }

  try {
    const bearerToken = authHeader.slice(7);
    const { payload } = await jwtVerify(
      bearerToken,
      new TextEncoder().encode(secret)
    );
    const userId = payload.userId as string;

    const powersyncUrl = process.env.POWERSYNC_URL;
    const privateKeyPem = process.env.POWERSYNC_PRIVATE_KEY;
    if (!powersyncUrl || !privateKeyPem) {
      return NextResponse.json({ error: 'PowerSync not configured' }, { status: 500 });
    }

    const privateKey = await importPKCS8(privateKeyPem.replace(/\\n/g, '\n'), 'RS256');
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({
      sub: userId,
      iat: now,
      exp: now + 5 * 60,
      aud: powersyncUrl,
      parameters: { user_id: userId },
    })
      .setProtectedHeader({ alg: 'RS256', kid: 'powersync-key' })
      .sign(privateKey);

    return NextResponse.json({ token, powersync_url: powersyncUrl });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
