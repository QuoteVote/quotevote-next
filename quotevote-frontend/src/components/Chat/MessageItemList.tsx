import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useQuery, useSubscription, useMutation } from '@apollo/client/react'
import ScrollableFeed from 'react-scrollable-feed'

import MessageItem from './MessageItem'
import QuoteHeaderMessage from './QuoteHeaderMessage'
import { GET_ROOM_MESSAGES, GET_POST } from '@/graphql/queries'
import { READ_MESSAGES } from '@/graphql/mutations'
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { ChatRoom, ChatMessage, ChatParticipant } from '@/types/chat'
import type { PostQueryData } from '@/types/post'
import type { MessageSubscriptionResult } from '@/types/hooks'
import { useAppStore } from '@/store'
import useSocketConnected from '@/hooks/useSocketConnected'
import useOnTabVisible from '@/hooks/useOnTabVisible'

interface MessageItemListProps {
  room: ChatRoom | null
}

export default function MessageItemList({ room }: MessageItemListProps) {
  const messageRoomId = room?._id ?? null
  const messageType = room?.messageType
  const postDetails = room?.postDetails ?? null
  const postId = postDetails?._id ?? null
  const currentUserId = useAppStore((state) => state.user.data?._id)
  const socketConnected = useSocketConnected()

  const {
    error,
    data,
    refetch,
  } = useQuery<{ messages: ChatMessage[] }>(GET_ROOM_MESSAGES, {
    variables: { messageRoomId },
    skip: !messageRoomId,
    // New messages arrive over the subscription. Poll only while it's down (#625).
    pollInterval: messageRoomId && !socketConnected ? 3000 : 0,
    fetchPolicy: 'cache-and-network',
  })

  const { data: postData } = useQuery<PostQueryData>(GET_POST, {
    variables: { postId },
    skip: !postId || messageType !== 'POST',
  })

  const { data: subscriptionData, error: subscriptionError } = useSubscription<MessageSubscriptionResult>(
    NEW_MESSAGE_SUBSCRIPTION,
    {
      skip: !messageRoomId,
      variables: { messageRoomId: messageRoomId ?? '' },
    }
  )

  useEffect(() => {
    if (subscriptionData?.message) {
      refetch().catch(() => undefined)
    }
  }, [subscriptionData, refetch])

  useEffect(() => {
    if (subscriptionError) {
      refetch().catch(() => undefined)
    }
  }, [subscriptionError, refetch])

  // Catch up once when the socket reconnects, in case a message arrived in between.
  const socketStateRef = useRef<'never' | 'up' | 'down'>('never')
  useEffect(() => {
    if (socketConnected) {
      if (socketStateRef.current === 'down' && messageRoomId) refetch().catch(() => undefined)
      socketStateRef.current = 'up'
    } else if (socketStateRef.current === 'up') {
      socketStateRef.current = 'down'
    }
  }, [socketConnected, messageRoomId, refetch])

  // Mark the room read when it opens, when a message from someone else comes in,
  // and when the tab comes back into view. No fixed interval (#625).
  const [markRead] = useMutation(READ_MESSAGES)
  const markReadRef = useRef(markRead)
  const currentRoomRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMarkingRef = useRef(false)

  useEffect(() => {
    markReadRef.current = markRead
  }, [markRead])

  const latestIncomingId = useMemo(() => {
    const messages = data?.messages ?? []
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].userId !== currentUserId) return messages[i]._id
    }
    return null
  }, [data, currentUserId])

  const doMark = useCallback(async () => {
    const roomId = currentRoomRef.current
    if (!roomId || isMarkingRef.current) return
    // A hidden tab hasn't been read yet; the visibility handler marks it later.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
    isMarkingRef.current = true
    try {
      await markReadRef.current({ variables: { messageRoomId: roomId } })
    } catch {
      // silent — not critical if mark-as-read fails
    } finally {
      isMarkingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = null

    // Skip staged rooms (empty string _id) and missing IDs
    if (!messageRoomId) {
      currentRoomRef.current = null
      return
    }

    if (currentRoomRef.current !== messageRoomId) isMarkingRef.current = false
    currentRoomRef.current = messageRoomId

    // Short delay so opening and the first load collapse into one write
    timeoutRef.current = setTimeout(() => {
      void doMark()
    }, 800)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [messageRoomId, latestIncomingId, doMark])

  useOnTabVisible(() => {
    void doMark()
  }, !!messageRoomId)

  if (!messageRoomId) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-4 text-center text-sm text-muted-foreground">
        Select a conversation to view messages
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-5 py-4 text-center text-sm text-red-500">
        Something went wrong!
      </div>
    )
  }

  // Render straight from `data` (which stays populated from the cache during
  // refetches and the fallback poll). Gating on `loading` would blank the list
  // on every refetch and make the messages blink.
  const messageData: ChatMessage[] = data?.messages || []
  const post = postData?.post
  const postCreator = post?.creator

  const chatParticipantCreator: ChatParticipant | null | undefined = postCreator
    ? {
        id: postCreator._id,
        username: postCreator.username || '',
        name: postCreator.name || undefined,
        avatar: postCreator.avatar as string | Record<string, unknown> | undefined,
        contributorBadge: postCreator.contributorBadge || undefined,
      }
    : null

  const quoteData = post || postDetails
  const showQuoteHeader = messageType === 'POST' && !!quoteData

  return (
    <div className="relative h-full w-full bg-transparent">
      <ScrollableFeed>
        <div className="flex flex-col gap-1 py-1">
          {showQuoteHeader && quoteData && (
            <QuoteHeaderMessage postDetails={quoteData} postCreator={chatParticipantCreator} />
          )}
          {messageData.map((message) => (
            <MessageItem key={message._id} message={message} roomType={messageType} />
          ))}
        </div>
      </ScrollableFeed>
    </div>
  )
}
