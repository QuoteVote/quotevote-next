import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import { Suspense } from 'react'
import ForgotPasswordPageContent from './PageContent'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Forgot Password'),
  description: 'Request a link to reset your Quote.Vote password.',
  path: '/auths/forgot-password',
})

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordPageContent />
    </Suspense>
  )
}
