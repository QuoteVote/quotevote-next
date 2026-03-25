import type { Metadata } from 'next'
import { PublicNavbar } from '@/components/PublicNavbar/PublicNavbar'
import { GuestFooter } from '@/components/GuestFooter/GuestFooter'
import { PlanPageContent } from './PlanPageContent'

export const metadata: Metadata = {
  title: 'Plans — Quote.Vote',
  description: 'Choose a plan that fits your needs.',
}

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
