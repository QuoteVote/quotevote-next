'use client'

import { useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { Smile, Loader2 } from 'lucide-react'

const EmojiPicker = lazy(() =>
  Promise.all([
    import('@emoji-mart/data'),
    import('@emoji-mart/react'),
  ]).then(([dataModule, pickerModule]) => ({
    default: (props: { onEmojiSelect: (emoji: { native: string }) => void; theme?: string; previewPosition?: string; skinTonePosition?: string }) => {
      const Picker = pickerModule.default
      return <Picker data={dataModule.default} {...props} />
    },
  }))
)
import _ from 'lodash'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAppStore } from '@/store'
import { ADD_MESSAGE_REACTION, UPDATE_MESSAGE_REACTION } from '@/graphql/mutations'
import { GET_MESSAGE_REACTIONS } from '@/graphql/queries'
import { parseCommentDate } from '@/lib/utils/momentUtils'
import useGuestGuard from '@/hooks/useGuestGuard'
import { cn } from '@/lib/utils'
import type { PostChatReactionsProps, MessageReaction } from '@/types/postChat'

interface EmojiSelectData {
  native: string
}

export default function PostChatReactions({
  created,
  messageId,
  reactions = [],
  isDefaultDirection,
  userName,
  username,
}: PostChatReactionsProps) {
  const userId = useAppStore((state) => state.user.data._id || state.user.data.id) as string
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const parsedTime = parseCommentDate(new Date(created))
  const ensureAuth = useGuestGuard()

  const [addReaction] = useMutation(ADD_MESSAGE_REACTION, {
    onError: (err: unknown) => {
      console.error(err)
    },
    refetchQueries: [
      {
        query: GET_MESSAGE_REACTIONS,
        variables: { messageId },
      },
    ],
  })

  const [updateReaction] = useMutation(UPDATE_MESSAGE_REACTION, {
    onError: (err: unknown) => {
      console.error(err)
    },
    refetchQueries: [
      {
        query: GET_MESSAGE_REACTIONS,
        variables: { messageId },
      },
    ],
  })

  const userReaction = _.find(reactions, { userId }) as MessageReaction | undefined
  const groupedReactions = _.groupBy(reactions, 'emoji')

  const handleEmojiSelect = async (emoji: EmojiSelectData) => {
    if (!ensureAuth()) return
    const newEmoji = emoji.native
    const reaction = {
      userId,
      messageId,
      emoji: newEmoji,
    }

    if (userReaction) {
      await updateReaction({
        variables: { _id: userReaction._id, emoji: reaction.emoji },
      })
    } else {
      await addReaction({
        variables: { reaction },
      })
    }

    setOpen(false)
  }

  const handleRedirectToProfile = () => {
    router.push(`/dashboard/profile/${username}`)
  }

  return (
    <div className="mt-2 flex items-center justify-between">
      {/* User name and time */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleRedirectToProfile}
          className={cn(
            'text-base font-normal hover:underline',
            isDefaultDirection ? 'text-gray-500' : 'text-white'
          )}
        >
          {userName}
        </button>
        <span
          className={cn(
            'text-sm',
            isDefaultDirection ? 'text-gray-500' : 'text-white/80'
          )}
          suppressHydrationWarning
        >
          {parsedTime}
        </span>
      </div>

      {/* Reactions */}
      <div className="flex items-center gap-1">
        {/* Emoji reaction bubbles */}
        <div className="flex gap-1">
          {Object.keys(groupedReactions).map((emoji) => (
            <div
              key={emoji}
              className={cn(
                'flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-sm',
                isDefaultDirection ? 'bg-gray-100' : 'bg-emerald-400'
              )}
            >
              <span>{emoji}</span>
              <span className={isDefaultDirection ? 'text-gray-600' : 'text-white'}>
                {groupedReactions[emoji].length}
              </span>
            </div>
          ))}
        </div>

        {/* Emoji picker */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                isDefaultDirection
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'text-white hover:text-white/80'
              )}
              onClick={(e) => {
                if (!ensureAuth()) {
                  e.preventDefault()
                }
              }}
            >
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto border-none p-0" align="end">
            <Suspense fallback={<div className="flex items-center justify-center p-8"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>}>
              <EmojiPicker
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
              />
            </Suspense>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
