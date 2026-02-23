import type { ReactNode } from 'react';

/**
 * Auth Layout
 *
 * Shared layout for all authentication routes under the (auth) route group.
 * Does not render any extra chrome - simply forwards children.
 * Providers (Apollo, ErrorBoundary, Toaster) are already set up in the root layout.
 */
export default function AuthLayout({ children }: { children: ReactNode }): ReactNode {
    return <>{children}</>;
}
