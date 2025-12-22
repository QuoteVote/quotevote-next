'use client';

import { useEffect } from 'react';
import { useQuery } from '@apollo/client/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';
import { PaginatedList } from '@/components/common/PaginatedList';
import { GET_TOP_POSTS } from '@/graphql/queries';
import { createGraphQLVariables, extractPaginationData } from '@/lib/utils/pagination';
import { usePaginationWithFilters } from '@/hooks/usePagination';
import { useAppStore } from '@/store';
import type { PaginatedPostsListProps, Post } from '@/types/post';
import type { JSX } from 'react';

/**
 * PaginatedPostsList - Posts list with pagination and filtering
 * 
 * Features:
 * - Server-side pagination with URL sync
 * - Multiple filter options (search, date range, user, etc.)
 * - Hidden posts management
 * - Loading and error states
 * - Empty state handling
 */
export default function PaginatedPostsList({
  // Pagination props
  defaultPageSize = 20,
  pageParam = 'page',
  pageSizeParam = 'page_size',
  
  // Filter props
  searchKey = '',
  startDateRange,
  endDateRange,
  friendsOnly = false,
  interactions = false,
  userId,
  sortOrder,
  groupId,
  approved,
  
  // Component props
  cols = 1,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  
  // Callbacks
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onTotalCountChange,
  
  // Styling
  className,
  contentClassName,
  paginationClassName,
  
  ...otherProps
}: PaginatedPostsListProps): JSX.Element {
  // Use Zustand store instead of Redux
  const user = useAppStore((state) => state.user?.data);
  const hiddenPosts = useAppStore((state) => state.ui?.hiddenPosts) || [];
  const setHiddenPosts = useAppStore((state) => state.setHiddenPosts);

  // Use pagination hook with filter dependencies
  const pagination = usePaginationWithFilters(
    {
      defaultPageSize,
      pageParam,
      pageSizeParam,
      onPageChange,
      onPageSizeChange,
    },
    [searchKey, startDateRange, endDateRange, friendsOnly, interactions, userId, sortOrder, groupId, approved]
  );

  // Create GraphQL variables
  const variables = createGraphQLVariables({
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    searchKey,
    startDateRange,
    endDateRange,
    friendsOnly,
    interactions,
    userId,
    sortOrder,
    groupId,
    approved,
  });

  // Fetch data
  const { loading, error, data, refetch } = useQuery(GET_TOP_POSTS, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-and-network',
  });

  // Ensure data is fetched when component mounts with page parameter
  useEffect(() => {
    if (pagination.currentPage > 1 && (!data || !data.posts)) {
      refetch();
    }
  }, [pagination.currentPage, data, refetch]);

  // Force refetch on initial mount with page > 1
  useEffect(() => {
    if (pagination.currentPage > 1) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle hide post
  const handleHidePost = (post: Post): void => {
    if (setHiddenPosts) {
      setHiddenPosts([...hiddenPosts, post._id]);
    }
  };

  // Extract and process data
  const { data: entities, pagination: paginationData } = extractPaginationData<Post>(data, 'posts');

  // Notify parent of total count changes
  useEffect(() => {
    if (onTotalCountChange && paginationData.total !== undefined) {
      onTotalCountChange(paginationData.total);
    }
  }, [paginationData.total, onTotalCountChange]);

  // Filter out hidden posts and add rank
  const processedPosts = entities
    .map((post: Post, index: number) => ({ ...post, rank: index + 1 }))
    .filter((post: Post) => !hiddenPosts.includes(post._id));

  // Render individual post
  const renderPost = (post: Post): JSX.Element => (
    <div key={post._id} className="w-full mb-4">
      <PostCard
        {...post}
        onHidePost={handleHidePost}
        user={user}
      />
    </div>
  );

  // Render empty state
  const renderEmpty = (): JSX.Element => (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-semibold text-muted-foreground mb-2">No posts found</h3>
      <p className="text-muted-foreground">
        {searchKey 
          ? `No posts match your search for "${searchKey}"` 
          : 'No posts available at the moment'}
      </p>
    </div>
  );

  // Render error state
  const renderError = (err: Error, onRetry?: () => void): JSX.Element => (
    <div className="text-center py-12">
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertCircle className="h-5 w-5" />
        <AlertDescription className="ml-2">
          <div className="font-semibold mb-2">Something went wrong</div>
          <p className="text-sm mb-4">
            {err.message || 'An error occurred while loading posts'}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );

  // Render loading state
  const renderLoading = (): JSX.Element => (
    <div className="space-y-4">
      <PostSkeleton />
    </div>
  );

  return (
    <PaginatedList
      data={processedPosts}
      loading={loading}
      error={error}
      totalCount={paginationData.total}
      defaultPageSize={defaultPageSize}
      pageParam={pageParam}
      pageSizeParam={pageSizeParam}
      showPageInfo={showPageInfo}
      showFirstLast={showFirstLast}
      maxVisiblePages={maxVisiblePages}
      renderItem={renderPost}
      renderEmpty={renderEmpty}
      renderError={renderError}
      renderLoading={renderLoading}
      onRefresh={refetch}
      className={`w-full max-w-full overflow-x-hidden ${className || ''}`}
      contentClassName={contentClassName}
      paginationClassName={paginationClassName}
      {...otherProps}
    >
      <div className="flex flex-col items-stretch space-y-0">
        {processedPosts.map(renderPost)}
      </div>
    </PaginatedList>
  );
}
