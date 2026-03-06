import { NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import { getSession } from '@/lib/auth';

// Cache parsed RSA key (env vars are immutable at runtime)
let cachedKey: Awaited<ReturnType<typeof importPKCS8>> | null = null;

async function getPrivateKey() {
  if (cachedKey) return cachedKey;
  const pem = process.env.POWERSYNC_PRIVATE_KEY;
  if (!pem) throw new Error('POWERSYNC_PRIVATE_KEY not configured');
  const normalized = pem.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  cachedKey = await importPKCS8(normalized, 'RS256');
  return cachedKey;
}

function buildPowerSyncJWT(userId: string, powersyncUrl: string, privateKey: Awaited<ReturnType<typeof importPKCS8>>) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    sub: userId,
    iat: now,
    exp: now + 5 * 60,
    aud: powersyncUrl,
    parameters: { user_id: userId },
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'powersync-key' })
    .sign(privateKey);
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const powersyncUrl = process.env.POWERSYNC_URL;
  if (!powersyncUrl) {
    return NextResponse.json({ error: 'PowerSync not configured' }, { status: 500 });
  }

  try {
    const privateKey = await getPrivateKey();
    const token = await buildPowerSyncJWT(session.userId, powersyncUrl, privateKey);
    return NextResponse.json({ token, powersync_url: powersyncUrl });
  } catch (err) {
    return NextResponse.json({ error: 'PowerSync key error' }, { status: 500 });
  }
}

// POST for native apps using bearer token
export async function POST(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
  }

  const { jwtVerify } = await import('jose');
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'AUTH_SECRET not configured' }, { status: 500 });
  }

  try {
    const { payload } = await jwtVerify(
      authHeader.slice(7),
      new TextEncoder().encode(secret)
    );
    const userId = payload.userId as string;

    const powersyncUrl = process.env.POWERSYNC_URL;
    if (!powersyncUrl) {
      return NextResponse.json({ error: 'PowerSync not configured' }, { status: 500 });
    }

    const privateKey = await getPrivateKey();
    const token = await buildPowerSyncJWT(userId, powersyncUrl, privateKey);
    return NextResponse.json({ token, powersync_url: powersyncUrl });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
