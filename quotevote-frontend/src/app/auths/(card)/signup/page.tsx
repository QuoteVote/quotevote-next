import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import SignupPageContent from './PageContent'

export const metadata: Metadata = {
  title: 'Create Account — Quote.Vote',
}

export default function SignupPage() {
  return (
    <div>
      <Suspense>
        <SignupPageContent />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Learn how we use your information in our{' '}
        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
          Privacy Notice
        </Link>.
      </p>
    </div>
  )
}
