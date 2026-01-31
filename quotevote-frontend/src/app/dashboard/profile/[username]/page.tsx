'use client';

/**
 * Profile Page by Username
 * 
 * Dashboard profile page for viewing a specific user's profile.
 * Migrated from Profile component with username parameter.
 */

import { ProfileController } from '@/components/Profile/ProfileController';

export default function ProfileUsernamePage(): React.ReactNode {
  return <ProfileController />;
}
