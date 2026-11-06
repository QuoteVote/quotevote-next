import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import SettingsPageClient from './SettingsPageClient'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Settings'),
  description: 'Your Quote.Vote account and app preferences.',
  path: '/settings',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  return <SettingsPageClient />
}
