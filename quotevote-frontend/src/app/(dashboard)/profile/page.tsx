import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/SubHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProfileController } from '@/components/Profile/ProfileController';

export const metadata: Metadata = {
  title: 'Profile - Quote.Vote',
  description: 'View and manage your Quote.Vote profile',
};

/**
 * Profile Page (Server Component)
 *
 * Dashboard page for viewing and managing user profiles.
 * Profile and Control Panel rely on client-side state (forms, toggles),
 * so the interactive ProfileController is rendered as a Client Component
 * within a Suspense boundary.
 *
 * Route: /profile
 */
export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Profile" />
      <Suspense fallback={<LoadingSpinner />}>
        <ProfileController />
      </Suspense>
    </div>
  );
}
