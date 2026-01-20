import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(_request: NextRequest) {
  // For now, just pass through all requests
  // Auth middleware will be added later
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - manifest.json (PWA manifest)
     * - sw.js (service worker)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|manifest\\.json|sw\\.js).*)',
  ],
};
