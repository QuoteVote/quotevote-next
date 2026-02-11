'use client';

import BotListTab from '@/components/Admin/BotListTab';
import { SubHeader } from '@/components/SubHeader';

/**
 * Control Panel Page
 * 
 * Dashboard page for administrative controls and settings.
 * Currently includes bot report management and moderation tools.
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
          <BotListTab />
        </section>
      </div>
    </div>
  );
}
