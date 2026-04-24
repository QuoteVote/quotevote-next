import { Suspense } from 'react'
import type { Metadata } from 'next'
import ExploreContent from './ExploreContent'
import {
  generatePageTitle,
  generatePageDescription,
  generateCanonicalUrl,
  generatePaginationUrls,
} from '@/lib/utils/seo'

const BASE_TITLE = 'Explore — Quote.Vote'
const BASE_DESCRIPTION = 'Discover trending ideas, featured posts, and connect with creators on Quote.Vote'
const BASE_URL = '/dashboard/explore'

interface ExplorePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: ExplorePageProps): Promise<Metadata> {
  const params = await searchParams
  const page = parseInt(String(params.page ?? ''), 10) || 1
  const pageSize = parseInt(String(params.page_size ?? ''), 10) || 15
  const searchKey = typeof params.q === 'string' ? params.q : ''
  const tab = typeof params.tab === 'string' ? params.tab : 'trending'

  // Approximate total pages (we don't have server data here, so use reasonable defaults)
  const totalPages = 100

  const title = generatePageTitle(BASE_TITLE, page, totalPages, searchKey)
  const description = generatePageDescription(BASE_DESCRIPTION, page, totalPages, searchKey, 0, pageSize)

  const seoParams = {
    page,
    pageSize,
    searchKey,
    sortOrder: typeof params.sort === 'string' ? params.sort : undefined,
    interactions: params.interactions === 'true',
    startDateRange: typeof params.from === 'string' ? params.from : undefined,
    endDateRange: typeof params.to === 'string' ? params.to : undefined,
  }

  const canonical = generateCanonicalUrl(BASE_URL, seoParams)
  const { prevUrl, nextUrl } = generatePaginationUrls(BASE_URL, seoParams, page, totalPages)

  const alternates: Metadata['alternates'] = { canonical }

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    other: {
      ...(prevUrl ? { 'link:prev': prevUrl } : {}),
      ...(nextUrl ? { 'link:next': nextUrl } : {}),
      ...(tab ? { 'x-tab': tab } : {}),
    },
  }
}

export const dynamic = 'force-dynamic'

function ExploreSkeleton() {
  return (
    <div className="space-y-0">
      {/* Search bar skeleton */}
      <div className="sticky top-14 md:top-16 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="h-11 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="border-b border-border px-4">
        <div className="max-w-2xl mx-auto flex gap-6 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 w-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>

      {/* Feed skeleton */}
      <div className="max-w-2xl mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border px-4 py-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2 pl-[52px]">
              <div className="h-4 w-4/5 rounded bg-muted" />
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-3/4 rounded bg-muted" />
            </div>
            <div className="flex gap-6 pl-[52px] pt-1">
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreContent />
    </Suspense>
  )
}
