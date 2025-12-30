"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react' // Using /react entry point as per project pattern
import { Reference } from '@apollo/client'
import { Smile, Link as LinkIcon, Trash2, Pencil } from 'lucide-react'
import { CommentInput } from './'
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { parseCommentDate } from '@/lib/utils/momentUtils'
import { useAppStore } from '@/store/useAppStore'
import { DELETE_COMMENT } from '@/graphql/mutations'
import { CommentData } from '@/types/comment'
import useGuestGuard from '@/hooks/useGuestGuard'
import { cn } from '@/lib/utils'

interface CommentProps {
  comment: CommentData
  postUrl?: string
  selected?: boolean
}

interface DeleteCommentData {
  deleteComment: {
    _id: string
  }
}


export default function Comment({ comment, postUrl, selected }: CommentProps) {
  const {
    user: commentUser,
    content,
    created,
    _id,
  } = comment
  const { username, avatar } = commentUser
  const [isEditing, setIsEditing] = useState(false)

  const router = useRouter()
  const parsedDate = parseCommentDate(new Date(created))
  
  const currentUser = useAppStore((state) => state.user.data)
  const setSnackbar = useAppStore((state) => state.setSnackbar)
  const setFocusedComment = useAppStore((state) => state.setFocusedComment)
  const ensureAuth = useGuestGuard()

  const [deleteComment] = useMutation<DeleteCommentData>(DELETE_COMMENT, {
    update(cache, { data }) {
      if (!data?.deleteComment) return
      cache.modify({
        fields: {
          comments(existing: readonly Reference[] = [], { readField }) {
            return existing.filter(
              (commentRef) => readField('_id', commentRef) !== data.deleteComment._id,
            )
          },
        },
      })
    },
  })

  const handleDelete = async () => {
    if (!ensureAuth()) return
    try {
      await deleteComment({ variables: { commentId: _id } })
      setSnackbar({
        open: true,
        message: 'Comment deleted successfully',
        type: 'success',
      })
    } catch (err: unknown) {
      setSnackbar({
        open: true,
        message: `Delete Error: ${(err as Error).message}`,
        type: 'danger',
      })
    }
  }

  const handleCopy = async () => {
    const baseUrl = window.location.origin
    await navigator.clipboard.writeText(`${baseUrl}${postUrl}/comment/#${_id}`)
    setSnackbar({
      open: true,
      message: 'Comment URL copied!',
      type: 'success',
    })
  }

  const isOwner = currentUser.id === comment.userId || currentUser._id === comment.userId || currentUser.admin

  useEffect(() => {
    if (selected) {
      setFocusedComment(_id)
    }
  }, [selected, _id, setFocusedComment])

  return (
    <Card
      onMouseEnter={() => setFocusedComment(_id)}
      onMouseLeave={() => setFocusedComment(selected ? _id : null)}
      className={cn(
        "w-full transition-colors",
        selected ? "bg-[#f1e8c1] dark:bg-yellow-900/20" : "bg-card"
      )}
    >
      <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
        <Button 
          variant="ghost" 
          className="h-10 w-10 rounded-full p-0"
          onClick={() => router.push(`/Profile/${username}`)}
        >
          <Avatar>
            <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} alt={username} />
            <AvatarFallback>{username.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
        <div className="flex flex-col">
          <span className="text-sm font-medium">@{username}</span>
          <span className="text-xs text-muted-foreground" suppressHydrationWarning>{parsedDate}</span>
        </div>
      </CardHeader>
      
      <CardContent className="px-14 py-2">
        {isEditing ? (
          <CommentInput 
            actionId={(comment.actionId as string) || ""}
            commentId={_id}
            initialContent={content}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        ) : (
          <p className="text-sm leading-relaxed">{content}</p>
        )}
      </CardContent>

      <CardFooter className="flex justify-start gap-1 p-2 px-12">
        {!isEditing && (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <Smile className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleCopy}>
              <LinkIcon className="h-4 w-4" />
            </Button>
            {isOwner && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:bg-muted"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
