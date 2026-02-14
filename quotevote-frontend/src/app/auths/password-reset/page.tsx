import { Suspense } from 'react';
import { Loader } from '@/components/common/Loader';
import PasswordResetPageContent from './PageContent';

/**
 * Password Reset Page (Server Component Wrapper)
 * 
 * Wraps the client component in Suspense at the route segment level
 * as required by Next.js 16 for pages using useSearchParams().
 */

// Mark this route as dynamic since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    }>
      <PasswordResetPageContent />
    </Suspense>
  );
}
