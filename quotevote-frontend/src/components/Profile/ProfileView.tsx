'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import type { ActivityEventType } from '@/types/activity';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { UserPosts } from '@/components/UserPosts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaginatedActivityList } from '@/components/Activity/PaginatedActivityList';
import { cn } from '@/lib/utils';

const ACTIVITY_TYPES: ActivityEventType[] = ['POSTED', 'VOTED', 'COMMENTED', 'QUOTED'];

function ActivityFilters({
  selectedEvents,
  onToggle,
  onSelectAll,
}: {
  selectedEvents: ActivityEventType[];
  onToggle: (event: ActivityEventType) => void;
  onSelectAll: () => void;
}) {
  const allSelected = selectedEvents.length === ACTIVITY_TYPES.length;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        type="button"
        onClick={onSelectAll}
        className={cn(
          'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors',
          allSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'
        )}
      >
        All
      </button>
      {ACTIVITY_TYPES.map((event) => (
        <button
          key={event}
          type="button"
          onClick={() => onToggle(event)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize',
            selectedEvents.includes(event)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-muted/60 text-muted-foreground border-border hover:bg-muted'
          )}
        >
          {event.toLowerCase()}
        </button>
      ))}
    </div>
  );
}

export function ProfileView({
  profileUser,
  loading,
}: ProfileViewProps) {
  const [activityEvents, setActivityEvents] = useState<ActivityEventType[]>([...ACTIVITY_TYPES]);

  const handleToggleEvent = useCallback((event: ActivityEventType) => {
    setActivityEvents((prev) => {
      const allSelected = prev.length === ACTIVITY_TYPES.length;
      if (allSelected) {
        // When everything is selected, clicking one type isolates it
        return [event];
      }
      if (prev.includes(event)) {
        // Deselect this type; if it would leave nothing selected, reset to all
        const next = prev.filter((e) => e !== event);
        return next.length === 0 ? [...ACTIVITY_TYPES] : next;
      }
      return [...prev, event];
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setActivityEvents([...ACTIVITY_TYPES]);
  }, []);

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
          <ActivityFilters
            selectedEvents={activityEvents}
            onToggle={handleToggleEvent}
            onSelectAll={handleSelectAll}
          />
          <PaginatedActivityList
            userId={profileUser._id}
            activityEvent={activityEvents}
            defaultPageSize={15}
            maxVisiblePages={5}
          />
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
