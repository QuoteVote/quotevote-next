'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PaginatedList } from '@/components/common/PaginatedList'
import PostCard from '@/components/Post/PostCard'
import PostSkeleton from '@/components/Post/PostSkeleton'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/store'
import { createGraphQLVariables, extractPaginationData } from '@/lib/utils/pagination'
import { usePagination } from '@/hooks/usePagination'
import type { UserPostsProps } from '@/types/userPosts'
import type { Post } from '@/types/post'
import { GET_TOP_POSTS } from '@/graphql/queries'

export function UserPosts({ userId }: UserPostsProps) {
  const hiddenPosts = useAppStore((state) => state.ui.hiddenPosts)

  const pagination = usePagination({
    defaultPageSize: 15,
    pageParam: 'page',
    pageSizeParam: 'page_size',
  })

  const variables = createGraphQLVariables({
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    searchKey: '',
    userId,
    sortOrder: 'created',
  })

  const { loading, error, data, refetch } = useQuery(GET_TOP_POSTS, {
    variables,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    nextFetchPolicy: 'cache-and-network',
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
  }, [])

  const { data: posts, pagination: paginationData } = extractPaginationData<Post>(
    (data || {}) as Record<string, unknown>,
    'posts'
  )

  const visiblePosts = (posts || []).filter((post) => !hiddenPosts.includes(post._id))

  const renderPost = (post: Post, _index?: number) => (
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

  const renderEmpty = () => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No posts found</h3>
          <p className="text-sm text-muted-foreground">
            This user hasn&apos;t created any posts yet.
          </p>
        </div>
      </CardContent>
    </Card>
  )

  const renderError = (err: Error | { message?: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-destructive mb-2">Error loading posts</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {err.message || 'An error occurred while loading posts.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )

  const renderLoading = () => <PostSkeleton />

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
            <div className="flex flex-col gap-4 px-4 py-4">
              {visiblePosts.map(renderPost)}
            </div>
          </PaginatedList>
        </div>
      </div>
    </ErrorBoundary>
  )
}
