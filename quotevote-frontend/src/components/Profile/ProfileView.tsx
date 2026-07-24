'use client';

import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { UserPosts } from '@/components/UserPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginatedActivityList } from '@/components/Activity/PaginatedActivityList';

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
            <Link href="/" className="text-primary hover:underline">
              Return to homepage.
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      <ProfileHeader profileUser={profileUser} />

      <Tabs defaultValue="all-posts" className="w-full mt-3">
        <TabsList className="sticky top-0 z-10 w-full h-11 rounded-none border-b border-border bg-background/95 backdrop-blur-sm px-0">
          <TabsTrigger value="all-posts" className="flex-1 h-full rounded-none text-xs sm:text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">All Posts</TabsTrigger>
          <TabsTrigger value="voted" className="flex-1 h-full rounded-none text-xs sm:text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Voted</TabsTrigger>
          <TabsTrigger value="commented" className="flex-1 h-full rounded-none text-xs sm:text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Commented</TabsTrigger>
          <TabsTrigger value="quoted" className="flex-1 h-full rounded-none text-xs sm:text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Quoted</TabsTrigger>
          <TabsTrigger value="about" className="flex-1 h-full rounded-none text-xs sm:text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">About</TabsTrigger>
        </TabsList>

        <TabsContent value="all-posts" className="mt-4">
          <UserPosts userId={profileUser._id} />
        </TabsContent>

        <TabsContent value="voted" className="mt-4">
          <PaginatedActivityList
            userId={profileUser._id}
            activityEvent={['VOTED']}
            defaultPageSize={15}
            maxVisiblePages={5}
          />
        </TabsContent>

        <TabsContent value="commented" className="mt-4">
          <PaginatedActivityList
            userId={profileUser._id}
            activityEvent={['COMMENTED']}
            defaultPageSize={15}
            maxVisiblePages={5}
          />
        </TabsContent>

        <TabsContent value="quoted" className="mt-4">
          <PaginatedActivityList
            userId={profileUser._id}
            activityEvent={['QUOTED']}
            defaultPageSize={15}
            maxVisiblePages={5}
          />
        </TabsContent>

        <TabsContent value="about" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-2">
              <h3 className="text-sm font-semibold text-foreground">About</h3>
              {profileUser.bio?.trim() ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {profileUser.bio.trim()}
                </p>
              ) : (
                <p className="text-muted-foreground text-sm py-2">
                  No about text yet
                </p>
              )}
            </CardContent>
          </Card>

          {profileUser.reputation ? (
            <ReputationDisplay
              reputation={profileUser.reputation}
              onRefresh={() => window.location.reload()}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
