import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { jwtVerify } from 'jose';
import { applyCrudOperations, UploadError } from '@/lib/powersync-upload';

async function getUserIdFromRequest(request: Request): Promise<string | null> {
  // Try cookie-based session first (web)
  const session = await getSession();
  if (session) return session.userId;

  // Try bearer token (native)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    try {
      const { payload } = await jwtVerify(
        authHeader.slice(7),
        new TextEncoder().encode(secret)
      );
      return (payload.userId as string) || null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const body = await request.json();
    await applyCrudOperations(body?.operations, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UploadError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    const cause = error instanceof Error ? error.cause ?? error : error;
    console.error('PowerSync upload transaction failed', {
      code: typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : 'unknown',
    });
    return NextResponse.json({ error: 'Upload failed. Retry the transaction.' }, { status: 500 });
  }
}
