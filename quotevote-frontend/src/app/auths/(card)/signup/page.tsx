import type { Metadata } from 'next'
import { Suspense } from 'react'
import SignupPageContent from './PageContent'

export const metadata: Metadata = {
  title: 'Create Account — Quote.Vote',
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupPageContent />
    </Suspense>
  )
}
