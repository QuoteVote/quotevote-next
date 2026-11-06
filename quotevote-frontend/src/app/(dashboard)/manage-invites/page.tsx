import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import ManageInvitesClient from './ManageInvitesClient'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Manage Invites'),
  description: 'Manage your sent and received Quote.Vote invitations.',
  path: '/manage-invites',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default function ManageInvitesPage() {
  return <ManageInvitesClient />
}
