'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useSubscription } from '@apollo/client/react'
import { WifiOff } from 'lucide-react'
import PostController from '@/components/Post/PostController'
import PostUnavailable from '@/components/Post/PostUnavailable'
import PostActionList from '@/components/PostActions/PostActionList'
import SelectedPassageSummary from '@/components/PostActions/SelectedPassageSummary'
import PostChatSend from '@/components/PostChat/PostChatSend'
import MobileDiscussionSplit from '@/components/Post/MobileDiscussionSplit'
import DiscussionSplitPane from '@/components/Post/DiscussionSplitPane'
import { useHasMounted, useIsMobile, useIsLandscapeMobile } from '@/hooks/useMediaQuery'
import { GET_POST, GET_ROOM_MESSAGES } from '@/graphql/queries'
import { toAppPostUrl } from '@/lib/utils/sanitizeUrl'
import { toLinkedPassage } from '@/lib/utils/discussionSplit'
import { summarizePassage } from '@/lib/utils/passageSummary'
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions'
import { useAppStore } from '@/store'
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

interface InteractionSectionProps {
  postId: string
  hideHeader?: boolean
  selectedActionId?: string | null
  onActionSelect?: (action: PostAction) => void
  onCountChange?: (count: number) => void
  /** Clears the selected passage and Discussion item. */
  onClearSelection?: () => void
}

export default function PostDetailPage(): React.ReactNode {
  const params = useParams<{ postId: string }>()
  const postId = params?.postId

  if (!postId) {
    return <PostUnavailable />
  }

  return <PostLayout postId={postId} />
}

function PostLayout({ postId }: { postId: string }) {
  const hasMounted = useHasMounted()
  const isMobile = useIsMobile()
  const isLandscape = useIsLandscapeMobile()
  const isPortraitMobile = isMobile && !isLandscape

  const [discussionOpen, setDiscussionOpen] = useState(false)
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null)
  const [discussionCount, setDiscussionCount] = useState(0)

  const setMobileDiscussionOpen = useAppStore((s) => s.setMobileDiscussionOpen)
  const setLinkedPassage = useAppStore((s) => s.setLinkedPassage)

  // Same query as PostController and the discussion pane, so this shares their request.
  const { data: postData, loading: postLoading } = useQuery<PostQueryData>(GET_POST, {
    variables: { postId },
    fetchPolicy: 'cache-first',
  })
  const postMissing = !postLoading && !!postData && !postData.post
  const setFocusedComment = useAppStore((s) => s.setFocusedComment)

  useEffect(() => {
    setMobileDiscussionOpen(discussionOpen && isPortraitMobile)
    return () => setMobileDiscussionOpen(false)
  }, [discussionOpen, isPortraitMobile, setMobileDiscussionOpen])

  useEffect(() => {
    return () => {
      setLinkedPassage(null)
      setFocusedComment(null)
    }
  }, [setLinkedPassage, setFocusedComment])

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setDiscussionOpen(open)
      setMobileDiscussionOpen(open && isPortraitMobile)
    },
    [isPortraitMobile, setMobileDiscussionOpen],
  )

  const handleActionSelect = useCallback(
    (action: PostAction) => {
      if (selectedActionId === action._id) {
        setSelectedActionId(null)
        setFocusedComment(null)
        setLinkedPassage(null)
        return
      }
      setSelectedActionId(action._id)
      setFocusedComment(action._id)
      const passage = toLinkedPassage(action)
      if (passage) {
        setLinkedPassage(passage)
        if (isPortraitMobile) {
          setDiscussionOpen(true)
          setMobileDiscussionOpen(true)
        }
      }
    },
    [
      selectedActionId,
      isPortraitMobile,
      setFocusedComment,
      setLinkedPassage,
      setMobileDiscussionOpen,
    ],
  )

  const handleClearSelection = useCallback(() => {
    setSelectedActionId(null)
    setFocusedComment(null)
    setLinkedPassage(null)
  }, [setFocusedComment, setLinkedPassage])

  const handleActivateLinkedComment = useCallback(
    (actionId: string) => {
      if (selectedActionId === actionId && discussionOpen) {
        setSelectedActionId(null)
        setFocusedComment(null)
        setLinkedPassage(null)
        return
      }
      setSelectedActionId(actionId)
      setFocusedComment(actionId)
      handleOpenChange(true)
    },
    [discussionOpen, handleOpenChange, selectedActionId, setFocusedComment, setLinkedPassage],
  )

  const quotePane = (
    <PostController
      postId={postId}
      onOpenDiscussion={() => handleOpenChange(true)}
      onActivateLinkedComment={handleActivateLinkedComment}
    />
  )

  const discussion = (
    <InteractionSection
      postId={postId}
      hideHeader={isPortraitMobile}
      selectedActionId={selectedActionId}
      onActionSelect={handleActionSelect}
      onCountChange={setDiscussionCount}
      onClearSelection={handleClearSelection}
    />
  )

  // A deleted or missing post gets one explanatory state, not an empty discussion beside it.
  if (postMissing) {
    return <PostUnavailable />
  }

  // SSR and hydration share this shell so matchMedia cannot swap the tree.
  // After mount, pick portrait-mobile split vs desktop/landscape columns.
  if (!hasMounted) {
    return <div className="h-full overflow-hidden relative">{quotePane}</div>
  }

  if (isPortraitMobile) {
    return (
      <div className="h-full overflow-hidden relative">
        <MobileDiscussionSplit
          open={discussionOpen}
          onOpenChange={handleOpenChange}
          discussionCount={discussionCount}
          quotePane={quotePane}
        >
          {discussion}
        </MobileDiscussionSplit>
      </div>
    )
  }

  // Desktop, tablet and landscape phones: side by side with a draggable divider (#516).
  // The split fills the screen under the top bar (landscape phones included).
  const containerHeight = 'h-[calc(100dvh-var(--app-header-h))]'
  return (
    <DiscussionSplitPane className={containerHeight} contentPane={quotePane}>
      {discussion}
    </DiscussionSplitPane>
  )
}

