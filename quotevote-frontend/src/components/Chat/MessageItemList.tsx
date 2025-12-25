import { useEffect } from 'react'
import { useQuery, useSubscription } from '@apollo/client/react'
import ScrollableFeed from 'react-scrollable-feed'

import MessageItem from './MessageItem'
import QuoteHeaderMessage from './QuoteHeaderMessage'
import { LoadingSpinner } from '../LoadingSpinner'
import { GET_ROOM_MESSAGES, GET_POST } from '@/graphql/queries'
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
    // Poll every 3 seconds to keep read-related data reasonably fresh
    pollInterval: messageRoomId ? 3000 : 0,
    fetchPolicy: 'cache-and-network',
  })

  // Fetch full post with creator info if this is a POST type room
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

  // Handle subscription data updates (Apollo Client v4 API)
  useEffect(() => {
    if (subscriptionData?.message) {
      // Refetch messages to get the latest list
      refetch().catch((refetchErr) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Message Subscription] Refetch error:', refetchErr)
        }
      })
    }
  }, [subscriptionData, refetch])

  // Handle subscription errors
  useEffect(() => {
    if (subscriptionError) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Message Subscription] Subscription error:', subscriptionError)
      }
      // Try to refetch on error to ensure we have the latest messages
      refetch().catch((refetchErr) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[Message Subscription] Refetch error:', refetchErr)
        }
      })
    }
  }, [subscriptionError, refetch])

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

  // Convert PostCreator to ChatParticipant format
  const chatParticipantCreator: ChatParticipant | null | undefined = postCreator
    ? {
        id: postCreator._id,
        username: postCreator.username || '',
        name: postCreator.name || undefined,
        avatar: postCreator.avatar || undefined,
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
