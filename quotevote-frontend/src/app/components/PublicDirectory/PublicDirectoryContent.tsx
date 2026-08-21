import { type ReactElement } from 'react'
import { useSearchParams } from 'next/navigation'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { DirectoryHeader } from './DirectoryHeader'
import { DirectoryToolbar } from './DirectoryToolbar'

/**
 * Public post directory shown at `/` (#454).
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
      className="min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col"
      style={{ background: '#eef4f9' }}
    >
      <DirectoryHeader />
      <main className="flex-1 w-full min-w-0 overflow-x-hidden">
        <DirectoryToolbar />
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
