'use client';

import { ProfileController } from '@/components/Profile/ProfileController';
import { SubHeader } from '@/components/SubHeader';

/**
 * Profile Page
 * 
 * Dashboard page for viewing and managing user profiles.
 * Uses the ProfileController component which handles profile data fetching,
 * display, and editing functionality.
 * 
 * Route: /profile
 */
export default function ProfilePage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Profile" />
      <ProfileController />
    </div>
  );
}
