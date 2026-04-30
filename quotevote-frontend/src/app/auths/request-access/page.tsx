import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RequestAccessPageContent } from './PageContent'
import { InfoSections } from '@/components/RequestAccess/InfoSections'

export const metadata: Metadata = {
  title: 'Request Access — Quote.Vote',
}

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
