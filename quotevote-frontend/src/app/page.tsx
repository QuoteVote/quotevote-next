import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { ReactElement } from 'react'
import { Suspense } from 'react'
import { AuthAwareHome } from './components/AuthAwareHome'
import { JsonLd } from '@/components/common/JsonLd'
import { buildWebSiteJsonLd } from '@/lib/seo/jsonLd'

export const metadata: Metadata = buildPageMetadata({
  title: 'Quote.Vote – Share Ideas. Vote on What Matters.',
  description:
    'An open-source, text-first platform for thoughtful dialogue. Quote, vote, and engage — no ads, no algorithms, no noise.',
  path: '/',
})

function DirectorySkeleton(): ReactElement {
  return (
    <div className="min-h-screen w-full overflow-x-hidden" style={{ background: '#eef4f9' }}>
      <div className="h-14 border-b bg-white" />
      <div className="max-w-2xl mx-auto px-4 pt-3 space-y-4">
        <div className="h-11 w-full animate-pulse rounded-full bg-muted" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  )
}

/**
 * Root route `/` — public post directory (#454).
 */
export default function RootPage(): ReactElement {
  return (
    <>
      <JsonLd data={buildWebSiteJsonLd()} />
      <Suspense fallback={<DirectorySkeleton />}>
        <AuthAwareHome />
      </Suspense>
    </>
  )
}
