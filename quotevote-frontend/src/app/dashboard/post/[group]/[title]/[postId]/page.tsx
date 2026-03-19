'use client'

/**
 * Individual Post Detail Page
 *
 * Two-column layout: Post + Tabbed Comments/Discussion on left, LatestQuotes sidebar on right.
 *
 * Route: /dashboard/post/[group]/[title]/[postId]
 */

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import PostController from '@/components/Post/PostController'
import { LatestQuotes } from '@/components/Quotes/LatestQuotes'
import CommentList from '@/components/Comment/CommentList'
import CommentInput from '@/components/Comment/CommentInput'
import PostChatMessage from '@/components/PostChat/PostChatMessage'
import PostChatSend from '@/components/PostChat/PostChatSend'
import { GET_POST, GET_ROOM_MESSAGES } from '@/graphql/queries'
import { CREATE_POST_MESSAGE_ROOM } from '@/graphql/mutations'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PostQueryData } from '@/types/post'
import type { CommentData } from '@/types/comment'
import type { PostChatMessageData } from '@/types/postChat'

/** Response shape for CREATE_POST_MESSAGE_ROOM mutation */
interface CreatePostMessageRoomData {
  createPostMessageRoom: {
    _id: string
    users?: string[]
    messageType?: string
    created?: string
    title?: string
    avatar?: string
  }
}

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
      {/* Left column - Post + Tabs */}
      <div className="flex-1 min-w-0 space-y-4">
        <PostController postId={postId} />
        <PostTabs postId={postId} />
      </div>
      {/* Right column - LatestQuotes sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <LatestQuotes limit={5} />
      </div>
    </div>
  )
}

function PostTabs({ postId }: { postId: string }) {
  return (
    <Tabs defaultValue="comments" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="comments" className="flex-1">Comments</TabsTrigger>
        <TabsTrigger value="discussion" className="flex-1">Discussion</TabsTrigger>
      </TabsList>
      <TabsContent value="comments">
        <CommentsSection postId={postId} />
      </TabsContent>
      <TabsContent value="discussion">
        <DiscussionSection postId={postId} />
      </TabsContent>
    </Tabs>
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

/** Response shape for GET_ROOM_MESSAGES with user data */
interface RoomMessagesData {
  messages: Array<{
    _id: string
    messageRoomId: string
    userId: string
    userName?: string
    title?: string
    text?: string
    created: string
    type?: string
    user?: {
      _id?: string
      name?: string
      username?: string
      avatar?: string
    }
  }>
}

function DiscussionSection({ postId }: { postId: string }) {
  const [roomId, setRoomId] = useState<string | null>(null)

  const { data: postData } = useQuery<PostQueryData>(GET_POST, {
    variables: { postId },
    fetchPolicy: 'cache-first',
  })
  const postTitle = postData?.post?.title

  const [createRoom] = useMutation<CreatePostMessageRoomData>(CREATE_POST_MESSAGE_ROOM, {
    variables: { postId },
    onCompleted: (data) => {
      const room = data?.createPostMessageRoom
      if (room?._id) {
        setRoomId(room._id)
      }
    },
  })

  // Create or retrieve room on mount (server returns existing room if one exists)
  useEffect(() => {
    createRoom()
  }, [createRoom])

  const { data: messagesData, loading } = useQuery<RoomMessagesData>(
    GET_ROOM_MESSAGES,
    {
      variables: { messageRoomId: roomId },
      skip: !roomId,
      pollInterval: roomId ? 3000 : 0,
      fetchPolicy: 'cache-and-network',
    }
  )

  const rawMessages = messagesData?.messages || []

  // Map raw messages to PostChatMessageData, falling back to userName when user is absent
  const messages: PostChatMessageData[] = rawMessages.map((msg) => ({
    _id: msg._id,
    userId: msg.userId,
    text: msg.text || '',
    created: msg.created,
    user: {
      name: msg.user?.name || msg.userName || 'Unknown',
      username: msg.user?.username || msg.userName || 'unknown',
      avatar: msg.user?.avatar,
    },
  }))

  if (!roomId) {
    return (
      <div className="bg-card rounded-xl p-4 text-center text-muted-foreground">
        Loading discussion...
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl p-4 space-y-4">
      <div className="max-h-96 overflow-y-auto space-y-2">
        {loading && messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm">Loading messages...</p>
        )}
        {messages.length === 0 && !loading && (
          <p className="text-center text-muted-foreground text-sm">No messages yet. Start the discussion!</p>
        )}
        {messages.map((msg) => (
          <PostChatMessage key={msg._id} message={msg} />
        ))}
      </div>
      <PostChatSend messageRoomId={roomId} title={postTitle ?? undefined} postId={postId} />
    </div>
  )
}
