import type { Metadata } from 'next'
import ControlPanelClient from './ControlPanelClient'

export const metadata: Metadata = {
  title: 'Control Panel — Quote.Vote',
  description: 'Administrative controls for Quote.Vote',
}

export const dynamic = 'force-dynamic'

export default function ControlPanelPage() {
  return <ControlPanelClient />
}
