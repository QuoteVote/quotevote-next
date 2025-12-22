'use client'

import { useState, useEffect, useRef } from 'react'
import PostCard from './PostCard'
import PostSkeleton from './PostSkeleton'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAppStore } from '@/store'
import type {
  LoadPostsListProps,
  PostListProps,
} from '@/types/post'

function LoadPostsList({ data, onLoadMore, loading = false }: LoadPostsListProps) {
  const hiddenPosts = useAppStore((state) => state.ui.hiddenPosts) || []
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // Calculate derived values before early returns
  const rankedPosts = (data?.posts?.entities || [])
    .map((post, index) => ({ ...post, rank: index + 1 }))
    .filter((post) => !hiddenPosts.includes(post._id))

  const hasMore = (data?.posts?.pagination?.total_count || 0) > rankedPosts.length

  // Set up intersection observer for infinite scroll - must be called before any early returns
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          setIsLoadingMore(true)
          onLoadMore()
          setTimeout(() => setIsLoadingMore(false), 500)
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, isLoadingMore, onLoadMore])

  // Show loading state when loading and no data yet
  if (loading && (!data || !data.posts || data.posts.entities.length === 0)) {
    return (
      <div className="flex flex-col gap-4">
        <PostSkeleton />
      </div>
    )
  }

  // Only show empty state when not loading and no data
  if (!loading && (!data || !data.posts || data.posts.entities.length === 0)) {
    return (
      <div className="w-[90%] text-center py-8">
        <span>No posts found.</span>
        <br />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {rankedPosts.map((post) => (
        <div key={post._id} className="mb-[-25px]">
          <PostCard
            _id={post._id}
            text={post.text || ''}
            title={post.title || ''}
            url={post.url || ''}
            bookmarkedBy={post.bookmarkedBy || []}
            approvedBy={post.approvedBy || []}
            rejectedBy={post.rejectedBy || []}
            created={post.created}
            creator={post.creator || undefined}
            votes={post.votes || []}
            comments={post.comments || []}
            quotes={post.quotes || []}
            messageRoom={post.messageRoom || undefined}
            groupId={post.groupId || undefined}
          />
        </div>
      ))}
      {hasMore && (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isLoadingMore && <LoadingSpinner size={30} />}
        </div>
      )}
    </div>
  )
}


export default function PostList({
  data,
  loading,
  fetchMore,
  variables,
}: PostListProps) {
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-4">
        <PostSkeleton />
      </div>
    )
  }

  const newOffset = data?.posts.entities.length || 0

  return (
    <LoadPostsList
      data={data}
      loading={loading}
      onLoadMore={() =>
        fetchMore({
          variables: {
            ...variables,
            offset: newOffset,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult) return prev
            return {
              ...prev,
              posts: {
                ...fetchMoreResult.posts,
                entities: [
                  ...prev.posts.entities,
                  ...fetchMoreResult.posts.entities,
                ],
              },
            }
          },
        })
      }
    />
  )
}

