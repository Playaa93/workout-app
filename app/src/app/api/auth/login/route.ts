import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(secret);
}

// JSON login endpoint for native app (returns JWT instead of setting cookie)
export async function POST(request: Request) {
  const body = await request.json();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email et mot de passe requis.' }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect.' }, { status: 401 });
  }

  // Update lastLoginAt
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  // Generate JWT (same format as session cookie)
  const token = await new SignJWT({ userId: user.id, email: user.email, displayName: user.displayName ?? null })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
  });
}
