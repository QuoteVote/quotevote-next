'use client'

import { type ReactElement } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store'
import { DashboardShell } from '@/components/DashboardShell'
import { LandingPage } from './Landing/LandingPage'
import { DirectoryToolbar } from './PublicDirectory/DirectoryToolbar'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { getTagIdParam } from '@/lib/utils/tagParam'
import { HomeFeedOptions } from '@/components/Home/HomeFeedOptions'
import { HomeFeedHeader } from '@/components/Home/HomeFeedHeader'
import { HomeHighlights } from '@/components/Home/HomeHighlights'

export function AuthAwareHome(): ReactElement {
  const user = useAppStore((s) => s.user.data)
  const loggedIn = !!(user?.id || user?._id)

  if (!loggedIn) {
    return <LandingPage />
  }

  return <AuthenticatedFeed />
}

/**
 * Signed-in home feed. Mobile: search + filters stay pinned while posts scroll
 * (same contract as the guest directory, #487 / #488). DashboardShell already
 * owns the fixed nav, so only the toolbar sits in the non-scrolling chrome.
 * Desktop: page scroll is unchanged; the toolbar is not pinned.
 */
function AuthenticatedFeed(): ReactElement {
  const searchParams = useSearchParams()

  const q = searchParams.get('q') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sortParam = searchParams.get('sort')
  const sortOrder = sortParam === 'asc' ? 'asc' : 'desc'
  const interactions = searchParams.get('interactions') === 'true'
  const tagId = getTagIdParam(searchParams) || undefined
  const following = searchParams.get('following') === 'true'

  return (
    <DashboardShell>
      <div
        data-testid="authenticated-directory"
        className="flex h-full min-h-0 flex-col overflow-hidden md:h-auto md:overflow-visible lg:mx-auto lg:grid lg:max-w-[1376px] lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:px-8 xl:grid-cols-[240px_minmax(0,1fr)_320px]"
      >
        {/* Desktop: the filters move into the left column and the search into the top bar. */}
        <div className="hidden lg:block">
          <HomeFeedOptions />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:block">
          <div
            data-testid="directory-sticky-chrome"
            className="z-40 shrink-0 bg-background lg:hidden"
          >
            <DirectoryToolbar />
          </div>
          <div className="hidden lg:block">
            <HomeFeedHeader />
          </div>
          <div
            data-testid="directory-scroll"
            className="min-h-0 w-full flex-1 overflow-y-auto md:overflow-visible"
          >
            <div className="mx-auto w-full min-w-0 max-w-2xl lg:max-w-none">
              <PaginatedPostsList
                defaultPageSize={20}
                maxVisiblePages={5}
                searchKey={q}
                startDateRange={from || undefined}
                endDateRange={to || undefined}
                sortOrder={sortOrder}
                interactions={interactions}
                friendsOnly={following}
                tagId={tagId}
                compact
                groupByDay={sortOrder === 'desc'}
              />
            </div>
          </div>
        </div>
        <div className="hidden xl:block">
          <HomeHighlights />
        </div>
      </div>
    </DashboardShell>
  )
}
