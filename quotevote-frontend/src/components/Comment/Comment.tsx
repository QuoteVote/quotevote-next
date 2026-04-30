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
      data-comment-card="true"
      data-current-user={isOwner ? 'true' : undefined}
      className={cn(
        'group/comment flex gap-3 py-3.5 transition-all duration-200',
        selected && 'bg-amber-50/60 dark:bg-amber-900/10 -mx-4 px-4 rounded-xl border border-amber-200/40 dark:border-amber-800/20'
      )}
    >
      {/* Avatar */}
      <button
        type="button"
        className="flex-shrink-0 mt-0.5"
        onClick={() => router.push(`/dashboard/profile/${username}`)}
      >
        <Avatar className="size-8 ring-1 ring-border/50">
          <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} alt={username} />
          <AvatarFallback className="text-[11px] bg-muted font-semibold">
            {(name || username || '').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author + time */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/profile/${username}`)}
            className="text-[13px] font-bold text-foreground hover:underline truncate"
          >
            {name || username}
          </button>
          <span className="text-[12px] text-muted-foreground/70 truncate">@{username}</span>
          <span className="text-muted-foreground/40 text-[10px]">·</span>
          <time className="text-[11px] text-muted-foreground/60 whitespace-nowrap" suppressHydrationWarning>
            {parsedDate}
          </time>
        </div>

        {/* Comment text */}
        <p className="text-[14px] text-foreground/85 leading-[1.6] whitespace-pre-line">
          {content}
        </p>

        {/* Actions — visible on hover */}
        <div className="flex items-center gap-0.5 mt-1.5 -ml-1.5 opacity-60 group-hover/comment:opacity-100 transition-opacity">
          <CommentReactions
            actionId={_id}
            reactions={(comment.reactions as Reaction[]) ?? []}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-foreground rounded-full"
            onClick={handleCopy}
            aria-label="Copy comment link"
          >
            <LinkIcon className="size-3" />
          </Button>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive rounded-full"
              onClick={handleDelete}
              aria-label="Delete comment"
            >
              <Trash2 className="size-3" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
