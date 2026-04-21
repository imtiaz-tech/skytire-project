import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin routes at the edge.
 * Checks for the presence of a session cookie.
 * The actual role check happens client-side in admin/layout.tsx.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes: require session cookie
  if (pathname.startsWith('/admin')) {
    const sessionCookie = request.cookies.get('sessionId');
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
