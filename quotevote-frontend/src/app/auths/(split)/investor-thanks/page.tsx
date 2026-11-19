import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import { NoticePage } from '@/components/Public/Notice'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Thank You'),
  description: 'Thank you for your interest in investing with Quote.Vote.',
  path: '/auths/investor-thanks',
  noIndex: true,
})

export default function InvestorThanksPage() {
  return <NoticePage kind="inTouch" />
}
