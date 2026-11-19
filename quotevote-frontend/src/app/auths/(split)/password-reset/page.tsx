import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import { Suspense } from 'react'
import PasswordResetPageContent from './PageContent'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Reset Password'),
  description: 'Set a new password for your Quote.Vote account.',
  path: '/auths/password-reset',
  noIndex: true,
})

export default function PasswordResetPage() {
  return (
    <Suspense>
      <PasswordResetPageContent />
    </Suspense>
  )
}
