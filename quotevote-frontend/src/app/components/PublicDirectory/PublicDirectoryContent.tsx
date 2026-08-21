'use client'

import { useEffect, type ReactElement } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAppStore } from '@/store'
import PaginatedPostsList from '@/components/Post/PaginatedPostsList'
import { DirectoryHeader } from './DirectoryHeader'
import { DirectoryToolbar } from './DirectoryToolbar'

/**
 * Public post directory shown at `/` (#454).
 * Guests land in the product; signed-in users continue to Explore.
 */
export function PublicDirectoryContent(): ReactElement {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAppStore((state) => state.user.data)

  const q = searchParams.get('q') || ''
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const sortParam = searchParams.get('sort')
  const sortOrder = sortParam === 'asc' ? 'asc' : 'desc'
  const interactions = searchParams.get('interactions') === 'true'
  const groupId = searchParams.get('group') || undefined

  useEffect(() => {
    if (user?._id || user?.id) {
      router.push('/dashboard/explore')
    }
  }, [user, router])

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
