import type { Metadata } from 'next'
import { Suspense } from 'react'
import LoginPageContent from './PageContent'

export const metadata: Metadata = {
  title: 'Sign In — Quote.Vote',
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
