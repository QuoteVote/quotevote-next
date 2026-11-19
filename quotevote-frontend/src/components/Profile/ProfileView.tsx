'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import type { ProfileViewProps } from '@/types/profile';
import { ProfileHeader } from './ProfileHeader';
import { ReputationDisplay } from './ReputationDisplay';
import { ProfileBanner } from './ProfileBanner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { PaginatedActivityList } from '@/components/Activity/PaginatedActivityList';
import { ProfileActivitySignIn } from './ProfileActivitySignIn';
import { useHasMounted } from '@/hooks/useMediaQuery';
import { isAuthenticated } from '@/lib/utils/auth';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store';

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

// Dot beside each filter, matching the activity card it shows: post cards have
// the blue border, votes are green, comments yellow and quotes pink.
export const ACTIVITY_FILTER_DOT_COLORS: Record<ProfileActivityType, string> = {
  POSTED: '#56b3ff',
  VOTED: '#52b274',
  COMMENTED: '#FDD835',
  QUOTED: '#E36DFA',
};

export const ALL_ACTIVITY_TYPES: ProfileActivityType[] = [
  'POSTED',
  'VOTED',
  'COMMENTED',
  'QUOTED',
];

const NO_ACTIVITY_FILTER: ProfileActivityType[] = [];

// The design's filter chips: outlined pills, the chosen one filled in ink.
const FILTER_CHIP_CLASS =
  'inline-flex h-9 shrink-0 items-center gap-[7px] rounded-full border px-[13px] text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--shell-blue)] lg:h-[38px] lg:gap-2 lg:px-3.5 lg:text-[13.5px] [.neo-brutalism_&]:rounded-[4px] [.neo-brutalism_&]:border-2';
const FILTER_CHIP_ACTIVE_CLASS =
  'border-[var(--shell-ink)] bg-[var(--shell-ink)] text-[var(--shell-surface)]';
const FILTER_CHIP_IDLE_CLASS =
  'border-[#d3d9e4] bg-[var(--shell-surface)] text-[var(--shell-ink-2)] hover:border-[#b8c2d3] [.dark_&]:border-[#24304a] [.neo-brutalism_&]:border-[var(--shell-line)]';

export function ProfileView({
  profileUser,
  loading,
  errorMessage,
}: ProfileViewProps) {
  const [selectedFilters, setSelectedFilters] = useState<ProfileActivityType[]>([]);
  // Activity is public. While the live API still keeps the activity list for members,
  // guests see the person's posts in the same list, with a note about the rest.
  const [showingPostsOnly, setShowingPostsOnly] = useState(false);
  const [activityRange, setActivityRange] = useState('');
  // The session lives in the browser, so decide after mount to keep the server and
  // client HTML the same (#606).
  const hasMounted = useHasMounted();
  const sessionUserId = useAppStore((state) => state.user.data._id || state.user.data.id);
  const sessionUsername = useAppStore((state) => state.user.data.username);
  const signedIn = hasMounted && (Boolean(sessionUserId) || isAuthenticated());

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

  const isAllActive =
    selectedFilters.length === 0 || selectedFilters.length === ALL_ACTIVITY_TYPES.length;
  // Stable reference: a new [] on every render would send the list back to page 1.
  const activityEvent = useMemo(
    () => (isAllActive ? NO_ACTIVITY_FILTER : selectedFilters),
    [isAllActive, selectedFilters]
  );

  if (loading) return <LoadingSpinner />;

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-5">
        <Card>
          <CardContent className="pt-6 text-center space-y-2">
            <h3 className="text-lg font-semibold">Couldn&apos;t load this profile</h3>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Link href="/" className="text-primary hover:underline inline-block mt-2">
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

  const own =
    Boolean(sessionUserId && String(sessionUserId) === String(profileUser._id)) ||
    Boolean(
      typeof sessionUsername === 'string' &&
        sessionUsername.toLowerCase() === profileUser.username?.toLowerCase()
    );

  return (
    <div className="qv-auth qv-pub min-h-[calc(100dvh-var(--app-header-h))] w-full bg-[var(--inv-ground)]! pb-10 font-redesign">
      <ProfileBanner own={own} />

      <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-1 gap-4 lg:-mt-20 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-8 lg:px-8 xl:px-0">
        <aside className="flex min-w-0 flex-col gap-4" aria-label="About this member">
          <ProfileHeader profileUser={profileUser} />
          {profileUser.reputation ? (
            <div className="max-lg:hidden" data-testid="profile-reputation-section">
              <ReputationDisplay
                reputation={profileUser.reputation}
                onRefresh={() => window.location.reload()}
              />
            </div>
          ) : null}
        </aside>

        <main className="flex min-w-0 flex-col gap-3 px-4 lg:gap-3.5 lg:px-0 lg:pt-[100px]">
          <div className="flex items-center justify-between max-lg:hidden">
            <h2 className="qv-auth-display m-0 text-[30px]!">Activity</h2>
            {activityRange && (
              <span className="text-[13px] font-semibold text-[var(--shell-muted)]">{activityRange}</span>
            )}
          </div>
          {!hasMounted ? (
            <div
              role="status"
              aria-busy="true"
              data-testid="activity-loading"
              className="flex items-center justify-center p-8 text-sm text-[var(--shell-muted)]"
            >
              Loading activity…
            </div>
          ) : (
            <>
              {!signedIn && showingPostsOnly && (
                <ProfileActivitySignIn displayName={profileUser.name || profileUser.username} />
              )}
              {/* A filter, not tabs (#536): labelled chips that can be combined. */}
              <div
                role="group"
                aria-label="Show"
                data-testid="profile-activity-filters"
                className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:flex-wrap lg:gap-2 lg:px-0"
              >
                <button
                  type="button"
                  aria-pressed={isAllActive}
                  data-state={isAllActive ? 'active' : 'inactive'}
                  onClick={handleSelectAll}
                  className={cn(FILTER_CHIP_CLASS, isAllActive ? FILTER_CHIP_ACTIVE_CLASS : FILTER_CHIP_IDLE_CLASS)}
                >
                  All
                </button>
                {ACTIVITY_FILTERS.map(({ id, label }) => {
                  const isActive = !isAllActive && selectedFilters.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={isActive}
                      data-state={isActive ? 'active' : 'inactive'}
                      onClick={() => handleToggleFilter(id)}
                      className={cn(FILTER_CHIP_CLASS, isActive ? FILTER_CHIP_ACTIVE_CLASS : FILTER_CHIP_IDLE_CLASS)}
                    >
                      <span
                        className="size-2 rounded-full lg:size-[9px]"
                        style={{
                          backgroundColor: ACTIVITY_FILTER_DOT_COLORS[id],
                          boxShadow: `0 0 0 3px color-mix(in srgb, ${ACTIVITY_FILTER_DOT_COLORS[id]} 22%, transparent)`,
                        }}
                        aria-hidden="true"
                      />
                      {label}
                    </button>
                  );
                })}
                {!isAllActive && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="ml-1 h-9 shrink-0 rounded-md px-2 text-[13px] font-bold text-[var(--shell-blue)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--shell-blue)]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div data-testid="profile-activity-section">
                <PaginatedActivityList
                  userId={profileUser._id}
                  activityEvent={activityEvent}
                  onClearFilters={isAllActive ? undefined : handleSelectAll}
                  defaultPageSize={15}
                  maxVisiblePages={5}
                  publicFallback={!signedIn}
                  onMembersOnlyChange={setShowingPostsOnly}
                  onRangeChange={setActivityRange}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
