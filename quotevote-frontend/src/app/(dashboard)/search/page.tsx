import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/SubHeader';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SidebarSearchView } from '@/components/SearchContainer';

export const metadata: Metadata = {
  title: 'Search - Quote.Vote',
  description: 'Search content and creators on Quote.Vote',
};

/**
 * Search Page (Server Component)
 *
 * Dashboard page for searching content and creators.
 * The interactive search input and results are rendered
 * inside a Suspense boundary via the SidebarSearchView client component.
 *
 * Route: /search
 */
export default function SearchPage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Search" />
      <div className="max-w-4xl">
        <Suspense fallback={<LoadingSpinner />}>
          <SidebarSearchView Display="block" />
        </Suspense>
      </div>
    </div>
  );
}