function InteractionSection({
  postId,
  hideHeader = false,
  selectedActionId = null,
  onActionSelect,
  onCountChange,
  onClearSelection,
}: InteractionSectionProps) {
  const [wsDisconnected, setWsDisconnected] = useState(false)
  const linkedPassage = useAppStore((s) => s.ui.linkedPassage)

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
        startWordIndex: c.startWordIndex,
        endWordIndex: c.endWordIndex,
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

  useEffect(() => {
    onCountChange?.(postActions.length)
  }, [postActions.length, onCountChange])

  const passageSummary = useMemo(
    () => summarizePassage(post?.text, linkedPassage, postActions),
    [post?.text, linkedPassage, postActions]
  )

  return (
    <div className="flex flex-col h-full">
      {!hideHeader || passageSummary ? (
        <div className="font-redesign flex shrink-0 flex-col gap-3 px-4 pt-4 pb-2 lg:px-6 lg:pt-[22px]">
          {!hideHeader && (
            <h2
              data-discussion-title
              className="text-[22px]! leading-tight! font-extrabold! tracking-[-0.02em]! text-[var(--shell-ink)]"
            >
              Discussion{' '}
              <span className="font-semibold text-[var(--shell-muted)]">· {postActions.length}</span>
            </h2>
          )}
          {passageSummary && onClearSelection ? (
            <SelectedPassageSummary summary={passageSummary} onClear={onClearSelection} />
          ) : null}
        </div>
      ) : null}

      {wsDisconnected && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400 text-xs">
          <WifiOff className="size-3.5 shrink-0" />
          <span>Live updates paused. Reconnecting...</span>
        </div>
      )}
      <div data-discussion-scroll="true" className="flex-1 overflow-y-auto overscroll-contain bg-background">
        <PostActionList
          postActions={postActions}
          loading={postLoading}
          postUrl={postUrl ?? undefined}
          refetchPost={() => refetchPost()}
          postOwnerId={post?.userId}
          selectedActionId={selectedActionId}
          onSelectAction={onActionSelect}
        />
      </div>
      {messageRoomId && (
        <div className="border-t border-border px-4 py-3 bg-card shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <PostChatSend
            messageRoomId={messageRoomId}
            title={postTitle ?? undefined}
            postId={postId}
            postUrl={post?.url ?? undefined}
            postOwnerId={post?.userId ?? undefined}
          />
        </div>
      )}
    </div>
  )
}
