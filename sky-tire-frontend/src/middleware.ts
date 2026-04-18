import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin routes.
 * Checks for the presence of a token in the request.
 * For production, this should ideally verify the JWT if cookies are used.
 * Since we use localStorage, this middleware can only check client-side state 
 * for non-static routes if we store a session cookie.
 * 
 * NOTE: localStorage is NOT accessible in Middleware. 
 * If you need server-side protection, you MUST use cookies.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Example: Protected Admin routes
  if (pathname.startsWith('/admin')) {
    // If using cookies:
    // const token = request.cookies.get('token');
    // if (!token) {
    //   return NextResponse.redirect(new URL('/auth/login', request.url));
    // }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/admin/:path*'],
};
