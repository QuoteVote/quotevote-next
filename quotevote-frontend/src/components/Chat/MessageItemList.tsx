import { useEffect, useRef } from 'react'
import { useQuery, useSubscription, useMutation } from '@apollo/client/react'
import ScrollableFeed from 'react-scrollable-feed'

import MessageItem from './MessageItem'
import QuoteHeaderMessage from './QuoteHeaderMessage'
import { LoadingSpinner } from '../LoadingSpinner'
import { GET_ROOM_MESSAGES, GET_POST } from '@/graphql/queries'
import { READ_MESSAGES } from '@/graphql/mutations'
import { NEW_MESSAGE_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { ChatRoom, ChatMessage, ChatParticipant } from '@/types/chat'
import type { PostQueryData } from '@/types/post'
import type { MessageSubscriptionResult } from '@/types/hooks'

interface MessageItemListProps {
  room: ChatRoom | null
}

export default function MessageItemList({ room }: MessageItemListProps) {
  const messageRoomId = room?._id ?? null
  const messageType = room?.messageType
  const postDetails = room?.postDetails ?? null
  const postId = postDetails?._id ?? null

  const {
    loading,
    error,
    data,
    refetch,
  } = useQuery<{ messages: ChatMessage[] }>(GET_ROOM_MESSAGES, {
    variables: { messageRoomId },
    skip: !messageRoomId,
    pollInterval: messageRoomId ? 3000 : 0,
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

  // Mark messages as read when this room is open (matching monorepo behaviour)
  const [markRead] = useMutation(READ_MESSAGES)
  const markReadRef = useRef(markRead)
  const currentRoomRef = useRef<string | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMarkingRef = useRef(false)

  useEffect(() => {
    markReadRef.current = markRead
  }, [markRead])

  useEffect(() => {
    // Clear timers whenever messageRoomId changes or is removed
    const clearTimers = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      intervalRef.current = null
      timeoutRef.current = null
    }

    // Skip staged rooms (empty string _id) and missing IDs
    if (!messageRoomId) {
      clearTimers()
      currentRoomRef.current = null
      return
    }

    // Room changed — reset everything
    if (currentRoomRef.current !== messageRoomId) {
      clearTimers()
      isMarkingRef.current = false
    }
    currentRoomRef.current = messageRoomId

    const doMark = async () => {
      if (isMarkingRef.current) return
      if (currentRoomRef.current !== messageRoomId) return
      isMarkingRef.current = true
      try {
        await markReadRef.current({ variables: { messageRoomId } })
      } catch {
        // silent — not critical if mark-as-read fails
      } finally {
        if (currentRoomRef.current === messageRoomId) isMarkingRef.current = false
      }
    }

    // Initial mark after 800ms, then every 5s to pick up new incoming messages
    timeoutRef.current = setTimeout(doMark, 800)
    intervalRef.current = setInterval(doMark, 5000)

    return clearTimers
  }, [messageRoomId])

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

  const messageData: ChatMessage[] = (!loading && data?.messages) || []
  const post = postData?.post
  const postCreator = post?.creator

  const chatParticipantCreator: ChatParticipant | null | undefined = postCreator
    ? {
        id: postCreator._id,
        username: postCreator.username || '',
        name: postCreator.name || undefined,
        avatar: typeof postCreator.avatar === 'string' ? postCreator.avatar : undefined,
        contributorBadge: postCreator.contributorBadge || undefined,
      }
    : null

  const quoteData = post || postDetails
  const showQuoteHeader = messageType === 'POST' && !!quoteData

  return (
    <div className="relative h-full w-full bg-transparent">
      <ScrollableFeed>
        <div className="flex flex-col gap-1 py-1">
          {loading && <LoadingSpinner size={50} />}
          {showQuoteHeader && quoteData && (
            <QuoteHeaderMessage postDetails={quoteData} postCreator={chatParticipantCreator} />
          )}
          {messageData.map((message) => (
            <MessageItem key={message._id} message={message} />
          ))}
        </div>
      </ScrollableFeed>
    </div>
  )
}
