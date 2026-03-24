import type { Metadata } from 'next'
import { Suspense } from 'react'
import ForgotPasswordPageContent from './PageContent'

export const metadata: Metadata = {
  title: 'Reset Password — Quote.Vote',
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordPageContent />
    </Suspense>
  )
}
