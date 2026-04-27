'use client';

import Link from 'next/link';
import Image from 'next/image';

interface PublicNavbarProps {
  /** Show the Login button (hide when already on the login page) */
  showLogin?: boolean;
  /** Show the Request Invite button */
  showRequestInvite?: boolean;
}

/**
 * PublicNavbar
 *
 * Shared dark-green navbar used on public auth pages (login, request-access).
 * Matches the visual style of the landing page navbar.
 */
export function PublicNavbar({ showLogin = true, showRequestInvite = false }: PublicNavbarProps) {
  const hasButtons = showLogin || showRequestInvite;

  return (
    <nav
      className="sticky top-0 z-50 bg-gradient-to-br from-white to-gray-50 border-b-2 border-transparent bg-clip-padding"
      role="navigation"
      aria-label="Main navigation"
      style={{ borderImage: 'linear-gradient(90deg, #2AE6B2, #27C4E1, #178BE1) 1' }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] rounded-lg"
          aria-label="Quote.Vote home"
        >
          <Image
            src="/icons/android-chrome-192x192.png"
            alt="Quote.Vote"
            width={28}
            height={28}
            className="object-contain"
            priority
          />
          <span
            className="font-extrabold text-lg tracking-wide hidden sm:block select-none"
            style={{ color: '#0A2342' }}
          >
            Quote.Vote
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className="px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] hidden sm:block"
            style={{ color: '#475569' }}
          >
            Home
          </Link>

          <a
            href="https://opencollective.com/quotevote/donate"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] hidden md:block"
            style={{ color: '#475569' }}
            aria-label="Donate to Quote.Vote (opens in new tab)"
          >
            Donate
          </a>

          {hasButtons && (
            <div
              className="w-px h-5 mx-1 hidden sm:block"
              style={{ background: '#e2e8f0' }}
              aria-hidden
            />
          )}

          {showLogin && (
            <Link
              href="/auths/login"
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2"
              style={{
                color: '#16a34a',
                border: '1.5px solid rgba(22,163,74,0.35)',
                background: 'rgba(22,163,74,0.06)',
              }}
            >
              Login
            </Link>
          )}

          {showRequestInvite && (
            <Link
              href="/auths/request-access"
              className="px-4 py-2 text-sm font-semibold text-white rounded-lg transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16a34a] focus-visible:ring-offset-2"
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 2px 12px rgba(22,163,74,0.25)',
              }}
            >
              <span className="hidden sm:inline">Request Invite</span>
              <span className="sm:hidden">Join</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
