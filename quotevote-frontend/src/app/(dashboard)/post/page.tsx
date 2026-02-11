'use client';

import PaginatedPostsList from '@/components/Post/PaginatedPostsList';
import { SubHeader } from '@/components/SubHeader';

/**
 * Posts Page
 * 
 * Dashboard page for viewing and managing posts.
 * Displays a paginated list of posts with filters and sorting options.
 * 
 * Route: /post
 */
export default function PostsPage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Posts" />
      <PaginatedPostsList
        defaultPageSize={20}
        showPageInfo={true}
        showFirstLast={true}
        maxVisiblePages={5}
      />
    </div>
  );
}
