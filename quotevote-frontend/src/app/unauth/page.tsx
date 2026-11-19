import type { Metadata } from 'next'
import { NoticePage } from '@/components/Public/Notice'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Session expired'),
  description: 'Your Quote.Vote session has expired. Sign in again to continue.',
  path: '/unauth',
  noIndex: true,
})

export default function UnauthPage() {
  return <NoticePage kind="sessionExpired" />
}
