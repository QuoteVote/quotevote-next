import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isGuestReadableRoute } from "@/lib/dashboard-routes";
import { clearAuthCookie, resolveJwtSession } from "@/lib/auth/jwtSession";

// Routes that authenticated users should be redirected away from
const AUTH_ROUTES = [
  "/auths/login",
  "/auths/signup",
  "/auths/request-access",
  "/auths/forgot-password",
];

// Auth sub-routes that remain accessible even when logged in
const AUTH_ALWAYS_ACCESSIBLE = [
  "/auths/error-page",
  "/auths/investor-thanks",
  "/auths/password-reset",
];

// Authenticated route prefixes (require login unless guest-readable)
const PROTECTED_PREFIXES = [
  "/post",
  "/profile",
  "/notifications",
  "/settings",
  "/control-panel",
  "/manage-invites",
];

function redirectToLogin(request: NextRequest, pathname: string): NextResponse {
  const loginUrl = new URL("/auths/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  const response = NextResponse.redirect(loginUrl);
  clearAuthCookie(response);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("qv-token")?.value;
  const session = await resolveJwtSession(token);

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isProtected) {
    if (session.status !== "valid") {
      if (!isGuestReadableRoute(pathname)) {
        return redirectToLogin(request, pathname);
      }

      // Guest-readable route with a bad/expired cookie: clear it and continue.
      if (session.status === "expired" || session.status === "invalid") {
        const response = NextResponse.next();
        clearAuthCookie(response);
        return response;
      }

      return NextResponse.next();
    }

    if (pathname.startsWith("/control-panel")) {
      // Only authorize admin from a cryptographically verified token.
      // Without JWT_SECRET, defer to the page + API (never trust unsigned claims).
      if (session.verified && !session.admin) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  if (pathname.startsWith("/auths")) {
    const isAlwaysAccessible = AUTH_ALWAYS_ACCESSIBLE.some((route) => pathname.startsWith(route));
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (isAuthRoute && !isAlwaysAccessible) {
      if (session.status === "valid") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Expired / invalid / missing cookies must not block the login page.
      if (session.status === "expired" || session.status === "invalid") {
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
    "/post/:path*",
    "/profile/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/control-panel/:path*",
    "/manage-invites/:path*",
    "/auths/:path*",
  ],
};
