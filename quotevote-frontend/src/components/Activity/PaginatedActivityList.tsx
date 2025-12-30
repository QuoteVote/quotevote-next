'use client'

import { useEffect } from 'react'
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useQuery export
import { useQuery } from '@apollo/client'
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { PaginatedList } from '@/components/common/PaginatedList'
import { ActivityCard } from '@/components/ui/ActivityCard'
import { GET_USER_ACTIVITY } from '@/graphql/queries'
import { pageToOffset, extractPaginationData } from '@/lib/utils/pagination'
import { usePaginationWithFilters } from '@/hooks/usePagination'
import { useWidth } from '@/hooks/useResponsive'
import getCardBackgroundColor from '@/lib/utils/getCardBackgroundColor'
import { getActivityContent } from '@/lib/utils/getActivityContent'
import { CREATE_POST_MESSAGE_ROOM, UPDATE_POST_BOOKMARK } from '@/graphql/mutations'
import {
  GET_CHAT_ROOMS,
  GET_POST,
  GET_TOP_POSTS,
} from '@/graphql/queries'
import { useAppStore } from '@/store'
import useGuestGuard from '@/hooks/useGuestGuard'
import { useRouter } from 'next/navigation'
import type { PaginatedActivityListProps, ActivityEntity } from '@/types/activity'

function LoadActivityCard({
  width,
  activity,
}: {
  width: 'lg' | 'md' | 'sm' | 'xl' | 'xs'
  activity: ActivityEntity
}) {
  const router = useRouter()
  const {
    post,
    user,
    quote,
    comment,
    vote,
    created,
    activityType,
  } = activity

  // Hooks must be called unconditionally before any early returns
  const currentUser = useAppStore((state) => state.user.data)
  const [createPostMessageRoom] = useMutation(CREATE_POST_MESSAGE_ROOM)
  const [updatePostBookmark] = useMutation(UPDATE_POST_BOOKMARK)
  const ensureAuth = useGuestGuard()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)

  if (!post) {
    return null
  }

  const {
    url,
    bookmarkedBy = [],
    upvotes = 0,
    downvotes = 0,
    comments = [],
    votes = [],
    quotes = [],
    messageRoom,
  } = post

  const messages = messageRoom?.messages || []
  const postId = post._id
  const { username, avatar, name } = user
  const limit = 5

  const type =
    activityType === 'VOTED' && vote
      ? `${vote.type}${activityType}`
      : activityType

  const content = getActivityContent(
    type,
    post as unknown as { text: string; [key: string]: unknown },
    quote as unknown as { startWordIndex: number; endWordIndex: number; [key: string]: unknown } | undefined,
    vote as unknown as { startWordIndex: number; endWordIndex: number; type?: string; [key: string]: unknown } | undefined,
    comment as unknown as { startWordIndex: number; endWordIndex: number; [key: string]: unknown } | undefined
  )

  const handleLike = async () => {
    if (!ensureAuth() || !currentUser?._id) return

    await updatePostBookmark({
      variables: { postId, userId: currentUser._id },
    })

    await createPostMessageRoom({
      variables: { postId },
      refetchQueries: [
        {
          query: GET_CHAT_ROOMS,
        },
        {
          query: GET_POST,
          variables: {
            postId,
          },
        },
        {
          query: GET_USER_ACTIVITY,
          variables: {
            user_id: currentUser._id,
            limit,
            offset: 0,
            searchKey: '',
            activityEvent: [],
          },
        },
        {
          query: GET_TOP_POSTS,
          variables: { limit, offset: 0, searchKey: '', interactions: false },
        },
      ],
    })
  }

  const handleRedirectToProfile = (profileUsername: string) => {
    router.push(`/Profile/${profileUsername}`)
  }

  const isLiked = currentUser?._id && typeof currentUser._id === 'string' ? bookmarkedBy.includes(currentUser._id) : false

  const handleCardClick = () => {
    // Check if user is in guest mode
    if (!ensureAuth()) {
      // Redirect to search page for guest users
      router.push('/search')
      return
    }

    // For authenticated users, proceed with normal post navigation
    setSelectedPost(postId)
    router.push(url.replace(/\?/g, ''))
  }

  return (
    <div
      className="rounded-lg shadow-lg border mb-2 w-full max-w-full overflow-x-hidden box-border"
      style={{ borderRadius: 7 }}
    >
      <ActivityCard
        avatar={avatar}
        cardColor={getCardBackgroundColor(type)}
        name={name}
        username={username}
        date={created}
        upvotes={upvotes}
        downvotes={downvotes}
        comments={comments}
        messages={messages}
        votes={votes}
        quotes={quotes}
        liked={isLiked}
        post={post ? { ...post, created: typeof post.created === 'number' ? String(post.created) : post.created, title: post.title ?? null } as Partial<import('@/types/post').Post> : undefined}
        content={content}
        width={width}
        onLike={handleLike}
        handleRedirectToProfile={handleRedirectToProfile}
        onCardClick={handleCardClick}
        activityType={type}
      />
    </div>
  )
}

