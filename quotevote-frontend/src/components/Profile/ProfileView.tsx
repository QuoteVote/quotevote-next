'use client';

import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { UserPosts } from '@/components/UserPosts';

export function ProfileView({
  profileUser,
  loading,
}: ProfileViewProps) {
  if (loading) return <LoadingSpinner />;

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-5">
        <Card>
          <CardContent className="pt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Invalid user</h3>
            <Link
              href="/search"
              className="text-primary hover:underline"
            >
              Return to homepage.
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-5">
      <div className="w-full max-w-4xl space-y-6">
        <div className="w-full">
          <ProfileHeader profileUser={profileUser} />
        </div>

        <div className="w-full space-y-4">
          {profileUser.reputation && (
            <ReputationDisplay
              reputation={profileUser.reputation}
              onRefresh={() => window.location.reload()}
            />
          )}
          <UserPosts userId={profileUser._id} />
        </div>
      </div>
    </div>
  );
}

