import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that authenticated users should be redirected away from
const AUTH_ROUTES = ['/auths/login', '/auths/signup', '/auths/request-access', '/auths/forgot-password'];

// Auth sub-routes that remain accessible even when logged in
const AUTH_ALWAYS_ACCESSIBLE = ['/auths/error-page', '/auths/investor-thanks', '/auths/password-reset'];

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
  }

  // Redirect authenticated users away from auth pages (except always-accessible ones)
  if (pathname.startsWith('/auths')) {
    const isAlwaysAccessible = AUTH_ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (token && isAuthRoute && !isAlwaysAccessible) {
      return NextResponse.redirect(new URL('/dashboard/search', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auths/:path*'],
};