export function PaginatedActivityList({
  defaultPageSize = 15,
  pageParam = 'page',
  pageSizeParam = 'page_size',
  userId,
  searchKey = '',
  startDateRange,
  endDateRange,
  activityEvent = ['POSTED'],
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  className,
  contentClassName,
  paginationClassName,
}: PaginatedActivityListProps) {
  const width = useWidth()
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
    [userId, searchKey, startDateRange, endDateRange, activityEvent]
  )

  // Create GraphQL variables - convert page to offset
  const { limit, offset } = pageToOffset(pagination.currentPage, pagination.pageSize)

  // Fetch data
  const { loading, error, data, refetch } = useQuery(GET_USER_ACTIVITY, {
    variables: {
      user_id: userId || '',
      limit,
      offset,
      searchKey: searchKey || '',
      startDateRange: startDateRange || null,
      endDateRange: endDateRange || null,
      activityEvent: activityEvent,
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
    skip: !userId,
  })

  // Ensure data is fetched when component mounts with page parameter
  useEffect(() => {
    if (pagination.currentPage > 1 && (!data || !data.activities)) {
      refetch()
    }
  }, [pagination.currentPage, data, refetch])

  // Extract and process data
  const { data: entities, pagination: paginationData } = extractPaginationData(
    data,
    'activities'
  )

  // Filter out hidden posts
  const processedActivities = (entities as ActivityEntity[]).filter(
    (activity) => !hiddenPosts.includes(activity._id)
  )

  // Render individual activity
  const renderActivity = (activity: ActivityEntity) => (
    <LoadActivityCard key={activity._id} activity={activity} width={width} />
  )

  // Render empty state
  const renderEmpty = () => (
    <div className="text-center p-8">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-lg font-semibold text-muted-foreground mb-2">
        No activities found
      </h3>
      <p className="text-sm text-muted-foreground">
        {searchKey
          ? `No activities match your search for "${searchKey}"`
          : 'No activities available at the moment'}
      </p>
    </div>
  )

  // Render error state
  const renderError = (
    error: Error | { message?: string },
    onRetry?: () => void
  ) => (
    <div className="text-center p-8">
      <div className="text-6xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-destructive mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {error.message || 'An error occurred while loading activities'}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:bg-[var(--color-primary)]/90"
        >
          Try Again
        </button>
      )}
    </div>
  )

  // Render loading state
  const renderLoading = () => (
    <div className="text-center p-8">
      <div className="text-4xl mb-4">⏳</div>
      <p className="text-sm text-muted-foreground">Loading activities...</p>
    </div>
  )

  return (
    <PaginatedList
      data={processedActivities}
      loading={loading}
      error={error}
      totalCount={typeof paginationData?.total_count === 'number' ? paginationData.total_count : 0}
      defaultPageSize={defaultPageSize}
      pageParam={pageParam}
      pageSizeParam={pageSizeParam}
      showPageInfo={showPageInfo}
      showFirstLast={showFirstLast}
      maxVisiblePages={maxVisiblePages}
      renderItem={renderActivity}
      renderEmpty={renderEmpty}
      renderError={renderError}
      renderLoading={renderLoading}
      onRefresh={onRefresh ?? refetch}
      className={className}
      contentClassName={contentClassName}
      paginationClassName={paginationClassName}
    >
      <div className="flex flex-col gap-5">
        {processedActivities.map(renderActivity)}
      </div>
    </PaginatedList>
  )
}

