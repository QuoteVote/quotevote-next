/**
 * Test page for RequestAccess components
 * 
 * This page is used for testing the RequestAccess flow
 */

import { RequestAccessForm } from '@/components/RequestAccess/RequestAccessForm';

export default function RequestAccessTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Request Access Test Page</h1>
      <RequestAccessForm />
    </div>
  );
}

