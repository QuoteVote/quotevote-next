import type { Metadata } from 'next'
import { LogoutPage } from '@/components/LogoutPage'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Signing out'),
  description: 'Signing you out of Quote.Vote.',
  path: '/logout',
  noIndex: true,
})

export default function LogoutRoute() {
  return <LogoutPage />
}
