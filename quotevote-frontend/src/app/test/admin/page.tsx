'use client'

import BotListTab from '@/components/Admin/BotListTab'

/**
 * Test page for Admin components
 * 
 * This page renders admin components to test
 * all migrated admin functionality.
 */
export default function TestAdminPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Admin Components Test</h1>
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Bot Reports</h2>
          <BotListTab />
        </section>
      </div>
    </div>
  )
}

