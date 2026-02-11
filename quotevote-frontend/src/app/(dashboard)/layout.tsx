import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Quote.Vote',
  description: 'Dashboard for managing your Quote.Vote account and content',
};

/**
 * Dashboard Layout
 * 
 * Shared layout for all dashboard pages. Provides consistent structure
 * and styling for dashboard routes under the (dashboard) route group.
 * 
 * The main layout (root) already provides:
 * - Apollo Client context
 * - Zustand store
 * - Eyebrow navigation
 * - Error boundaries
 * 
 * This layout adds dashboard-specific structure.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
    </div>
  );
}
