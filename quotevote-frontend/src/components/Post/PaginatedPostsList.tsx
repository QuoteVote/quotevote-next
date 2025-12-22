'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { PaginatedList } from '@/components/common/PaginatedList'
import PostCard from './PostCard'
import PostSkeleton from './PostSkeleton'
import { GET_TOP_POSTS } from '@/graphql/queries'
import { createGraphQLVariables, extractPaginationData } from '@/lib/utils/pagination'
import { usePaginationWithFilters } from '@/hooks/usePagination'
import { useAppStore } from '@/store'
import type {
  Post,
  PaginatedPostsListData,
  PaginatedPostsListProps,
} from '@/types/post'

export default function PaginatedPostsList({
  defaultPageSize = 20,
  pageParam = 'page',
  pageSizeParam = 'page_size',
  searchKey = '',
  startDateRange,
  endDateRange,
  friendsOnly = false,
  interactions = false,
  userId,
  sortOrder,
  groupId,
  approved,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onTotalCountChange,
  className,
  contentClassName,
  paginationClassName,
}: PaginatedPostsListProps) {
  const hiddenPosts = useAppStore((state) => state.ui.hiddenPosts) || []

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
  )

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
  })

  // Fetch data
  const { loading, error, data, refetch } = useQuery<PaginatedPostsListData>(GET_TOP_POSTS, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-and-network',
  })

  // Ensure data is fetched when component mounts with page parameter
  useEffect(() => {
    if (pagination.currentPage > 1 && (!data || !data.posts)) {
      refetch()
    }
  }, [pagination.currentPage, data, refetch])

  // Force refetch when component mounts with a page parameter from URL
  useEffect(() => {
    if (pagination.currentPage > 1) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - refetch is stable from useQuery

  // Handle hide post (currently not used but kept for future use)
  // const handleHidePost = (postId: string) => {
  //   addHiddenPost(postId)
  // }

  // Extract and process data
  const { data: entities, pagination: paginationData } = extractPaginationData<Post>(
    (data as unknown as Record<string, unknown>) || {},
    'posts'
  )

  // Notify parent of total count changes
  useEffect(() => {
    if (onTotalCountChange && paginationData?.total !== undefined) {
      onTotalCountChange(paginationData.total)
    }
  }, [paginationData?.total, onTotalCountChange])

  // Filter out hidden posts and add rank
  const processedPosts = (entities || [])
    .map((post, index) => ({ ...post, rank: index + 1 }))
    .filter((post) => !hiddenPosts.includes(post._id))

  // Render individual post
  const renderPost = (post: Post & { rank?: number }) => (
    <div key={post._id} className="w-full max-w-full overflow-x-hidden box-border mb-[-25px]">
      <PostCard
        _id={post._id}
        text={post.text || ''}
        title={post.title || ''}
        url={post.url || ''}
        created={post.created}
        creator={post.creator || undefined}
        bookmarkedBy={post.bookmarkedBy || undefined}
        approvedBy={post.approvedBy || undefined}
        rejectedBy={post.rejectedBy || undefined}
        votes={post.votes || undefined}
        comments={post.comments || undefined}
        quotes={post.quotes || undefined}
        messageRoom={post.messageRoom || undefined}
        groupId={post.groupId}
      />
    </div>
  )

  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-gray-600 mb-2">No posts found</h3>
      <p className="text-gray-400">
        {searchKey ? `No posts match your search for "${searchKey}"` : 'No posts available at the moment'}
      </p>
    </div>
  )

  // Render error state
  const renderError = (error: Error | { message?: string }, onRetry?: () => void) => (
    <div className="text-center py-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-red-600 mb-2">Something went wrong</h3>
      <p className="text-gray-600 mb-4">
        {error?.message || 'An error occurred while loading posts'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-[#52b274] text-white border-none rounded cursor-pointer hover:bg-[#45a066] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )

  // Render loading state
  const renderLoading = () => (
    <div className="flex flex-col gap-4">
      <div className="w-full max-w-full overflow-x-hidden box-border">
        <PostSkeleton />
      </div>
    </div>
  )

  return (
    <PaginatedList
      data={processedPosts}
      loading={loading}
      error={error || undefined}
      totalCount={paginationData?.total || 0}
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
      onRefresh={onRefresh || refetch}
      className={className}
      contentClassName={contentClassName}
      paginationClassName={paginationClassName}
    >
      <div className="flex flex-col gap-0">
        {processedPosts.map(renderPost)}
      </div>
    </PaginatedList>
  )
}

