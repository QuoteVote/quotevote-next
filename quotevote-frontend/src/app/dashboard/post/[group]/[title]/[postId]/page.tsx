'use client'

/**
 * Individual Post Detail Page
 *
 * Two-column layout: Post + Comments on left, LatestQuotes sidebar on right.
 *
 * Route: /dashboard/post/[group]/[title]/[postId]
 */

import { useParams } from 'next/navigation'
import { useQuery } from '@apollo/client/react'
import PostController from '@/components/Post/PostController'
import { LatestQuotes } from '@/components/Quotes/LatestQuotes'
import CommentList from '@/components/Comment/CommentList'
import CommentInput from '@/components/Comment/CommentInput'
import { GET_POST } from '@/graphql/queries'
import type { PostQueryData } from '@/types/post'
import type { CommentData } from '@/types/comment'

export default function PostDetailPage(): React.ReactNode {
  const params = useParams<{ postId: string }>()
  const postId = params?.postId

  if (!postId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4">
      {/* Left column - Post + Comments */}
      <div className="flex-1 min-w-0 space-y-4">
        <PostController postId={postId} />
        <CommentsSection postId={postId} />
      </div>
      {/* Right column - LatestQuotes sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <LatestQuotes limit={5} />
      </div>
    </div>
  )
}

function CommentsSection({ postId }: { postId: string }) {
  const { loading, data } = useQuery<PostQueryData>(GET_POST, {
    variables: { postId },
    fetchPolicy: 'cache-first',
  })
  const post = data?.post

  // Map PostComment[] to CommentData[] — content is required in CommentData
  const comments: CommentData[] = (post?.comments || []).map((c) => ({
    _id: c._id,
    userId: c.userId,
    content: c.content || '',
    created: c.created,
    user: {
      _id: c.user?._id,
      username: c.user?.username || '',
      name: c.user?.name || undefined,
      avatar: c.user?.avatar || '',
    },
    // pass through extra fields
    startWordIndex: c.startWordIndex,
    endWordIndex: c.endWordIndex,
    postId: c.postId,
    url: c.url,
    reaction: c.reaction,
  }))

  return (
    <div className="bg-card rounded-xl p-4">
      <CommentInput actionId={postId} />
      <div className="mt-4">
        <CommentList
          comments={comments}
          loading={loading}
          postUrl={post?.url ?? undefined}
        />
      </div>
    </div>
  )
}
