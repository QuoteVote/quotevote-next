/**
 * Error Page (Server Component Wrapper)
 * 
 * Wraps the client component in Suspense at the route segment level
 * as required by Next.js 16 for pages using useSearchParams().
 */

import { Suspense } from 'react';
import ErrorPageContent from './PageContent';

// Mark this route as dynamic since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function ErrorPage(): React.ReactNode {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  );
}
