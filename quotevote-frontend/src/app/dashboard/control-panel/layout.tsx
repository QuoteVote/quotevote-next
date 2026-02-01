'use client';

/**
 * Control Panel Layout
 * 
 * Nested layout for the admin control panel.
 * Migrated from Admin.jsx to Next.js App Router.
 * 
 * This layout provides admin-specific structure while inheriting
 * the dashboard layout's MainNavBar and RequestInviteDialog.
 */

import type { ReactNode } from 'react';

interface ControlPanelLayoutProps {
  children: ReactNode;
}

export default function ControlPanelLayout({
  children,
}: ControlPanelLayoutProps): ReactNode {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
