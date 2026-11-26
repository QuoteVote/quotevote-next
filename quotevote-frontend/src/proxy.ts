import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  isGuestReadableRoute,
} from '@/lib/dashboard-routes';
import { clearAuthCookie, resolveJwtSession } from '@/lib/auth/jwtSession';
import { REFRESH_COOKIE_NAME } from '@/lib/auth';
import { postRefresh } from '@/lib/auth/session';
import { env } from '@/config/env';

// Routes that authenticated users should be redirected away from
const AUTH_ROUTES = ['/auths/login', '/auths/signup', '/auths/request-access', '/auths/forgot-password'];

// Auth sub-routes that remain accessible even when logged in
const AUTH_ALWAYS_ACCESSIBLE = ['/auths/error-page', '/auths/investor-thanks', '/auths/password-reset'];

// Authenticated route prefixes (require login unless guest-readable)
const PROTECTED_PREFIXES = ['/post', '/profile', '/notifications', '/settings', '/control-panel', '/manage-invites'];

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL('/auths/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  const response = NextResponse.redirect(loginUrl);
  clearAuthCookie(response);
  return response;
}

/**
 * A member whose 15-minute sign-in expired while they were away still holds a refresh
 * token. Renew it here, before deciding to redirect to sign-in (#804). Null when there's
 * no refresh cookie or the backend refuses it.
 */
async function renewFromCookie(request: NextRequest): Promise<string | null> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!refreshToken) return null;
  const data = await postRefresh(env.serverUrl, refreshToken);
  return data?.accessToken ?? null;
}

/** Sends the renewed token back as the `qv-token` cookie the client reads. */
function withRenewedToken(response: NextResponse, token: string | null): NextResponse {
  if (token) response.cookies.set('qv-token', token, { path: '/', sameSite: 'lax' });
  return response;
}

// Next.js 16 renamed the `middleware` file convention to `proxy` (same matcher and
// behavior). It runs on the Node.js runtime.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('qv-token')?.value;
  let session = await resolveJwtSession(token);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  let renewed: string | null = null;
  if (isProtected && session.status !== 'valid') {
    renewed = await renewFromCookie(request);
    if (renewed) session = await resolveJwtSession(renewed);
  }

  if (isProtected) {
    if (session.status !== 'valid') {
      if (!isGuestReadableRoute(pathname)) {
        return redirectToLogin(request, pathname);
      }

      // Guest-readable route with a bad/expired cookie: clear it and continue.
      if (session.status === 'expired' || session.status === 'invalid') {
        const response = NextResponse.next();
        clearAuthCookie(response);
        return response;
      }

      return NextResponse.next();
    }

    if (pathname.startsWith('/control-panel')) {
      // Only authorize admin from a cryptographically verified token.
      // Without JWT_SECRET, defer to the page + API (never trust unsigned claims).
      if (session.verified && !session.admin) {
        return withRenewedToken(NextResponse.redirect(new URL('/', request.url)), renewed);
      }
    }
    if (renewed) return withRenewedToken(NextResponse.next(), renewed);
  }

  if (pathname.startsWith('/auths')) {
    const isAlwaysAccessible = AUTH_ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (isAuthRoute && !isAlwaysAccessible) {
      if (session.status === 'valid') {
        return NextResponse.redirect(new URL('/', request.url));
      }

      // Expired / invalid / missing cookies must not block the login page.
      if (session.status === 'expired' || session.status === 'invalid') {
        const response = NextResponse.next();
        clearAuthCookie(response);
        return response;
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/post/:path*',
    '/profile/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/control-panel/:path*',
    '/manage-invites/:path*',
    '/auths/:path*',
  ],
};
