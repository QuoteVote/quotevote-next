'use client';

/**
 * Profile Page
 * 
 * Dashboard profile page for viewing and editing user profile.
 * Shows the logged-in user's profile when no username is provided.
 * Migrated from Profile component.
 */

import { ProfileController } from '@/components/Profile/ProfileController';

export default function ProfilePage(): React.ReactNode {
  return <ProfileController />;
}
