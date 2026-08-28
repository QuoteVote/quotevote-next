'use client'

import { type ReactElement } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store'
import { DashboardShell } from '@/components/DashboardShell'
import { PublicDirectoryContent } from './PublicDirectory/PublicDirectoryContent'
import { DirectoryToolbar } from './PublicDirectory/DirectoryToolbar'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'

export function AuthAwareHome(): ReactElement {
  const user = useAppStore((s) => s.user.data)
  const loggedIn = !!(user?.id || user?._id)

  if (!loggedIn) {
    return <PublicDirectoryContent />
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
  const groupId = searchParams.get('group') || undefined

  return (
    <DashboardShell>
      <div
        data-testid="authenticated-directory"
        className="flex h-full min-h-0 flex-col overflow-hidden md:h-auto md:overflow-visible"
      >
        <div data-testid="directory-sticky-chrome" className="z-40 shrink-0 bg-background">
          <DirectoryToolbar />
        </div>
        <div
          data-testid="directory-scroll"
          className="min-h-0 w-full flex-1 overflow-y-auto md:overflow-visible"
        >
          <div className="mx-auto w-full min-w-0 max-w-2xl">
            <PaginatedPostsList
              defaultPageSize={20}
              maxVisiblePages={5}
              searchKey={q}
              startDateRange={from || undefined}
              endDateRange={to || undefined}
              sortOrder={sortOrder}
              interactions={interactions}
              groupId={groupId}
              compact
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
