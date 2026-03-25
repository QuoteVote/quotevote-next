import type { Metadata } from 'next'
import { Suspense } from 'react'
import { RequestAccessPageContent } from './PageContent'

export const metadata: Metadata = {
  title: 'Request Access — Quote.Vote',
}

export default function RequestAccessPage() {
  return (
    <Suspense>
      <RequestAccessPageContent />
    </Suspense>
  )
}
