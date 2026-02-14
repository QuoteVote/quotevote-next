import { Suspense } from 'react';
import { Loader } from '@/components/common/Loader';
import SignupPageContent from './PageContent';

/**
 * Signup Page (Server Component Wrapper)
 * 
 * Wraps the client component in Suspense at the route segment level
 * as required by Next.js 16 for pages using useSearchParams().
 */
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    }>
      <SignupPageContent />
    </Suspense>
  );
}
