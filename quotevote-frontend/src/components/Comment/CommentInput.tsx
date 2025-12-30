"use client"

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useMutation } from '@apollo/client/react'
import { gql } from '@apollo/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ADD_COMMENT, UPDATE_COMMENT } from '@/graphql/mutations'
import { useAppStore } from '@/store/useAppStore'
import useGuestGuard from '@/hooks/useGuestGuard'
import { cn } from '@/lib/utils'

interface CommentInputProps {
  actionId: string // The ID of the post/action being commented on
  commentId?: string // If provided, we are editing this comment
  initialContent?: string
  onCancel?: () => void
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

interface UpdateCommentData {
  updateComment: {
    _id: string
    content: string
  }
}

export default function CommentInput({ 
  actionId, 
  commentId, 
  initialContent = '', 
  onCancel,
  onSuccess 
}: CommentInputProps) {
  const [content, setContent] = useState(initialContent)
  const [isFocused, setIsFocused] = useState(false)
  const userId = useAppStore((state) => state.user.data.id || state.user.data._id)
  const setSnackbar = useAppStore((state) => state.setSnackbar)
  const ensureAuth = useGuestGuard()

  const [addComment, { loading: adding }] = useMutation<AddCommentData>(ADD_COMMENT, {
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

  const [updateComment, { loading: updating }] = useMutation<UpdateCommentData>(UPDATE_COMMENT)
  const loading = adding || updating

  const handleSubmit = async () => {
    if (!content.trim()) return
    if (!ensureAuth()) return

    try {
      if (commentId) {
        // Edit mode
        await updateComment({
          variables: {
            commentId,
            content
          }
        })
        setSnackbar({ open: true, message: 'Comment updated!', type: 'success' })
      } else {
        // Create mode
        await addComment({
          variables: {
            comment: {
              actionId,
              userId,
              content
            }
          }
        })
        setSnackbar({ open: true, message: 'Comment posted!', type: 'success' })
        setContent('')
      }
      if (onSuccess) onSuccess()
    } catch (err: unknown) {
      setSnackbar({ 
        open: true, 
        message: `Error: ${(err as Error).message}`, 
        type: 'danger' 
      })
    }
  }

  const isEdgeCase = commentId && initialContent // Only for edit
  
  return (
    <div className={cn(
      "flex flex-col gap-2 w-full", 
      isFocused && "ring-1 ring-ring rounded-md p-1"
    )}>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => !content && setIsFocused(false)}
        placeholder={commentId ? "Update your comment..." : "Write a comment..."}
        className="min-h-[80px] resize-none border-none focus-visible:ring-0 bg-transparent"
      />
      
      {(isFocused || content || isEdgeCase) && (
        <div className="flex justify-end gap-2 px-2 pb-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          )}
          <Button 
            size="sm" 
            onClick={handleSubmit} 
            disabled={loading || !content.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {commentId ? 'Update' : 'Post'}
          </Button>
        </div>
      )}
    </div>
  )
}
