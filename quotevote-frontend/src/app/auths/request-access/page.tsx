import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import { Suspense } from 'react'
import { RequestAccessPageContent } from './PageContent'
import { InfoSections } from '@/components/RequestAccess/InfoSections'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Request Access'),
  description:
    'Request an invitation to join Quote.Vote, a text-first platform for thoughtful dialogue.',
  path: '/auths/request-access',
})

export default function RequestAccessPage() {
  return (
    <>
      <Suspense>
        <RequestAccessPageContent />
      </Suspense>
      <InfoSections />
    </>
  )
}
