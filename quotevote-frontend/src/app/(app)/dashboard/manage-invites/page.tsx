import type { Metadata } from 'next'
import ManageInvitesClient from './ManageInvitesClient'

export const metadata: Metadata = {
  title: 'Manage Invites — Quote.Vote',
  description: 'Manage your sent and received invitations',
}

export const dynamic = 'force-dynamic'

export default function ManageInvitesPage() {
  return <ManageInvitesClient />
}
