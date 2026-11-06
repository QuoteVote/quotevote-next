import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import { Suspense } from 'react'
import LoginPageContent from './PageContent'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Sign In'),
  description: 'Sign in to Quote.Vote to post, quote, vote and join the conversation.',
  path: '/auths/login',
})

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}
