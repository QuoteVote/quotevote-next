'use client';

import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { UserPosts } from '@/components/UserPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <div className="w-full py-6 space-y-6">
      <ProfileHeader profileUser={profileUser} />

      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="posts" className="flex-1">Posts</TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <UserPosts userId={profileUser._id} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Activity feed coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          {profileUser.reputation ? (
            <ReputationDisplay
              reputation={profileUser.reputation}
              onRefresh={() => window.location.reload()}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No additional information available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
