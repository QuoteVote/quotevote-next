'use client';

import { useState } from 'react';
// Using relative import since @/components maps to app/components
import { Sidebar } from '../../../components/Sidebar';

/**
 * Test page for Sidebar component
 * 
 * This page demonstrates the Sidebar component functionality:
 * - Open/close behavior
 * - Navigation
 * - User authentication state
 */
export default function SidebarTestPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Sidebar 
        open={sidebarOpen} 
        onOpenChange={setSidebarOpen}
        bgColor="blue"
        rtlActive={false}
        color="blue"
        miniActive={false}
      />
      
      {/* Main content area - offset for fixed header */}
      <main className="pt-16 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Sidebar Component Test</h1>
          <p className="mb-4">
            This page tests the migrated Sidebar component. Click the menu button in the top-left to open the sidebar.
          </p>
          
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold">Test Instructions:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Click the menu icon in the top-left to open/close the sidebar</li>
              <li>Test navigation links in the sidebar</li>
              <li>Verify active route highlighting</li>
              <li>Test responsive behavior on mobile devices</li>
              <li>Verify logout functionality (if logged in)</li>
            </ul>
          </div>

          <div className="mt-6 bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Component Features:</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>✅ Migrated from MUI Drawer to shadcn/ui Sheet</li>
              <li>✅ Replaced Redux with Zustand store</li>
              <li>✅ Updated to Next.js navigation (useRouter, usePathname, Link)</li>
              <li>✅ Replaced MUI components with shadcn/ui and Tailwind CSS</li>
              <li>✅ Replaced Material-UI icons with lucide-react</li>
              <li>✅ Full TypeScript support</li>
              <li>✅ Responsive design</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

