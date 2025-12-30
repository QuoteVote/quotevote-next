'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@apollo/client/react'
import { Trash2 } from 'lucide-react'

import Avatar from '@/components/Avatar'
import PostChatReactions from './PostChatReactions'
import { useAppStore } from '@/store'
import { GET_MESSAGE_REACTIONS } from '@/graphql/queries'
import { DELETE_MESSAGE } from '@/graphql/mutations'
import { cn } from '@/lib/utils'
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
  const setSnackbar = useAppStore((state) => state.setSnackbar)

  const userId = user._id || user.id
  const isDefaultDirection = message.userId !== userId
  const isOwner = userId === message.userId || user.admin

  const { loading, data } = useQuery<MessageReactionsData>(GET_MESSAGE_REACTIONS, {
    variables: { messageId: message._id },
  })

  const messageReactions = (!loading && data?.messageReactions) || []

  const [deleteMessage] = useMutation<DeleteMessageData>(DELETE_MESSAGE, {
    update(cache, { data: mutationData }) {
      if (!mutationData?.deleteMessage) return
      cache.modify({
        fields: {
          messages(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter(
              (messageRef) => readField('_id', messageRef) !== mutationData.deleteMessage._id
            )
          },
        },
      })
    },
  })

  const handleDelete = async () => {
    try {
      await deleteMessage({ variables: { messageId: message._id } })
      setSnackbar({
        open: true,
        message: 'Message deleted successfully',
        type: 'success',
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setSnackbar({
        open: true,
        message: `Delete Error: ${errorMessage}`,
        type: 'danger',
      })
    }
  }

  const handleRedirectToProfile = () => {
    router.push(`/Profile/${username}`)
  }

  const senderName = name || username || 'Unknown'
  const avatarSrc = typeof message.user.avatar === 'string' ? message.user.avatar : undefined

  return (
    <div
      className={cn(
        'mb-3 flex w-full items-start gap-3 px-2',
        isDefaultDirection ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <Avatar
          src={avatarSrc}
          alt={senderName}
          size={50}
          fallback={senderName[0]?.toUpperCase() || '?'}
          onClick={handleRedirectToProfile}
          className="cursor-pointer"
        />
      </div>

      {/* Message Bubble */}
      <div className="group relative max-w-[75%] min-w-[120px]">
        <div
          className={cn(
            'relative rounded-md px-3.5 py-3.5 pb-1 text-base leading-relaxed shadow-sm',
            // Speech bubble arrow
            "before:absolute before:top-0 before:border-10 before:border-transparent before:content-['']",
            isDefaultDirection
              ? 'bg-white text-gray-700 before:-left-2.5 before:border-t-white'
              : 'bg-emerald-500 text-white before:-right-2.5 before:border-t-emerald-500'
          )}
        >
          <p className="whitespace-pre-wrap wrap-break-word tracking-wide">{message.text}</p>
          <PostChatReactions
            created={message.created}
            messageId={message._id}
            reactions={messageReactions}
            isDefaultDirection={isDefaultDirection}
            userName={name}
            username={username}
          />
        </div>

        {/* Delete Button */}
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            className={cn(
              'absolute -top-2 z-10 flex h-7 w-7 items-center justify-center',
              'rounded-full bg-white shadow-md',
              'text-red-500 opacity-0 transition-opacity group-hover:opacity-100',
              'hover:bg-red-50 hover:text-red-600',
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
