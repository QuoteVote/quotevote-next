'use client';

import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';

// TODO: Migrate UserPosts component when Post components are migrated
// For now, this is a placeholder
function UserPosts() {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-center">
          User posts will be displayed here once Post components are migrated.
        </p>
      </CardContent>
    </Card>
  );
}

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
          <UserPosts />
        </div>
      </div>
    </div>
  );
}

