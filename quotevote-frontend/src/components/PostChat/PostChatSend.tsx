'use client'

import { useRef, useState } from 'react'
import { useMutation } from '@apollo/client/react'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAppStore } from '@/store'
import { SEND_MESSAGE } from '@/graphql/mutations'
import { GET_ROOM_MESSAGES } from '@/graphql/queries'
import useGuestGuard from '@/hooks/useGuestGuard'
import { cn } from '@/lib/utils'
import type { PostChatSendProps } from '@/types/postChat'

interface MessagesData {
  messages: Array<{
    _id: string
    messageRoomId: string
    userId: string
    userName: string
    title: string
    text: string
    type: string
    created: string
  }>
}

interface CreateMessageData {
  createMessage: {
    __typename?: string
    _id: string
    messageRoomId: string
    userId: string
    userName: string
    title: string
    text: string
    type: string
    created: string
    user: {
      __typename?: string
      _id: string
      name: string
      username: string
      avatar: string
    }
  }
}

export default function PostChatSend({ messageRoomId, title, postId }: PostChatSendProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState('')

  const user = useAppStore((state) => state.user.data)
  const setChatSubmitting = useAppStore((state) => state.setChatSubmitting)
  const ensureAuth = useGuestGuard()

  const type = 'POST'

  const [createMessage] = useMutation<CreateMessageData>(SEND_MESSAGE, {
    onError: () => {
      setChatSubmitting(false)
    },
    onCompleted: () => {
      setChatSubmitting(false)
    },
    refetchQueries: messageRoomId
      ? [
          {
            query: GET_ROOM_MESSAGES,
            variables: { messageRoomId },
          },
        ]
      : [],
  })

  const handleSubmit = async () => {
    if (!ensureAuth()) return
    if (!text.trim()) return

    setChatSubmitting(true)

    const message = {
      title,
      type,
      messageRoomId: messageRoomId || null,
      componentId: postId || null,
      text: text.trim(),
    }

    const dateSubmitted = new Date()

    await createMessage({
      variables: { message },
      optimisticResponse: {
        createMessage: {
          __typename: 'Message' as const,
          _id: dateSubmitted.toISOString(),
          messageRoomId: messageRoomId || '',
          userName: (user.name as string) || '',
          userId: ((user._id || user.id) as string) || '',
          title: title || '',
          text: text.trim(),
          type,
          created: dateSubmitted.toISOString(),
          user: {
            __typename: 'User' as const,
            _id: ((user._id || user.id) as string) || '',
            name: (user.name as string) || '',
            username: (user.username as string) || '',
            avatar: typeof user.avatar === 'string' ? user.avatar : '',
          },
        },
      },
      update: (cache, { data: mutationData }) => {
        if (!messageRoomId || !mutationData?.createMessage) return

        const existingData = cache.readQuery<MessagesData>({
          query: GET_ROOM_MESSAGES,
          variables: { messageRoomId },
        })

        if (existingData) {
          cache.writeQuery({
            query: GET_ROOM_MESSAGES,
            variables: { messageRoomId },
            data: {
              ...existingData,
              messages: [...existingData.messages, mutationData.createMessage],
            },
          })
        }
      },
    })

    setText('')
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-center gap-3 p-2.5 sm:p-3">
      {/* Chat label - hidden on mobile */}
      <span className="hidden text-sm font-semibold text-gray-500 sm:block sm:w-16">Chat</span>

      {/* Input area */}
      <div className="flex flex-1 items-end gap-2">
        <Textarea
          ref={textareaRef}
          placeholder="type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-[45px] max-h-[75px] flex-1 resize-none rounded-md',
            'border border-border bg-muted/50',
            'px-3 py-2 text-sm',
            'placeholder:text-muted-foreground/70',
            'focus:bg-background focus:ring-2 focus:ring-primary/20',
            !text.trim() && 'min-h-[65px]'
          )}
          rows={1}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSubmit}
          className="h-10 w-10 text-primary hover:bg-primary/10"
          aria-label="Send message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
