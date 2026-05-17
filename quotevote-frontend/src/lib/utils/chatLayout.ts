/**
 * Dashboard routes that render the refined messaging panel persistently on
 * the right side at the `xl` breakpoint (via DashboardSidebars or the
 * explore page's own sidebars).
 *
 * On these routes at xl+ the slide-in chat drawer is suppressed so it does
 * not duplicate the persistent panel.
 */
const PERSISTENT_CHAT_PANEL_ROUTES = [
  '/dashboard/profile',
  '/dashboard/settings',
  '/dashboard/explore',
] as const;

/**
 * Returns true when the given pathname renders the persistent messaging
 * panel (so the slide-in chat drawer is redundant at xl+).
 */
export function routeHasPersistentChatPanel(pathname: string): boolean {
  return PERSISTENT_CHAT_PANEL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
