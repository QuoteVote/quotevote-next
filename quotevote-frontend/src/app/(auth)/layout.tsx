'use client';

/**
 * Auth Layout Component
 * 
 * Layout wrapper for authentication pages.
 * Migrated from legacy Auth.jsx with full feature parity:
 * - AuthNavbar with brand text detection
 * - GuestFooter (conditionally shown)
 * - InfoSections for request-access page
 * - RequestInviteDialog
 * 
 * Note: Background images are handled by individual page components (Login, ForgotPassword, etc.)
 * which display a single image on the left side of the form.
 */

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { RequestInviteDialog } from '@/components/RequestInviteDialog';
import { useAuthModal } from '@/context/AuthModalContext';
import { AuthNavbar } from '@/components/Navbars/AuthNavbar';
import { GuestFooter } from '@/components/GuestFooter/GuestFooter';
import { InfoSections } from '@/components/RequestAccess/InfoSections';

// Route metadata for brand text (matching legacy route structure)
const routeMetadata: Record<string, { name: string; hideNavbar?: boolean }> = {
  '/login': { name: 'Login' },
  '/signup': { name: 'Sign Up' },
  '/forgot-password': { name: 'Forgot Password' },
  '/password-reset': { name: 'Reset Password' },
  '/auth/request-access': { name: 'Request Access' },
  '/invite': { name: 'Invite' },
  '/error-page': { name: 'Error' },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const { isModalOpen, closeAuthModal } = useAuthModal();
  const pathname = usePathname();

  // Reset body overflow on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'unset';
    }
  }, []);

  // Get active route metadata for brand text and navbar visibility
  const activeRoute = useMemo(() => {
    for (const [route, metadata] of Object.entries(routeMetadata)) {
      if (pathname.includes(route) || pathname === route) {
        return metadata;
      }
    }
    return { name: 'QuoteVote' };
  }, [pathname]);

  // Check if we're on request-access or invite page
  const isRequestAccessPage = useMemo(
    () => pathname.includes('request-access') || pathname.includes('/invite'),
    [pathname]
  );

  // Determine if footer should be shown (not on request-access and navbar not hidden)
  const showFooter = useMemo(
    () => !isRequestAccessPage && !activeRoute.hideNavbar,
    [isRequestAccessPage, activeRoute.hideNavbar]
  );

  return (
    <div
      className="flex flex-col min-h-screen w-full overflow-x-hidden"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {/* Header - AuthNavbar */}
      {!activeRoute.hideNavbar && (
        <div>
          <AuthNavbar brandText={activeRoute.name} />
        </div>
      )}

      {/* Body - takes full remaining height without background */}
      <div
        className="flex-1 min-h-0 overflow-auto w-full relative bg-transparent"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'auto',
          width: '100%',
        }}
      >
        <div className="relative z-[3]">
          {children}
        </div>
      </div>

      {/* Footer - conditionally shown */}
      {showFooter && (
        <div>
          <GuestFooter isRequestAccess={false} />
        </div>
      )}

      {/* InfoSections - only on request-access page */}
      {isRequestAccessPage && (
        <div>
          <InfoSections />
        </div>
      )}

      {/* Request Invite Dialog */}
      <RequestInviteDialog open={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
