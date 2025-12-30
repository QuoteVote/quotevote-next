"use client"

import { useState, useCallback } from 'react'

import { Smile } from 'lucide-react'
import { useMutation } from '@apollo/client/react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import _ from 'lodash'
import { ADD_ACTION_REACTION, UPDATE_ACTION_REACTION } from '@/graphql/mutations'
import { GET_ACTION_REACTIONS } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Reaction } from '@/types/comment'
import useGuestGuard from '@/hooks/useGuestGuard'

interface CommentReactionsProps {
  actionId: string
  reactions: Reaction[]
}

export default function CommentReactions({ actionId, reactions }: CommentReactionsProps) {
  const userId = useAppStore((state) => state.user.data.id || state.user.data._id) as string
  const [open, setOpen] = useState(false)
  const ensureAuth = useGuestGuard()

  const [addReaction] = useMutation(ADD_ACTION_REACTION, {
    onError: (err: unknown) => {
      console.error(err)
    },
    refetchQueries: [{
      query: GET_ACTION_REACTIONS,
      variables: {
        actionId,
      },
    }],
  })

  const [updateReaction] = useMutation(UPDATE_ACTION_REACTION, {
    onError: (err: unknown) => {
      console.error(err)
    },
    refetchQueries: [{
      query: GET_ACTION_REACTIONS,
      variables: {
        actionId,
      },
    }],
  })

  const groupedReactions = _.groupBy(reactions, 'emoji')
  const userReaction = _.find(reactions, { userId }) || null

  const handleEmojiSelect = useCallback(async (emoji: { native: string }) => {
    if (!ensureAuth()) return
    const newEmoji = emoji.native
    const reaction = {
      userId,
      actionId,
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
  }, [userId, actionId, userReaction, addReaction, updateReaction, ensureAuth])

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {Object.keys(groupedReactions).map((emoji) => (
          <div className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-sm dark:bg-slate-800" key={emoji}>
            <span>{emoji}</span>
            <span className="text-xs text-slate-500">{groupedReactions[emoji].length}</span>
          </div>
        ))}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-none">
          <Picker 
            data={data} 
            onEmojiSelect={handleEmojiSelect}
            theme="light" // or dynamic based on system
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
