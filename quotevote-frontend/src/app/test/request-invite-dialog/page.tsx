/**
 * Test page for RequestInviteDialog component
 * 
 * This page is used for testing the RequestInviteDialog component
 * 
 * Test Instructions:
 * 1. Click "Open Dialog" button to open the dialog
 * 2. Test invalid email → validation errors should appear
 * 3. Test valid email → submission → success toast → dialog shows success message
 * 4. Confirm dialog closes after 3 seconds or when clicking close
 * 5. Test duplicate email → error message should appear
 */

'use client';

import { useState, Suspense } from 'react';
import { RequestInviteDialog } from '@/components/RequestInviteDialog';
import { Button } from '@/components/ui/button';

export default function RequestInviteDialogTestPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Request Invite Dialog Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <Button onClick={() => setOpen(true)}>
            Open Dialog
          </Button>
        </div>

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click &quot;Open Dialog&quot; button to open the dialog</li>
            <li>Test invalid email → validation errors should appear</li>
            <li>Test valid email → submission → success toast → dialog shows success message</li>
            <li>Confirm dialog closes after 3 seconds or when clicking close</li>
            <li>Test duplicate email → error message should appear</li>
          </ol>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Expected Behavior:</h2>
          <ul className="list-disc list-inside space-y-2">
            <li>✅ Dialog opens from trigger</li>
            <li>✅ Validates user input (email format)</li>
            <li>✅ Checks for duplicate emails</li>
            <li>✅ Submits the request via GraphQL mutation</li>
            <li>✅ Displays success/error feedback via toast</li>
            <li>✅ Shows success message in dialog</li>
            <li>✅ Closes properly after 3 seconds or manual close</li>
            <li>✅ Focus management within Dialog for accessibility</li>
          </ul>
        </div>
      </div>

      <Suspense fallback={<div>Loading dialog...</div>}>
        <RequestInviteDialog open={open} onClose={() => setOpen(false)} />
      </Suspense>
    </div>
  );
}

