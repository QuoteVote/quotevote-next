'use client';

/**
 * Followers Page
 * 
 * Dashboard page for viewing users that follow a profile.
 * Migrated from FollowInfo component with "followers" filter.
 */

import { FollowInfo } from '@/components/Profile/FollowInfo';

export default function FollowersPage(): React.ReactNode {
  return <FollowInfo filter="followers" />;
}
