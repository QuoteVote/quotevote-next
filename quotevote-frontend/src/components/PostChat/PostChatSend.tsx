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
import type { PostChatSendProps, MessagesData, CreateMessageData } from '@/types/postChat'

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
    const tempId = Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')

    await createMessage({
      variables: { message },
      optimisticResponse: {
        createMessage: {
          __typename: 'Message' as const,
          _id: tempId,
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
    <div data-post-chat-send="true" className="flex items-end gap-2">
      <Textarea
        ref={textareaRef}
        placeholder="Add to the discussion..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          'min-h-[40px] max-h-[120px] flex-1 resize-none rounded-xl',
          'border border-border bg-muted/50',
          'px-3 py-2.5 text-sm',
          'placeholder:text-muted-foreground/50',
          'focus:bg-background focus:ring-2 focus:ring-primary/20',
        )}
        rows={1}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="h-10 w-10 shrink-0 text-primary hover:bg-primary/10 disabled:opacity-30"
        aria-label="Send message"
      >
        <Send className="h-4.5 w-4.5" />
      </Button>
    </div>
  )
}
