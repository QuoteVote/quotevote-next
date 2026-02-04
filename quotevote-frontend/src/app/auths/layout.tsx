'use client';

/**
 * Auth Layout Component
 * 
 * Layout wrapper for authentication pages.
 * Migrated from legacy Auth.jsx with full feature parity:
 * - AuthNavbar with brand text detection
 * - Random background image selection (matching legacy behavior)
 * - GuestFooter (conditionally shown)
 * - InfoSections for request-access page
 * - RequestInviteDialog
 * 
 * Background images are randomly selected on first load, matching the legacy behavior.
 * Individual page components may also display images on the left side of forms.
 */

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { RequestInviteDialog } from '@/components/RequestInviteDialog';
import { useAuthModal } from '@/context/AuthModalContext';
import { AuthNavbar } from '@/components/Navbars/AuthNavbar';
import { GuestFooter } from '@/components/GuestFooter/GuestFooter';
import { InfoSections } from '@/components/RequestAccess/InfoSections';

// Available background images (matching legacy Auth.jsx)
const backgroundImages = [
  'viviana-rishe-UC8fvOyG5pU-unsplash.jpg',
  'steph-smith-3jYcQf9oiJ8-unsplash.jpg',
  'sergio-rodriguez-rrlEOXRmMAA-unsplash.jpg',
  'sergio-otoya-gCNh426vB30-unsplash.jpg',
  'rondell-chaz-mabunga-EHLKkMDxe3M-unsplash.jpg',
  'rommel-paras-wrHnE3kMplg-unsplash.jpg',
  'peter-thomas-efLcMHXtrg0-unsplash.jpg',
  'julia-caesar-jeXkw2HR1SU-unsplash.jpg',
  'ehmir-bautista-JjDqyWuWZyU-unsplash.jpg',
  'adam-navarro-qXcl3z7_AOc-unsplash.jpg',
  'actionvance-guy5aS3GvgA-unsplash.jpg',
] as const;

/**
 * Get a random background image
 * This function is used as a lazy initializer for useState
 */
function getRandomBackgroundImage(): string {
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  return backgroundImages[randomIndex] ?? '';
}

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
  // Use lazy initializer to select random background image on first render only
  const [selectedBackground] = useState<string>(getRandomBackgroundImage);

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

  // Background image URL
  const backgroundImageUrl = selectedBackground
    ? `/assets/bg/${selectedBackground}`
    : '/assets/Mountain.png';

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

      {/* Body - takes full remaining height with background image */}
      <div
        className="flex-1 min-h-0 overflow-auto w-full relative"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflow: 'auto',
          width: '100%',
          backgroundImage: `url('${backgroundImageUrl}')`,
          backgroundPosition: 'left',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
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
