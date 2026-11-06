import type { Metadata } from 'next'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'
import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar'
import { GuestFooter } from '@/components/GuestFooter/GuestFooter'
import { PlanPageContent } from './PlanPageContent'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Plans'),
  description: 'Compare Quote.Vote plans and choose the one that fits your needs.',
  path: '/plan',
})

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNavbar />
      <main className="flex-1">
        <PlanPageContent />
      </main>
      <GuestFooter isRequestAccess={false} />
    </div>
  )
}
