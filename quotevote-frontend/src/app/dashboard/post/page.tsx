import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SubHeader } from '@/components/SubHeader';
import PostSkeleton from '@/components/Post/PostSkeleton';
import PaginatedPostsList from '@/components/Post/PaginatedPostsList';

export const metadata: Metadata = {
  title: 'Posts - Quote.Vote',
  description: 'Browse and discover posts on Quote.Vote',
};

/**
 * Posts Page (Server Component)
 *
 * Dashboard page for viewing and managing posts.
 * The interactive paginated list is rendered inside a Suspense boundary
 * with a skeleton fallback while data loads.
 *
 * Route: /dashboard/post
 */
export default function PostsPage() {
  return (
    <div className="space-y-4">
      <SubHeader headerName="Posts" />
      <Suspense fallback={<PostsLoadingSkeleton />}>
        <PaginatedPostsList
          defaultPageSize={20}
          showPageInfo={true}
          showFirstLast={true}
          maxVisiblePages={5}
        />
      </Suspense>
    </div>
  );
}

function PostsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
}
