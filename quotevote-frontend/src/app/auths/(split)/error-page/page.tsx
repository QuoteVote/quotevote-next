import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader } from '@/components/common/Loader';
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata';
import ErrorPageContent from './PageContent';

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Link error'),
  description: 'This Quote.Vote link is invalid or has expired.',
  path: '/auths/error-page',
  noIndex: true,
});

/**
 * Error Page (Server Component Wrapper)
 * 
 * Wraps the client component in Suspense at the route segment level
 * as required by Next.js 16 for pages using useSearchParams().
 */

// Mark this route as dynamic since it uses useSearchParams
export const dynamic = 'force-dynamic';

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  );
}
