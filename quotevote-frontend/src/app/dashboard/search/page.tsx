import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/SubHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import SearchContainer from '@/components/SearchContainer/SearchContainer';

export const metadata: Metadata = {
  title: 'Search - Quote.Vote',
  description: 'Search content and creators on Quote.Vote',
};

// Mark as dynamic to prevent static optimization issues
export const dynamic = 'force-dynamic';

/**
 * Search Page (Server Component)
 *
 * Dashboard page for searching content.
 * The interactive SearchContainer is wrapped in Suspense because it uses useSearchParams().
 *
 * Route: /dashboard/search
 */
export default function SearchPage() {
  return (
    <div className="space-y-4 p-4">
      <SubHeader headerName="Search" />
      <Suspense fallback={<LoadingSpinner />}>
        <SearchContainer />
      </Suspense>
    </div>
  );
}
