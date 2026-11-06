'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import type { DocumentNode } from '@apollo/client'
import { AlertTriangle, FileText, Loader2, RotateCcw, SearchX } from 'lucide-react'
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
  tagId,
  approved,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  loadMoreMode = false,
  emptyTitle = 'No posts yet',
  emptyMessage = 'New posts will show up here.',
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onTotalCountChange,
  className,
  contentClassName,
  paginationClassName,
  compact = false,
  query,
  dataKey = 'posts',
}: PaginatedPostsListProps & { query?: DocumentNode; dataKey?: string }) {
  const router = useRouter()
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
    [searchKey, startDateRange, endDateRange, friendsOnly, interactions, userId, sortOrder, tagId, approved]
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
    tagId,
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
  }, [searchKey, startDateRange, endDateRange, friendsOnly, interactions, userId, sortOrder, tagId, approved, loadMoreMode])

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
      tagId,
      approved,
    })

    fetchMore({
      variables: nextVariables,
    }).catch(() => {
      setIsLoadingMore(false)
    })
  }, [isLoadingMore, loading, loadMorePage, defaultPageSize, searchKey, startDateRange, endDateRange, friendsOnly, interactions, userId, sortOrder, tagId, approved, fetchMore])

  // Determine which posts to display
  const basePosts = loadMoreMode ? allLoadedPosts : (entities || [])

  // When "Most Popular" is active, sort by total interaction count using actual returned data
  const sortedPosts = interactions
    ? [...basePosts].sort((a, b) => {
        const countInteractions = (p: Post) =>
          (p.approvedBy?.length ?? 0) +
          (p.rejectedBy?.length ?? 0) +
          (p.comments?.length ?? 0) +
          (p.votes?.length ?? 0) +
          (p.quotes?.length ?? 0) +
          (p.messageRoom && 'messages' in p.messageRoom
            ? ((p.messageRoom as { messages?: unknown[] }).messages?.length ?? 0)
            : 0)
        return countInteractions(b) - countInteractions(a)
      })
    : basePosts

  // Filter out hidden posts and add rank
  const processedPosts = sortedPosts
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
      tagId={post.tagId}
      citationUrl={post.citationUrl || undefined}
      attribution={post.attribution || undefined}
      searchKey={searchKey}
      compact={compact}
    />
  )

  // Render empty state: say why the list is empty and offer a way out (#528)
  const hasFilters = Boolean(
    searchKey || tagId || friendsOnly || interactions || startDateRange || endDateRange
  )
  const otherFilters = Boolean(tagId || friendsOnly || interactions || startDateRange || endDateRange)
  const clearFilters = () => {
    router.replace(window.location.pathname)
  }
  const renderEmpty = () => {
    const EmptyIcon = hasFilters ? SearchX : FileText
    let message = emptyMessage
    if (searchKey) {
      message = `Nothing matches \u201c${searchKey}\u201d${otherFilters ? ' with the current filters' : ''}. Try other words${otherFilters ? ' or clear the filters' : ''}.`
    } else if (friendsOnly && !tagId && !startDateRange && !endDateRange) {
      message = 'Posts from people you follow will show up here.'
    } else if (hasFilters) {
      message = 'Try another tag or date range, or clear the filters.'
    }
    return (
      <div
        className="mx-4 my-4 flex flex-col items-center rounded-lg border border-border/60 bg-card px-6 py-10 text-center"
        role="status"
        data-testid="posts-empty"
      >
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
          <EmptyIcon className="size-6 text-muted-foreground" aria-hidden="true" />
        </span>
        <h3 className="text-base font-semibold text-foreground">
          {hasFilters ? 'No posts found' : emptyTitle}
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
        {hasFilters && (
          <Button type="button" variant="outline" className="mt-4" onClick={clearFilters}>
            Clear search and filters
          </Button>
        )}
      </div>
    )
  }

  // Render error state: plain language, never the raw error text
  const renderError = (_error: Error | { message?: string }, onRetry?: () => void) => (
    <div
      className="mx-4 my-4 flex flex-col items-center rounded-lg border border-border/60 bg-card px-6 py-10 text-center"
      role="alert"
      data-testid="posts-error"
    >
      <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold text-foreground">Posts couldn&apos;t load</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Check your connection and try again.
      </p>
      {onRetry && (
        // Call it without the click event: refetch would treat the event as query variables.
        <Button type="button" variant="outline" className="mt-4" onClick={() => onRetry()}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </Button>
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
