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

// ── Type badge / activity label button (RC1-019) ─────────────────────────────
function ActionTypeBadge({
  type,
  voteType,
  className,
}: {
  type: string
  voteType?: string
  className?: string
}) {
  if (type === 'Vote') {
    const isUp = voteType === 'up' || voteType === 'upvote'
    return (
      <span
        data-testid="activity-label-button"
        className={cn(
          'inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide shrink-0',
          isUp
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
          className
        )}
      >
        {isUp ? '↑ Agree' : '↓ Disagree'}
      </span>
    )
  }
  if (type === 'Quote') {
    return (
      <span
        data-testid="activity-label-button"
        className={cn(
          'inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 shrink-0',
          className
        )}
      >
        ❝ Quote
      </span>
    )
  }
  if (type === 'Comment') {
    return (
      <span
        data-testid="activity-label-button"
        className={cn(
          'inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400 shrink-0',
          className
        )}
      >
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
  postOwnerId,
  onSelectAction,
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
    if (onSelectAction) {
      onSelectAction(postAction)
      return
    }
    if (!commentSelected) {
      setFocusedComment(_id)
      setCommentSelected(true)
    } else {
      setFocusedComment(sharedComment)
      setCommentSelected(false)
    }
  }, [commentSelected, _id, sharedComment, setFocusedComment, onSelectAction, postAction])

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (username) router.push(`/profile/${username}`)
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
  const isPostOwner = !!postOwnerId && !!actionUser?._id && actionUser._id === postOwnerId
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
      data-post-action="true"
      data-action-type={type}
      data-selected={selected ? 'true' : undefined}
      data-post-owner={isPostOwner ? 'true' : undefined}
      data-current-user={isOwner && !isPostOwner ? 'true' : undefined}
      className={cn(
        'group relative flex items-start gap-3 px-3.5 py-3 cursor-pointer transition-colors rounded-xl border',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
        selected
          ? 'bg-[#52b274]/[0.06] border-[#52b274]/30 border-l-[4px] border-l-[#52b274]'
          : 'border-border/70 border-l-[4px] border-l-transparent hover:bg-muted/30'
      )}
    >
      {/* Avatar */}
      <button
        type="button"
        onClick={handleProfileClick}
        className="shrink-0 self-start mt-0.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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

        {/* Header: name + date (avoid flex-wrap jitter on small screens) */}
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <button
            type="button"
            onClick={handleProfileClick}
            className="text-[12px] sm:text-[13px] font-semibold text-[#52b274] hover:underline leading-none"
          >
            {displayName}
          </button>
          {isPostOwner && (
            <span
              data-op-badge="true"
              className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full tracking-wide bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 leading-none"
              title="Original poster"
            >
              OP
            </span>
          )}
          <div className="flex min-w-0 items-baseline gap-1">
            <span className="text-muted-foreground/40 text-xs leading-none">·</span>
            <time className="text-[10px] sm:text-[11px] text-muted-foreground leading-none">{parsedDate}</time>
          </div>
          {type !== 'Message' && (
            <div className="ml-0.5 shrink-0 self-baseline">
              <ActionTypeBadge type={type} voteType={voteType} className="leading-none" />
            </div>
          )}
        </div>

        {/* Vote: selected text as an accented blockquote */}
        {type === 'Vote' && (
          <blockquote className="text-sm leading-relaxed italic text-foreground/80">
            {content
              ? <span>&ldquo;{content}&rdquo;</span>
              : <span className="italic text-muted-foreground/60">no text selected</span>
            }
          </blockquote>
        )}

        {/* Quote: italic excerpt */}
        {type === 'Quote' && (
          <blockquote className="text-sm text-foreground/75 italic leading-relaxed">
            <span>{quoteContent}</span>
          </blockquote>
        )}

        {/* Comment: optional quoted context + body */}
        {type === 'Comment' && (
          <div>
            {commentQuote && (
              <blockquote className="mb-1.5 text-[14px] text-muted-foreground italic leading-relaxed">
                <span>{commentQuote}</span>
              </blockquote>
            )}
            <p className="text-[14px] text-foreground/85 leading-relaxed">{content}</p>
          </div>
        )}


        {/* Footer: reactions + copy/delete (keep emoji alignment consistent) */}
        <div className="flex items-start justify-between gap-2 mt-2">
          <CommentReactions actionId={_id} reactions={actionReactions} />
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
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
