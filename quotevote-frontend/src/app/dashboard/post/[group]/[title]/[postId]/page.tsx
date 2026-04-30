'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useSubscription } from '@apollo/client/react'
import { WifiOff } from 'lucide-react'
import PostController from '@/components/Post/PostController'
import PostActionList from '@/components/PostActions/PostActionList'
import PostChatSend from '@/components/PostChat/PostChatSend'
import SwipeDrawer from '@/components/SwipeDrawer/SwipeDrawer'
import { useIsMobile, useIsLandscapeMobile } from '@/hooks/useMediaQuery'
import { MessagesSquare } from 'lucide-react'
import { GET_POST, GET_ROOM_MESSAGES } from '@/graphql/queries'
import { toAppPostUrl } from '@/lib/utils/sanitizeUrl'
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { PostQueryData } from '@/types/post'
import type { PostAction, VoteAction, CommentAction, QuoteAction, MessageAction } from '@/types/postActions'

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

  return <PostLayout postId={postId} />
}

function PostLayout({ postId }: { postId: string }) {
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscapeMobile()

  if (isMobile && !isLandscape) {
    return (
      <div className="h-[100dvh] overflow-hidden relative">
        <div className="h-full overflow-y-auto pb-16">
          <PostController postId={postId} />
        </div>
        <SwipeDrawer title="Open Discussion">
          <InteractionSection postId={postId} />
        </SwipeDrawer>
      </div>
    )
  }

  const containerHeight = isLandscape ? 'h-[calc(100vh-80px)]' : 'h-[85vh]'
  return (
    <div className={`flex ${containerHeight} overflow-hidden`}>
      {/* Left: Post content */}
      <div data-post-detail-pane="content" className="flex-1 overflow-y-auto border-r border-border">
        <PostController postId={postId} />
      </div>
      {/* Right: Unified discussion feed */}
      <div data-post-detail-pane="discussion" className="w-[50%] flex flex-col overflow-hidden">
        <InteractionSection postId={postId} />
      </div>
    </div>
  )
}

function InteractionSection({ postId }: { postId: string }) {
  const [wsDisconnected, setWsDisconnected] = useState(false)

  const { loading: postLoading, data: postData, refetch: refetchPost } = useQuery<PostQueryData>(
    GET_POST,
    { variables: { postId }, fetchPolicy: 'cache-first' }
  )

  const post = postData?.post
  const messageRoomId = post?.messageRoom?._id
  const postTitle = post?.title
  const postUrl = post?.url ? toAppPostUrl(post.url) : undefined

  const { data: messagesData, refetch: refetchMessages } = useQuery<RoomMessagesData>(
    GET_ROOM_MESSAGES,
    {
      variables: { messageRoomId },
      skip: !messageRoomId,
      fetchPolicy: 'cache-and-network',
    }
  )

  useSubscription(NEW_MESSAGE_SUBSCRIPTION, {
    variables: { messageRoomId },
    skip: !messageRoomId,
    onData: () => {
      if (wsDisconnected) setWsDisconnected(false)
      refetchMessages()
    },
    onError: () => setWsDisconnected(true),
  })

  useEffect(() => {
    if (!wsDisconnected || !messageRoomId) return
    const interval = setInterval(() => {
      refetchMessages()
        .then(() => { setWsDisconnected(false); clearInterval(interval) })
        .catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [wsDisconnected, messageRoomId, refetchMessages])

  const postActions = useMemo<PostAction[]>(() => {
    const actions: PostAction[] = []
    const comments = post?.comments || []
    const votes = post?.votes || []
    const quotes = post?.quotes || []
    const messages = messagesData?.messages || []

    for (const c of comments) {
      actions.push({
        ...c,
        __typename: 'Comment',
        content: c.content || '',
        created: c.created,
        user: {
          _id: c.user?._id || '',
          username: c.user?.username || '',
          name: c.user?.name ?? null,
          avatar: c.user?.avatar ?? null,
        },
        commentQuote:
          c.endWordIndex != null && c.startWordIndex != null && c.endWordIndex > c.startWordIndex
            ? post?.text?.substring(c.startWordIndex, c.endWordIndex)?.replace(/(\r\n|\n|\r)/gm, '') ?? null
            : null,
      } as CommentAction)
    }

    for (const v of votes) {
      actions.push({
        ...v,
        __typename: 'Vote',
        created: v.created ?? new Date().toISOString(),
        user: {
          _id: v.user?._id || '',
          username: v.user?.username || '',
          name: v.user?.name ?? null,
          avatar: v.user?.avatar ?? null,
        },
      } as VoteAction)
    }

    for (const q of quotes) {
      actions.push({
        ...q,
        __typename: 'Quote',
        created: q.created ?? new Date().toISOString(),
        user: {
          _id: q.user?._id || '',
          username: q.user?.username || '',
          name: q.user?.name ?? null,
          avatar: q.user?.avatar ?? null,
        },
      } as QuoteAction)
    }

    for (const msg of messages) {
      actions.push({
        _id: msg._id,
        __typename: 'Message',
        text: msg.text || '',
        created: msg.created,
        userId: msg.userId,
        content: msg.text || '',
        user: {
          _id: msg.user?._id || '',
          username: msg.user?.username || msg.userName || '',
          name: msg.user?.name ?? msg.userName ?? null,
          avatar: msg.user?.avatar ?? null,
        },
      } as MessageAction)
    }

    return actions
  }, [post, messagesData])

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div data-discussion-header className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-background shrink-0">
        <MessagesSquare className="size-4 text-muted-foreground/50" />
        <span className="text-sm font-semibold text-foreground/75">Open Discussion</span>
        {postActions.length > 0 && (
          <span className="ml-auto text-[11px] text-muted-foreground/50 bg-muted/50 px-2 py-0.5 rounded-full tabular-nums">
            {postActions.length}
          </span>
        )}
      </div>

      {wsDisconnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-xs">
          <WifiOff className="size-3.5 flex-shrink-0" />
          <span>Live updates paused. Reconnecting...</span>
        </div>
      )}
      <div data-discussion-scroll="true" className="flex-1 overflow-y-auto">
        <PostActionList
          postActions={postActions}
          loading={postLoading}
          postUrl={postUrl ?? undefined}
          refetchPost={() => refetchPost()}
          postOwnerId={post?.userId}
        />
      </div>
      {messageRoomId && (
        <div className="border-t border-border px-4 py-3 bg-background shrink-0">
          <PostChatSend messageRoomId={messageRoomId} title={postTitle ?? undefined} postId={postId} />
        </div>
      )}
    </div>
  )
}
