'use client';

/**
 * Dashboard Layout Component
 *
 * Migrated from Scoreboard.jsx to Next.js App Router layout.
 * Provides shared layout for all dashboard routes including:
 * - MainNavBar navigation
 * - Sidebar (desktop persistent + mobile sheet)
 * - RequestInviteDialog
 * - Toast notifications (via sonner in root layout)
 *
 * This layout wraps all dashboard pages and provides consistent UI structure.
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';
import { MainNavBar } from '@/components/Navbars/MainNavBar';
import { Sidebar } from '@/components/Sidebar/Sidebar';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex pt-16">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="flex-1 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
      <RequestInviteDialog open={isModalOpen} onClose={closeAuthModal} />
    </div>
  );
}
