import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

const TOUCH_COOKIE = 'last_login_touch';
const TOUCH_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ userId: null, email: null });
  }

  // Throttle lastLoginAt updates to once per hour via cookie
  const cookieStore = await cookies();
  const lastTouch = cookieStore.get(TOUCH_COOKIE)?.value;
  const lastTouchMs = Number(lastTouch);
  if (!lastTouch || isNaN(lastTouchMs) || Date.now() - lastTouchMs > TOUCH_INTERVAL_MS) {
    db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, session.userId))
      .catch(() => {});
    cookieStore.set(TOUCH_COOKIE, String(Date.now()), { httpOnly: true, maxAge: 3600, path: '/' });
  }

  return NextResponse.json({ userId: session.userId, email: session.email, displayName: session.displayName });
}
