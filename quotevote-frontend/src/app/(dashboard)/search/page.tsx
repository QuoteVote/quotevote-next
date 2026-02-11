'use client';

import SidebarSearchView from '@/components/SearchContainer/index.tsx';
import { SubHeader } from '@/components/SubHeader';

/**
 * Search Page
 * 
 * Dashboard page for searching content and creators.
 * Uses the SearchContainer component with debounced GraphQL queries.
 * 
 * Route: /search
 */
export default function SearchPage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Search" />
      <div className="max-w-4xl">
        <SidebarSearchView Display="block" />
      </div>
    </div>
  );
}
