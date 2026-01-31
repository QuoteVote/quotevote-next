'use client';

/**
 * Dashboard Layout Component
 * 
 * Migrated from Scoreboard.jsx to Next.js App Router layout.
 * Provides shared layout for all dashboard routes including:
 * - MainNavBar navigation
 * - RequestInviteDialog
 * - Toast notifications (via sonner in root layout)
 * 
 * This layout wraps all dashboard pages and provides consistent UI structure.
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { MainNavBar } from '@/components/Navbars/MainNavBar';
import { RequestInviteDialog } from '@/components/RequestInviteDialog';
import { useAuthModal } from '@/context/AuthModalContext';

// Dashboard route configuration
const DASHBOARD_ROUTES = [
  { path: '/dashboard/search', name: 'Search' },
  { path: '/dashboard/post', name: 'Posts' },
  { path: '/dashboard/notifications', name: 'Notifications' },
  { path: '/dashboard/profile', name: 'My Profile' },
  { path: '/dashboard/control-panel', name: 'Control Panel' },
] as const;

/**
 * Get current page name from pathname
 */
function getPageName(pathname: string): string {
  const route = DASHBOARD_ROUTES.find((r) => pathname.startsWith(r.path));
  return route?.name || 'Home';
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactNode {
  const pathname = usePathname();
  const { isModalOpen, closeAuthModal } = useAuthModal();
  const setSelectedPage = useAppStore((state) => state.setSelectedPage);

  // Update selected page based on current route
  useEffect(() => {
    const pageName = getPageName(pathname);
    // Map page names to selectedPage values used by MainNavBar
    const pageMap: Record<string, string> = {
      'Search': 'home',
      'Posts': 'post',
      'Notifications': 'notifications',
      'My Profile': 'profile',
      'Control Panel': 'control-panel',
    };
    setSelectedPage(pageMap[pageName] || 'home');
  }, [pathname, setSelectedPage]);

  return (
    <div className="min-h-screen bg-background">
      <MainNavBar />
      <main className="pt-16">
        {children}
      </main>
      <RequestInviteDialog open={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
