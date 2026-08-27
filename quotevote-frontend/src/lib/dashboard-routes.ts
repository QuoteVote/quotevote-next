/**
 * Route access rules for guest (logged-out) sessions.
 * Read-only routes are browsable without auth; participation is gated client-side.
 */

const GUEST_READABLE_PREFIXES = ['/post'] as const;

const AUTH_REQUIRED_PREFIXES = [
  '/settings',
  '/notifications',
  '/manage-invites',
  '/control-panel',
] as const;

/** Public profile pages: /profile/:username (not /profile alone). */
function isPublicProfileRoute(pathname: string): boolean {
  return /^\/profile\/[^/]+/.test(pathname);
}

export function isGuestReadableRoute(pathname: string): boolean {
  if (GUEST_READABLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return isPublicProfileRoute(pathname);
}

export function isAuthRequiredRoute(pathname: string): boolean {
  if (pathname === '/profile') return true;
  return AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
