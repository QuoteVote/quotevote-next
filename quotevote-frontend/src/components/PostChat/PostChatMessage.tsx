'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import { Trash2 } from 'lucide-react'

import { DisplayAvatar } from '@/components/DisplayAvatar'
import PostChatReactions from './PostChatReactions'
import { useAppStore } from '@/store'
import { toast } from 'sonner'
import { GET_MESSAGE_REACTIONS } from '@/graphql/queries'
import { DELETE_MESSAGE } from '@/graphql/mutations'
import { cn } from '@/lib/utils'
import useGuestGuard from '@/hooks/useGuestGuard'
import type { PostChatMessageProps, MessageReaction } from '@/types/postChat'

interface MessageReactionsData {
  messageReactions: MessageReaction[]
}

interface DeleteMessageData {
  deleteMessage: {
    _id: string
  }
}

export default function PostChatMessage({ message }: PostChatMessageProps) {
  const { username, name } = message.user
  const router = useRouter()

  const user = useAppStore((state) => state.user.data)
  const ensureAuth = useGuestGuard()

  const userId = user._id || user.id
  const isDefaultDirection = message.userId !== userId
  const isDeleted = message.deleted === true
  // Only the author can delete their own message (#576), and a deleted one stays as a note.
  const canDelete = userId === message.userId && !isDeleted

  const { loading, data } = useQuery<MessageReactionsData>(GET_MESSAGE_REACTIONS, {
    variables: { messageId: message._id },
    skip: isDeleted,
  })

  const messageReactions = (!loading && data?.messageReactions) || []

  // Refetch rather than drop the message: the chat shows a note in its place.
  const [deleteMessage] = useMutation<DeleteMessageData>(DELETE_MESSAGE, {
    refetchQueries: ['getRoomMessages'],
  })

  const handleDelete = async () => {
    if (!ensureAuth()) return
    try {
      await deleteMessage({ variables: { messageId: message._id } })
      toast.success('Message deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      toast.error(`Delete Error: ${errorMessage}`)
    }
  }

  const handleRedirectToProfile = () => {
    router.push(`/profile/${username}`)
  }

  return (
    <div
      data-testid="discussion-message"
      data-post-chat-message="true"
      data-current-user={!isDefaultDirection ? 'true' : undefined}
      className={cn(
        'mb-3 flex w-full items-start gap-3 px-2',
        isDefaultDirection ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div className="shrink-0 cursor-pointer" onClick={handleRedirectToProfile}>
        <DisplayAvatar
          avatar={message.user.avatar}
          username={username}
          size={50}
        />
      </div>

      {/* Message Bubble */}
      <div className="group relative max-w-[75%] min-w-[120px]">
        <div
          data-post-chat-bubble="true"
          data-bubble-direction={isDefaultDirection ? 'incoming' : 'outgoing'}
          className={cn(
            'relative rounded-md px-3.5 py-3 text-sm leading-relaxed shadow-sm',
            // Speech bubble arrow
            "before:absolute before:top-0 before:border-10 before:border-transparent before:content-['']",
            isDefaultDirection
              ? 'bg-card text-card-foreground before:-left-2.5 before:border-t-card'
              : 'bg-emerald-500 text-white before:-right-2.5 before:border-t-emerald-500'
          )}
        >
          <p
            className={cn(
              'whitespace-pre-wrap wrap-break-word tracking-wide',
              isDeleted && 'italic'
            )}
          >
            {message.text}
          </p>
          {!isDeleted && (
            <PostChatReactions
              created={message.created}
              messageId={message._id}
              reactions={messageReactions}
              isDefaultDirection={isDefaultDirection}
              userName={name}
              username={username}
            />
          )}
        </div>

        {/* Delete Button */}
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              'absolute -top-2 z-10 flex h-7 w-7 items-center justify-center',
              'rounded-full bg-white shadow-md',
              'text-red-600 opacity-0 transition-opacity group-hover:opacity-100',
              'group-focus-within:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2',
              'hover:bg-red-50 hover:text-red-700',
              isDefaultDirection ? '-right-2' : '-left-2'
            )}
            aria-label="Delete message"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
