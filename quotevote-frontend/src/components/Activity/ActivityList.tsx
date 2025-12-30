'use client'

import { useRouter } from 'next/navigation'
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { useAppStore } from '@/store'
import { ActivityCard } from '@/components/ui/ActivityCard'
import { ActivitySkeletonLoader } from './ActivitySkeleton'
import { ActivityEmptyList } from './ActivityEmptyList'
import { useWidth } from '@/hooks/useResponsive'
import getCardBackgroundColor from '@/lib/utils/getCardBackgroundColor'
import { getActivityContent } from '@/lib/utils/getActivityContent'
import { CREATE_POST_MESSAGE_ROOM, UPDATE_POST_BOOKMARK } from '@/graphql/mutations'
import {
  GET_CHAT_ROOMS,
  GET_POST,
  GET_TOP_POSTS,
  GET_USER_ACTIVITY,
} from '@/graphql/queries'
import useGuestGuard from '@/hooks/useGuestGuard'
import type { ActivityListProps, ActivityEntity } from '@/types/activity'

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
  )
}

function LoadActivityList({
  data,
  onLoadMore,
}: {
  data: ActivityListProps['data']
  onLoadMore?: () => void
}) {
  const hiddenPosts = useAppStore((state) => state.ui.hiddenPosts) || []
  const width = useWidth()

  if (!data || !data.activities.pagination.total_count) {
    return <ActivityEmptyList />
  }

  const activities = data.activities.entities.filter(
    (activity) => !hiddenPosts.includes(activity._id)
  )
  const hasMore =
    data.activities.pagination.total_count > activities.length

  return (
    <div className="space-y-5">
      {activities.map((activity) => (
        <div
          key={activity._id}
          className="rounded-lg shadow-lg border"
          style={{ borderRadius: 7 }}
        >
          <LoadActivityCard activity={activity} width={width} />
        </div>
      ))}
      {hasMore && onLoadMore && (
        <div className="flex justify-center items-center py-4">
          <button
            type="button"
            onClick={onLoadMore}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

export function ActivityList({
  data,
  loading,
  fetchMore,
  variables,
}: ActivityListProps) {
  if (loading) return <ActivitySkeletonLoader cols={1} />

  const newOffset = data && data.activities.entities.length

  return (
    <LoadActivityList
      data={data}
      onLoadMore={
        fetchMore && newOffset
          ? () =>
              fetchMore({
                variables: {
                  ...variables,
                  offset: newOffset,
                },
                updateQuery: (prev, { fetchMoreResult }) => {
                  if (!fetchMoreResult) return prev
                  return {
                    ...prev,
                    activities: {
                      ...fetchMoreResult.activities,
                      entities: [
                        ...prev.activities.entities,
                        ...fetchMoreResult.activities.entities,
                      ],
                    },
                  }
                },
              })
          : undefined
      }
    />
  )
}

