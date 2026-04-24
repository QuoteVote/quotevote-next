'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery } from '@apollo/client/react'
import { get } from 'lodash'
import { Link2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import CommentReactions from '@/components/Comment/CommentReactions'
import PostChatMessage from '@/components/PostChat/PostChatMessage'
import { parseCommentDate } from '@/lib/utils/momentUtils'
import { useAppStore } from '@/store'
import { toast } from 'sonner'
import { DELETE_VOTE, DELETE_COMMENT, DELETE_QUOTE } from '@/graphql/mutations'
import { GET_ACTION_REACTIONS } from '@/graphql/queries'
import { cn } from '@/lib/utils'
import useGuestGuard from '@/hooks/useGuestGuard'
import type {
  PostActionCardProps,
  ActionReactionsData,
  DeleteVoteData,
  DeleteCommentData,
  DeleteQuoteData,
} from '@/types/postActions'

// ── Type badge ───────────────────────────────────────────────────────────────
function ActionTypeBadge({ type, voteType }: { type: string; voteType?: string }) {
  if (type === 'Vote') {
    const isUp = voteType === 'up' || voteType === 'upvote'
    return (
      <span className={cn(
        'inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide',
        isUp
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
          : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
      )}>
        {isUp ? '↑ Agree' : '↓ Disagree'}
      </span>
    )
  }
  if (type === 'Quote') {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400">
        ❝ Quote
      </span>
    )
  }
  if (type === 'Comment') {
    return (
      <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400">
        💬 Comment
      </span>
    )
  }
  return null
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PostActionCard({
  postAction,
  postUrl = '',
  selected = false,
  refetchPost,
}: PostActionCardProps) {
  const [commentSelected, setCommentSelected] = useState(false)
  const router = useRouter()
  const user = useAppStore((state) => state.user.data)
  const ensureAuth = useGuestGuard()
  const setFocusedComment = useAppStore((state) => state.setFocusedComment)
  const setSharedComment = useAppStore((state) => state.setSharedComment)
  const sharedComment = useAppStore((state) => state.ui.sharedComment)

  const { user: actionUser, content, created, _id } = postAction
  const { username, avatar, name } = actionUser || {}
  const parsedDate = parseCommentDate(new Date(created))
  const voteType = get(postAction, 'type') as string | undefined
  const quote = get(postAction, 'quote') as string | undefined
  const type = postAction.__typename

  const { loading, data } = useQuery<ActionReactionsData>(GET_ACTION_REACTIONS, {
    variables: { actionId: _id },
    skip: type === 'Message',
  })
  const actionReactions = (!loading && data?.actionReactions) || []

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${baseUrl}${postUrl}/comment#${_id}`)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const [deleteVote] = useMutation<DeleteVoteData>(DELETE_VOTE, {
    update(cache, { data: d }) {
      if (!d?.deleteVote) return
      cache.modify({
        fields: {
          votes(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter((r) => readField('_id', r) !== d.deleteVote._id)
          },
        },
      })
    },
  })

  const [deleteComment] = useMutation<DeleteCommentData>(DELETE_COMMENT, {
    update(cache, { data: d }) {
      if (!d?.deleteComment) return
      cache.modify({
        fields: {
          comments(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter((r) => readField('_id', r) !== d.deleteComment._id)
          },
        },
      })
    },
  })

  const [deleteQuote] = useMutation<DeleteQuoteData>(DELETE_QUOTE, {
    update(cache, { data: d }) {
      if (!d?.deleteQuote) return
      cache.modify({
        fields: {
          quotes(existing: readonly { __ref: string }[] = [], { readField }) {
            return existing.filter((r) => readField('_id', r) !== d.deleteQuote._id)
          },
        },
      })
    },
  })

  const handleDelete = async () => {
    if (!ensureAuth()) return
    try {
      if (type === 'Vote') {
        await deleteVote({ variables: { voteId: _id } })
        toast.success('Vote deleted')
        refetchPost?.()
      } else if (type === 'Comment') {
        await deleteComment({ variables: { commentId: _id } })
        toast.success('Comment deleted')
        refetchPost?.()
      } else if (type === 'Quote') {
        await deleteQuote({ variables: { quoteId: _id } })
        toast.success('Quote deleted')
        refetchPost?.()
      }
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleClick = useCallback(() => {
    if (!commentSelected) {
      setFocusedComment(_id)
      setCommentSelected(true)
    } else {
      setFocusedComment(sharedComment)
      setCommentSelected(false)
    }
  }, [commentSelected, _id, sharedComment, setFocusedComment])

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (username) router.push(`/dashboard/profile/${username}`)
  }

  useEffect(() => {
    if (selected) {
      setSharedComment(_id)
      setFocusedComment(_id)
    }
  }, [selected, _id, setFocusedComment, setSharedComment])

  // ── Chat messages render as speech bubbles ──────────────────────────────
  if ('text' in postAction && postAction.text) {
    const messageText = typeof postAction.text === 'string' ? postAction.text : ''
    return (
      <PostChatMessage
        message={{
          _id: postAction._id,
          userId: (postAction as { userId?: string }).userId || '',
          text: messageText,
          created: typeof created === 'string' ? created : (created as Date).toISOString(),
          user: {
            username,
            name: name || username || 'Unknown',
            avatar: avatar as string | Record<string, unknown> | undefined,
          },
        }}
      />
    )
  }

  const userId = user?._id || user?.id
  const isOwner = userId === actionUser?._id || user?.admin
  const displayName = name || username || 'Unknown'

  const quoteContent = type === 'Quote'
    ? (quote && quote.length > 0 ? quote : 'Quoted this post.')
    : null
  const commentQuote = type === 'Comment' && 'commentQuote' in postAction
    ? (postAction.commentQuote as string | null | undefined)
    : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
      className={cn(
        'group relative flex gap-3 px-4 py-3.5 cursor-pointer transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        'hover:bg-muted/30',
        selected
          ? 'bg-primary/[0.04] border-l-[3px] border-l-primary'
          : 'border-l-[3px] border-l-transparent'
      )}
    >
      {/* Avatar */}
      <button
        type="button"
        onClick={handleProfileClick}
        className="shrink-0 mt-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <DisplayAvatar
          avatar={avatar as string | Record<string, unknown> | undefined}
          username={username}
          size={32}
          className="cursor-pointer"
        />
      </button>

      {/* Content column */}
      <div className="flex-1 min-w-0">

        {/* Header: name · date · type badge */}
        <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
          <button
            type="button"
            onClick={handleProfileClick}
            className="text-[13px] font-semibold text-[#52b274] hover:underline leading-none"
          >
            {displayName}
          </button>
          <span className="text-muted-foreground/40 text-xs leading-none">·</span>
          <time className="text-[11px] text-muted-foreground leading-none">{parsedDate}</time>
          <ActionTypeBadge type={type} voteType={voteType} />
        </div>

        {/* Vote: selected text as an accented blockquote */}
        {type === 'Vote' && (
          <blockquote className={cn(
            'pl-3 border-l-[3px] text-sm leading-relaxed',
            voteType === 'up' || voteType === 'upvote'
              ? 'border-l-emerald-400/60 text-foreground/80'
              : 'border-l-red-400/60 text-foreground/80'
          )}>
            {content
              ? <span>&ldquo;{content}&rdquo;</span>
              : <span className="italic text-muted-foreground/60">no text selected</span>
            }
          </blockquote>
        )}

        {/* Quote: italic blockquote with violet accent */}
        {type === 'Quote' && (
          <blockquote className="pl-3 border-l-[3px] border-l-violet-400/60 text-sm text-foreground/75 italic leading-relaxed">
            {quoteContent}
          </blockquote>
        )}

        {/* Comment: optional quoted context + body */}
        {type === 'Comment' && (
          <div>
            {commentQuote && (
              <blockquote className="mb-1.5 pl-3 border-l-[3px] border-l-sky-400/60 text-[13px] text-muted-foreground italic leading-relaxed">
                {commentQuote}
              </blockquote>
            )}
            <p className="text-[13px] text-foreground/85 leading-relaxed">{content}</p>
          </div>
        )}

        {/* Footer: reactions (left) · copy + delete (right, fade in on hover) */}
        <div className="flex items-center justify-between mt-2.5 -ml-1">
          <CommentReactions actionId={_id} reactions={actionReactions} />
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); handleCopy() }}
              className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50"
              aria-label="Copy link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                aria-label="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
