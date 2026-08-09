/**
 * Dashboard route access rules for guest (logged-out) sessions.
 * Read-only routes are browsable without auth; participation is gated client-side.
 */

const GUEST_READABLE_PREFIXES = ['/', '/dashboard/post'] as const;

const AUTH_REQUIRED_PREFIXES = [
  '/dashboard/settings',
  '/dashboard/notifications',
  '/dashboard/manage-invites',
  '/dashboard/control-panel',
] as const;

/** Public profile pages: /dashboard/profile/:username (not /dashboard/profile alone). */
function isPublicProfileRoute(pathname: string): boolean {
  return /^\/dashboard\/profile\/[^/]+/.test(pathname);
}

export function isGuestReadableDashboardRoute(pathname: string): boolean {
  if (GUEST_READABLE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return isPublicProfileRoute(pathname);
}

export function isAuthRequiredDashboardRoute(pathname: string): boolean {
  if (pathname === '/dashboard/profile') return true;
  return AUTH_REQUIRED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
