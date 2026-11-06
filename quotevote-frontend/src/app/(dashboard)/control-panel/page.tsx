import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import ControlPanelClient from './ControlPanelClient'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Control Panel'),
  description: 'Administrative controls for Quote.Vote.',
  path: '/control-panel',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default function ControlPanelPage() {
  return <ControlPanelClient />
}
