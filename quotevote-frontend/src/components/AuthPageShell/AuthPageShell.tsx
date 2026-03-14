'use client';

import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar';

interface AuthPageShellProps {
  children: React.ReactNode;
  showLogin?: boolean;
}

/**
 * AuthPageShell
 *
 * Shared dark-page wrapper for all public auth pages.
 * Provides: navbar, dark background, radial glows, subtle dot-grid.
 */
export function AuthPageShell({ children, showLogin = true }: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080f1a' }}>
      <PublicNavbar showLogin={showLogin} showRequestInvite={false} />

      {/* Atmospheric layers */}
      <div className="fixed inset-0 pointer-events-none select-none" aria-hidden>
        {/* Top green radial glow */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(82,178,116,0.16) 0%, transparent 65%)',
          }}
        />
        {/* Bottom-left accent */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 50% 40% at -5% 90%, rgba(82,178,116,0.07) 0%, transparent 55%)',
          }}
        />
        {/* Dot grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(82,178,116,0.07) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* Page content */}
      <div className="relative flex-1 flex flex-col">{children}</div>
    </div>
  );
}
