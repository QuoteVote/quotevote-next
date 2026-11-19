import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import SignupPageContent from './PageContent'

export const metadata: Metadata = {
  title: 'Create Account — Quote.Vote',
}

interface SignupPageProps {
  searchParams: Promise<{ token?: string | string[] }>
}

// Signup is invitation-only: without an invite link, send people to Request Access.
export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { token } = await searchParams
  if (typeof token !== 'string' || !token.trim()) {
    redirect('/auths/request-access')
  }

  return (
    <Suspense>
      <SignupPageContent />
    </Suspense>
  )
}
