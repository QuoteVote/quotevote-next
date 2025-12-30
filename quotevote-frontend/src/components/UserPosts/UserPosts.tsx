'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PaginatedList } from '@/components/common/PaginatedList'
import { PostCard } from './PostCard'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store'
import { createGraphQLVariables, extractPaginationData } from '@/lib/utils/pagination'
import { usePagination } from '@/hooks/usePagination'
import type { UserPostsProps } from '@/types/userPosts'
import type { Post } from '@/types/post'
import { GET_TOP_POSTS } from '@/graphql/queries'

/**
 * UserPosts Component
 * 
 * Displays all posts authored by a specific user.
 * Uses Apollo Client for GraphQL data fetching and PaginatedList for pagination.
 * 
 * @param userId - User ID to fetch posts for
 */
export function UserPosts({ userId }: UserPostsProps) {
  const hiddenPosts = useAppStore((state) => state.ui.hiddenPosts)

  // Pagination hook
  const pagination = usePagination({
    defaultPageSize: 15,
    pageParam: 'page',
    pageSizeParam: 'page_size',
  })

  // Create GraphQL variables
  const variables = createGraphQLVariables({
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    searchKey: '',
    userId,
    sortOrder: 'created',
  })

  // Fetch posts data using GET_TOP_POSTS query with userId filter
  const { loading, error, data, refetch } = useQuery(GET_TOP_POSTS, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-and-network',
  })

  // Scroll to top on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  // Extract pagination data from GraphQL response
  const { data: posts, pagination: paginationData } = extractPaginationData<Post>(
    (data || {}) as Record<string, unknown>,
    'posts'
  )

  // Filter out hidden posts
  const visiblePosts = (posts || []).filter(
    (post) => !hiddenPosts.includes(post._id)
  )

  // Render post card
  const renderPost = (post: Post, index: number) => (
    <div key={post._id} className="w-full">
      <PostCard post={post} index={index} />
    </div>
  )

  // Render empty state
  const renderEmpty = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No posts found
          </h3>
          <p className="text-sm text-muted-foreground">
            This user hasn&apos;t created any posts yet.
          </p>
        </div>
      </CardContent>
    </Card>
  )

  // Render error state
  const renderError = (error: Error | { message?: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Error loading posts
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || 'An error occurred while loading posts.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  // Render loading state
  const renderLoading = () => (
    <div className="w-full space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="pt-6">
            <div className="h-24 bg-muted rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center w-full">
        <div className="w-full">
          <PaginatedList
            data={visiblePosts}
            loading={loading}
            error={error}
            totalCount={paginationData?.total ?? 0}
            defaultPageSize={15}
            pageParam="page"
            pageSizeParam="page_size"
            showPageInfo={true}
            showFirstLast={true}
            maxVisiblePages={5}
            renderItem={renderPost}
            renderEmpty={renderEmpty}
            renderError={renderError}
            renderLoading={renderLoading}
            onRefresh={refetch}
            className="w-full"
          >
            <div className="flex flex-col gap-0 w-full">
              {visiblePosts.map((post, index) => renderPost(post, index))}
            </div>
          </PaginatedList>
        </div>
      </div>
    </ErrorBoundary>
  )
}

