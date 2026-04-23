'use client'

import { useEffect, useState, useCallback } from 'react'
import { useQuery } from '@apollo/client/react'
import type { DocumentNode } from '@apollo/client'
import { Loader2 } from 'lucide-react'
import { PaginatedList } from '@/components/common/PaginatedList'
import { Button } from '@/components/ui/button'
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
  loadMoreMode = false,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onTotalCountChange,
  className,
  contentClassName,
  paginationClassName,
  query,
  dataKey = 'posts',
}: PaginatedPostsListProps & { query?: DocumentNode; dataKey?: string }) {
  const hiddenPosts = useAppStore((state) => state.ui.hiddenPosts) || []

  // Load-more state
  const [allLoadedPosts, setAllLoadedPosts] = useState<Post[]>([])
  const [loadMorePage, setLoadMorePage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

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
  const currentPage = loadMoreMode ? loadMorePage : pagination.currentPage
  const variables = createGraphQLVariables({
    page: currentPage,
    pageSize: loadMoreMode ? defaultPageSize : pagination.pageSize,
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
  const { loading, error, data, refetch, fetchMore } = useQuery<PaginatedPostsListData>(query || GET_TOP_POSTS, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-and-network',
  })

  // Ensure data is fetched when component mounts with page parameter
  useEffect(() => {
    if (!loadMoreMode && pagination.currentPage > 1 && (!data || !(data as unknown as Record<string, unknown>)[dataKey])) {
      refetch()
    }
  }, [pagination.currentPage, data, refetch, dataKey, loadMoreMode])

  // Force refetch when component mounts with a page parameter from URL
  useEffect(() => {
    if (!loadMoreMode && pagination.currentPage > 1) {
      refetch()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount - refetch is stable from useQuery

  // Extract and process data
  const { data: entities, pagination: paginationData } = extractPaginationData<Post>(
    (data as unknown as Record<string, unknown>) || {},
    dataKey
  )

  // Reset accumulated posts when filters change in load-more mode
  useEffect(() => {
    if (loadMoreMode) {
      setAllLoadedPosts([])
      setLoadMorePage(1)
    }
  }, [searchKey, startDateRange, endDateRange, friendsOnly, interactions, userId, sortOrder, groupId, approved, loadMoreMode])

  // Accumulate posts in load-more mode
  useEffect(() => {
    if (loadMoreMode && entities && entities.length > 0) {
      if (loadMorePage === 1) {
        setAllLoadedPosts(entities)
      } else {
        setAllLoadedPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p._id))
          const newPosts = entities.filter((p) => !existingIds.has(p._id))
          return [...prev, ...newPosts]
        })
      }
      setIsLoadingMore(false)
    }
  }, [entities, loadMoreMode, loadMorePage])

  // Notify parent of total count changes
  useEffect(() => {
    if (onTotalCountChange && paginationData?.total !== undefined) {
      onTotalCountChange(paginationData.total)
    }
  }, [paginationData?.total, onTotalCountChange])

  // Load more handler
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || loading) return
    setIsLoadingMore(true)
    const nextPage = loadMorePage + 1
    setLoadMorePage(nextPage)

    const nextVariables = createGraphQLVariables({
      page: nextPage,
      pageSize: defaultPageSize,
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

    fetchMore({
      variables: nextVariables,
    }).catch(() => {
      setIsLoadingMore(false)
    })
  }, [isLoadingMore, loading, loadMorePage, defaultPageSize, searchKey, startDateRange, endDateRange, friendsOnly, interactions, userId, sortOrder, groupId, approved, fetchMore])

  // Determine which posts to display
  const basePosts = loadMoreMode ? allLoadedPosts : (entities || [])

  // Filter out hidden posts and add rank
  const processedPosts = basePosts
    .map((post, index) => ({ ...post, rank: index + 1 }))
    .filter((post) => !hiddenPosts.includes(post._id))

  const hasMore = loadMoreMode && paginationData
    ? loadMorePage < (paginationData.total > 0 ? Math.ceil(paginationData.total / defaultPageSize) : 1)
    : false

  // Render individual post
  const renderPost = (post: Post & { rank?: number }) => (
    <PostCard
      key={post._id}
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
      citationUrl={post.citationUrl || undefined}
    />
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

  // Render loading state — PostSkeleton already renders 3 cards
  const renderLoading = () => <PostSkeleton />

  // Load More mode — render without PaginatedList wrapper
  if (loadMoreMode) {
    if (loading && processedPosts.length === 0) {
      return renderLoading()
    }

    if (error && processedPosts.length === 0) {
      return renderError(error, onRefresh || refetch)
    }

    if (!loading && processedPosts.length === 0) {
      return renderEmpty()
    }

    return (
      <div className={className}>
        <div className={contentClassName}>
          <div className="flex flex-col gap-4 px-4 py-4">
            {processedPosts.map(renderPost)}
          </div>

          {/* Load More button + skeleton loaders */}
          {hasMore && (
            <div className="flex flex-col items-center py-6 gap-4">
              {isLoadingMore && <PostSkeleton />}
              <Button
                variant="outline"
                size="lg"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-full px-8 gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
              {paginationData && (
                <p className="text-xs text-muted-foreground">
                  Showing {processedPosts.length} of {paginationData.total} posts
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default: paginated mode
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
      <div className="flex flex-col gap-4 px-4 py-4">
        {processedPosts.map(renderPost)}
      </div>
    </PaginatedList>
  )
}

