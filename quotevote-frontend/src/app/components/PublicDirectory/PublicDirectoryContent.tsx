'use client'

import { type ReactElement } from 'react'
import { useSearchParams } from 'next/navigation'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { DirectoryHeader } from './DirectoryHeader'
import { DirectoryToolbar } from './DirectoryToolbar'

/**
 * Public post directory shown at `/` (#454).
 * Mobile: nav + search + filters stay pinned while posts scroll (#487).
 * `position: sticky` cannot be used here — `html`/`body` set `overflow-x: hidden`
 * (#454), which creates a scroll container and prevents sticky from activating.
 * Desktop: page scroll is unchanged; the toolbar is not pinned.
 */
export function PublicDirectoryContent(): ReactElement {
  const searchParams = useSearchParams()

  const q = searchParams.get('q') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sortParam = searchParams.get('sort')
  const sortOrder = sortParam === 'asc' ? 'asc' : 'desc'
  const interactions = searchParams.get('interactions') === 'true'
  const groupId = searchParams.get('group') || undefined

  return (
    <div
      data-testid="public-directory"
      className="h-dvh overflow-hidden md:h-auto md:min-h-screen md:overflow-visible w-full max-w-[100vw] min-w-0 flex flex-col"
      style={{ background: '#eef4f9' }}
    >
      <div
        data-testid="directory-sticky-chrome"
        className="shrink-0 z-50"
        style={{ background: '#eef4f9' }}
      >
        <DirectoryHeader />
        <DirectoryToolbar />
      </div>
      <main
        data-testid="directory-scroll"
        className="flex-1 min-h-0 w-full overflow-y-auto md:overflow-visible"
      >
        <div className="w-full max-w-2xl mx-auto min-w-0">
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
      </main>
    </div>
  )
}
