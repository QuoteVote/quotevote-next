'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useSubscription } from '@apollo/client/react'
import { MessageCircle, MessagesSquare } from 'lucide-react'
import PostController from '@/components/Post/PostController'
import { LatestQuotes } from '@/components/Quotes/LatestQuotes'
import CommentList from '@/components/Comment/CommentList'
import CommentInput from '@/components/Comment/CommentInput'
import PostChatMessage from '@/components/PostChat/PostChatMessage'
import PostChatSend from '@/components/PostChat/PostChatSend'
import { GET_POST, GET_ROOM_MESSAGES } from '@/graphql/queries'
import { CREATE_POST_MESSAGE_ROOM } from '@/graphql/mutations'
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PostQueryData } from '@/types/post'
import type { CommentData } from '@/types/comment'
import type { PostChatMessageData } from '@/types/postChat'

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
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Post content */}
      <div className="border-b border-border">
        <PostController postId={postId} />
      </div>

      {/* Tabs: Comments + Discussion */}
      <PostTabs postId={postId} />

      {/* Sidebar quotes on wider screens */}
      <div className="hidden xl:block fixed right-8 top-24 w-72">
        <LatestQuotes limit={5} />
      </div>
    </div>
  )
}

function PostTabs({ postId }: { postId: string }) {
  return (
    <Tabs defaultValue="comments" className="w-full">
      <TabsList
        variant="line"
        className="w-full justify-start bg-transparent p-0 rounded-none border-b border-border h-auto"
      >
        <TabsTrigger
          value="comments"
          className="flex-1 gap-1.5 py-3 rounded-none bg-transparent text-sm font-medium text-muted-foreground
            data-[state=active]:text-foreground data-[state=active]:shadow-none
            data-[state=active]:border-b-2 data-[state=active]:border-primary
            hover:bg-muted/30 transition-colors"
        >
          <MessageCircle className="size-4" />
          Comments
        </TabsTrigger>
        <TabsTrigger
          value="discussion"
          className="flex-1 gap-1.5 py-3 rounded-none bg-transparent text-sm font-medium text-muted-foreground
            data-[state=active]:text-foreground data-[state=active]:shadow-none
            data-[state=active]:border-b-2 data-[state=active]:border-primary
            hover:bg-muted/30 transition-colors"
        >
          <MessagesSquare className="size-4" />
          Discussion
        </TabsTrigger>
      </TabsList>
      <TabsContent value="comments" className="mt-0">
        <CommentsSection postId={postId} />
      </TabsContent>
      <TabsContent value="discussion" className="mt-0">
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
    startWordIndex: c.startWordIndex,
    endWordIndex: c.endWordIndex,
    postId: c.postId,
    url: c.url,
    reaction: c.reaction,
  }))

  return (
    <div className="divide-y divide-border">
      {/* Comment input — sticky */}
      <div className="p-4 bg-background">
        <CommentInput actionId={postId} />
      </div>
      {/* Comments list */}
      <div className="p-4">
        <CommentList
          comments={comments}
          loading={loading}
          postUrl={post?.url ?? undefined}
        />
      </div>
    </div>
  )
}

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

  useEffect(() => {
    createRoom()
  }, [createRoom])

  const { data: messagesData, loading, refetch } = useQuery<RoomMessagesData>(
    GET_ROOM_MESSAGES,
    {
      variables: { messageRoomId: roomId },
      skip: !roomId,
      fetchPolicy: 'cache-and-network',
    }
  )

  // Subscribe to new messages for real-time updates
  useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { messageRoomId: roomId },
    skip: !roomId,
    onData: () => {
      // Refetch messages when a new message arrives via subscription
      refetch()
    },
  })

  const rawMessages = messagesData?.messages || []

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
      <div className="flex items-center justify-center py-16">
        <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-muted-foreground">Loading discussion...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MessagesSquare className="size-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">No messages yet. Start the discussion!</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg._id} className="px-4 py-3">
            <PostChatMessage message={msg} />
          </div>
        ))}
      </div>
      <div className="border-t border-border p-4 bg-background">
        <PostChatSend messageRoomId={roomId} title={postTitle ?? undefined} postId={postId} />
      </div>
    </div>
  )
}
