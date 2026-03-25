import type { Metadata } from 'next'
import { Suspense } from 'react'
import PasswordResetPageContent from './PageContent'

export const metadata: Metadata = {
  title: 'Reset Password — Quote.Vote',
}

export default function PasswordResetPage() {
  return (
    <Suspense>
      <PasswordResetPageContent />
    </Suspense>
  )
}
