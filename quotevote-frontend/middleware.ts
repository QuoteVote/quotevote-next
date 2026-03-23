import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that authenticated users should be redirected away from
const AUTH_ROUTES = ['/auths/login', '/auths/signup', '/auths/request-access', '/auths/forgot-password'];

// Auth sub-routes that remain accessible even when logged in
const AUTH_ALWAYS_ACCESSIBLE = ['/auths/error-page', '/auths/investor-thanks', '/auths/password-reset'];

/**
 * Lightweight JWT payload decode for edge runtime.
 * Does NOT verify the signature — only reads the payload claims.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('qv-token')?.value;

  // Protect /dashboard/* — redirect to login if no token
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/auths/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Admin-only route protection for /dashboard/control-panel
    if (pathname.startsWith('/dashboard/control-panel')) {
      const payload = decodeJwtPayload(token);
      if (!payload || payload.admin !== true) {
        return NextResponse.redirect(new URL('/dashboard/explore', request.url));
      }
    }
  }

  // Redirect authenticated users away from auth pages (except always-accessible ones)
  if (pathname.startsWith('/auths')) {
    const isAlwaysAccessible = AUTH_ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (token && isAuthRoute && !isAlwaysAccessible) {
      return NextResponse.redirect(new URL('/dashboard/explore', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auths/:path*'],
};
