'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { PaginatedActivityList } from '@/components/Activity/PaginatedActivityList';
import { cn } from '@/lib/utils';

export type ProfileActivityType = 'POSTED' | 'VOTED' | 'COMMENTED' | 'QUOTED';

export const ACTIVITY_FILTERS: Array<{
  id: ProfileActivityType;
  label: string;
}> = [
  { id: 'POSTED', label: 'Posts' },
  { id: 'VOTED', label: 'Voted' },
  { id: 'COMMENTED', label: 'Commented' },
  { id: 'QUOTED', label: 'Quoted' },
];

// Activity filter styling mapping with accessible contrast (RC1-009)
export const ACTIVITY_FILTER_STYLES: Record<
  ProfileActivityType,
  { activeBorder: string; activeText: string; color: string }
> = {
  POSTED: {
    activeBorder: 'border-primary',
    activeText: 'text-foreground',
    color: '#52b274',
  },
  VOTED: {
    activeBorder: 'border-[#52b274]',
    activeText: 'text-[#52b274]',
    color: '#52b274',
  },
  COMMENTED: {
    activeBorder: 'border-[#ca8a04]',
    activeText: 'text-[#ca8a04]',
    color: '#FDD835',
  },
  QUOTED: {
    activeBorder: 'border-[#c026d3]',
    activeText: 'text-[#c026d3]',
    color: '#E36DFA',
  },
};

export const ALL_ACTIVITY_TYPES: ProfileActivityType[] = [
  'POSTED',
  'VOTED',
  'COMMENTED',
  'QUOTED',
];

export function ProfileView({
  profileUser,
  loading,
  errorMessage,
}: ProfileViewProps) {
  const [selectedFilters, setSelectedFilters] = useState<ProfileActivityType[]>([]);

  const handleSelectAll = useCallback(() => {
    setSelectedFilters([]);
  }, []);

  const handleToggleFilter = useCallback((filterId: ProfileActivityType) => {
    setSelectedFilters((prev) => {
      if (prev.length === 0 || prev.length === ALL_ACTIVITY_TYPES.length) {
        return [filterId];
      }
      if (prev.includes(filterId)) {
        return prev.filter((id) => id !== filterId);
      }
      return [...prev, filterId];
    });
  }, []);

  if (loading) return <LoadingSpinner />;

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-5">
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <h3 className="text-lg font-semibold">Couldn&apos;t load this profile</h3>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Link href="/dashboard/explore" className="text-primary hover:underline inline-block mt-2">
              Back to Explore
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const isAllActive =
    selectedFilters.length === 0 || selectedFilters.length === ALL_ACTIVITY_TYPES.length;

  return (
    <div className="w-full pb-8">
      <ProfileHeader profileUser={profileUser} />

      <div className="w-full mt-3">
        <div
          role="tablist"
          aria-label="Profile activity filters"
          className="sticky top-0 z-10 w-full h-11 border-b border-border bg-background/95 backdrop-blur-sm px-0 flex items-center justify-between overflow-x-auto"
        >
          {/* All Filter */}
          <button
            type="button"
            role="tab"
            aria-selected={isAllActive}
            data-state={isAllActive ? 'active' : 'inactive'}
            onClick={handleSelectAll}
            className={cn(
              'flex-1 h-full min-w-[50px] inline-flex items-center justify-center whitespace-nowrap px-1 sm:px-3 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border-b-2',
              isAllActive
                ? 'border-primary text-foreground font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            All
          </button>

          {/* Activity Filters: Posts, Voted, Commented, Quoted */}
          {ACTIVITY_FILTERS.map(({ id, label }) => {
            const isActive = !isAllActive && selectedFilters.includes(id);
            const filterStyle = ACTIVITY_FILTER_STYLES[id];

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-state={isActive ? 'active' : 'inactive'}
                onClick={() => handleToggleFilter(id)}
                className={cn(
                  'flex-1 h-full min-w-[60px] inline-flex items-center justify-center whitespace-nowrap px-1 sm:px-3 text-xs sm:text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 border-b-2',
                  isActive
                    ? `${filterStyle.activeBorder} ${filterStyle.activeText} font-semibold`
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        <div className="mt-4" data-testid="profile-activity-section">
          <PaginatedActivityList
            userId={profileUser._id}
            activityEvent={isAllActive ? [] : selectedFilters}
            defaultPageSize={15}
            maxVisiblePages={5}
          />
        </div>

        {profileUser.reputation ? (
          <div className="mt-4" data-testid="profile-reputation-section">
            <ReputationDisplay
              reputation={profileUser.reputation}
              onRefresh={() => window.location.reload()}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
