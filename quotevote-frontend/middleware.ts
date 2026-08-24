import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isGuestReadableDashboardRoute,
} from './src/lib/dashboard-routes';

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
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get('qv-token')?.value;

  if (pathname === '/dashboard/explore' || pathname.startsWith('/dashboard/explore/')) {
    return NextResponse.redirect(new URL(`/${search}`, request.url));
  }

  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      if (!isGuestReadableDashboardRoute(pathname)) {
        const loginUrl = new URL('/auths/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    }

    if (pathname.startsWith('/dashboard/control-panel')) {
      const payload = token ? decodeJwtPayload(token) : null;
      if (!payload || payload.admin !== true) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
  }

  if (pathname.startsWith('/auths')) {
    const isAlwaysAccessible = AUTH_ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (token && isAuthRoute && !isAlwaysAccessible) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auths/:path*'],
};
