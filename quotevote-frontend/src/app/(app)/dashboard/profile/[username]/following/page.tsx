'use client';

/**
 * Following Page
 * 
 * Dashboard page for viewing users that a profile is following.
 * Migrated from FollowInfo component with "following" filter.
 */

import { FollowInfo } from '@/components/Profile/FollowInfo';

export default function FollowingPage(): React.ReactNode {
  return <FollowInfo filter="following" />;
}
