import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/SubHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import BotListTab from '@/components/Admin/BotListTab';

export const metadata: Metadata = {
  title: 'Control Panel - Quote.Vote',
  description: 'Administrative controls for Quote.Vote',
};

/**
 * Control Panel Page (Server Component)
 *
 * Dashboard page for administrative controls and settings.
 * Profile and Control Panel rely on client-side state,
 * so the interactive BotListTab is rendered as a Client Component
 * within a Suspense boundary.
 *
 * Route: /control-panel
 */
export default function ControlPanelPage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Control Panel" />
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Bot Reports</h2>
          <Suspense fallback={<LoadingSpinner />}>
            <BotListTab />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
