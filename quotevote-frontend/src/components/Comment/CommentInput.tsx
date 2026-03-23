"use client"

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ADD_COMMENT } from '@/graphql/mutations'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import useGuestGuard from '@/hooks/useGuestGuard'

interface CommentInputProps {
  actionId: string
  onSuccess?: () => void
}

interface AddCommentData {
  addComment: {
    _id: string
    userId: string
    content: string
    created: string
    user: {
      _id: string
      username: string
      avatar: string
    }
  }
}

export default function CommentInput({
  actionId,
  onSuccess
}: CommentInputProps) {
  const [content, setContent] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const userId = useAppStore((state) => state.user.data.id || state.user.data._id)
  const userData = useAppStore((state) => state.user.data)
  const ensureAuth = useGuestGuard()

  const avatarSrc = typeof userData.avatar === 'string' ? userData.avatar : undefined
  const displayName = (userData.name as string) || (userData.username as string) || ''

  const [addComment, { loading }] = useMutation<AddCommentData>(ADD_COMMENT, {
    update(cache, { data }) {
      if (!data?.addComment) return
      cache.modify({
        fields: {
          comments(existing = []) {
            const newCommentRef = cache.writeFragment({
              data: data.addComment,
              fragment: gql`
                fragment NewComment on Comment {
                  _id
                  userId
                  content
                  created
                  user {
                    _id
                    username
                    avatar
                  }
                }
              `
            })
            return [newCommentRef, ...existing]
          }
        }
      })
    }
  })

  const handleSubmit = async () => {
    if (!content.trim()) return
    if (!ensureAuth()) return

    try {
      await addComment({
        variables: {
          comment: {
            actionId,
            userId,
            content
          }
        }
      })
      toast.success('Comment posted!')
      setContent('')
      setIsFocused(false)
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex gap-3">
      {/* User avatar */}
      <div className="flex-shrink-0 mt-1">
        <Avatar className="size-8">
          <AvatarImage src={avatarSrc} />
          <AvatarFallback className="text-xs bg-muted font-medium">
            {displayName.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Input area */}
      <div className="flex-1 min-w-0">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => !content && setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Post your reply..."
          className="min-h-[44px] resize-none border-0 bg-transparent focus-visible:ring-0 px-0 text-[15px] placeholder:text-muted-foreground/60"
          rows={isFocused ? 3 : 1}
        />

        {(isFocused || content) && (
          <div className="flex justify-end pt-2 border-t border-border mt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || !content.trim()}
              className="rounded-full px-4 h-8 text-sm font-semibold"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Send className="size-3.5 mr-1.5" />
                  Reply
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
