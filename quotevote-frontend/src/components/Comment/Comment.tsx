"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client/react'
import { Reference } from '@apollo/client'
import { Link as LinkIcon, Trash2 } from 'lucide-react'
import CommentReactions from './CommentReactions'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { parseCommentDate } from '@/lib/utils/momentUtils'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import { DELETE_COMMENT } from '@/graphql/mutations'
import { CommentData, Reaction } from '@/types/comment'
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
  const { username, avatar, name } = commentUser
  const router = useRouter()
  const parsedDate = parseCommentDate(new Date(created))

  const currentUser = useAppStore((state) => state.user.data)
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
      toast.success('Comment deleted')
    } catch (err: unknown) {
      toast.error(`Error: ${(err as Error).message}`)
    }
  }

  const handleCopy = async () => {
    const baseUrl = window.location.origin
    await navigator.clipboard.writeText(`${baseUrl}${postUrl}/comment/#${_id}`)
    toast.success('Link copied!')
  }

  const isOwner = currentUser.id === comment.userId || currentUser._id === comment.userId || currentUser.admin

  useEffect(() => {
    if (selected) {
      setFocusedComment(_id)
    }
  }, [selected, _id, setFocusedComment])

  return (
    <article
      onMouseEnter={() => setFocusedComment(_id)}
      onMouseLeave={() => setFocusedComment(selected ? _id : null)}
      className={cn(
        'flex gap-3 py-3 transition-colors',
        selected && 'bg-yellow-50 dark:bg-yellow-900/10 -mx-4 px-4 rounded-lg'
      )}
    >
      {/* Avatar */}
      <button
        type="button"
        className="flex-shrink-0 mt-0.5"
        onClick={() => router.push(`/dashboard/profile/${username}`)}
      >
        <Avatar className="size-8">
          <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} alt={username} />
          <AvatarFallback className="text-xs bg-muted font-medium">
            {(username || '').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/profile/${username}`)}
            className="text-[13px] font-bold text-foreground hover:underline truncate"
          >
            {name || username}
          </button>
          <span className="text-[13px] text-muted-foreground truncate">@{username}</span>
          <span className="text-muted-foreground">·</span>
          <time className="text-xs text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
            {parsedDate}
          </time>
        </div>

        <p className="text-[14px] text-foreground/90 leading-relaxed mt-0.5 whitespace-pre-line">
          {content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 mt-1.5 -ml-2">
          <CommentReactions
            actionId={_id}
            reactions={(comment.reactions as Reaction[]) ?? []}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
          >
            <LinkIcon className="size-3.5" />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
