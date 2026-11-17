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
import { toCommentDeepLink } from '@/lib/utils/sanitizeUrl'
import { VOTE_LABELS } from '@/lib/constants/voteAxes'
import useGuestGuard from '@/hooks/useGuestGuard'
import type { VoteOption } from '@/types/voting'
import type {
  PostActionCardProps,
  ActionReactionsData,
  DeleteVoteData,
  DeleteCommentData,
  DeleteQuoteData,
} from '@/types/postActions'

// The vote's response (True, Like...). The API returns `tags` as a string, older data as
// an array; votes without a known response fall back to Agree/Disagree.
function voteResponseLabel(tags: unknown, isUp: boolean): string {
  const values = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',') : []
  const tag = values.map((t) => String(t).trim()).find((t) => t in VOTE_LABELS)
  if (tag) return VOTE_LABELS[tag as VoteOption]
  return isUp ? 'Agree' : 'Disagree'
}

/** Which colour a Discussion card takes: up and down votes, comments, quotes. */
export function actionLight(type: string, voteType?: string): 'up' | 'down' | 'comment' | 'quote' {
  if (type === 'Vote') return voteType === 'up' || voteType === 'upvote' ? 'up' : 'down'
  if (type === 'Quote') return 'quote'
  return 'comment'
}

// ── Type badge / activity label button (RC1-019) ─────────────────────────────
function ActionTypeBadge({
  type,
  voteType,
  voteTags,
  className,
}: {
  type: string
  voteType?: string
  voteTags?: unknown
  className?: string
}) {
  if (type === 'Vote') {
    const isUp = voteType === 'up' || voteType === 'upvote'
    return (
      <span
        data-testid="activity-label-button"
        className={cn('qv-tag', isUp ? 'qv-tag-up' : 'qv-tag-down', className)}
      >
        {isUp ? '↑' : '↓'} {voteResponseLabel(voteTags, isUp)}
      </span>
    )
  }
  if (type === 'Quote') {
    return (
      <span data-testid="activity-label-button" className={cn('qv-tag qv-tag-quote', className)}>
        “ Quote
      </span>
    )
  }
  if (type === 'Comment') {
    return (
      <span data-testid="activity-label-button" className={cn('qv-tag qv-tag-comment', className)}>
        Comment
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
      await navigator.clipboard.writeText(`${baseUrl}${toCommentDeepLink(postUrl, _id)}`)
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
      data-light={actionLight(type, voteType)}
      data-selected={selected ? 'true' : undefined}
      data-post-owner={isPostOwner ? 'true' : undefined}
      data-current-user={isOwner && !isPostOwner ? 'true' : undefined}
      className={cn(
        'qv-lit font-redesign group relative flex cursor-pointer items-start gap-3 px-4 py-3.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2457e6]'
      )}
    >
      {/* Avatar */}
      <button
        type="button"
        onClick={handleProfileClick}
        className="shrink-0 self-start rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <DisplayAvatar
          avatar={avatar as string | Record<string, unknown> | undefined}
          username={username}
          size={36}
          className="size-9 cursor-pointer"
        />
      </button>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Header: name, OP, time, then the type on the right */}
        <div className="flex items-center gap-2 text-[13px]">
          <button
            type="button"
            onClick={handleProfileClick}
            className="truncate font-bold text-[var(--shell-ink)] hover:underline"
          >
            {displayName}
          </button>
          {isPostOwner && (
            <span
              data-op-badge="true"
              className="qv-tag qv-tag-info h-[19px] px-1.5 text-[10.5px]"
              title="Original poster"
            >
              OP
            </span>
          )}
          <time className="shrink-0 text-[var(--shell-muted)]">· {parsedDate}</time>
          {type !== 'Message' && (
            <ActionTypeBadge
              type={type}
              voteType={voteType}
              voteTags={get(postAction, 'tags')}
              className="ml-auto shrink-0"
            />
          )}
        </div>

        {/* Vote: the passage it's about */}
        {type === 'Vote' && (
          <blockquote className="text-[14.5px] font-semibold leading-normal text-[var(--shell-ink)]">
            {content
              ? <span>&ldquo;{content}&rdquo;</span>
              : <span className="font-normal italic text-[var(--shell-muted)]">no text selected</span>
            }
          </blockquote>
        )}

        {/* Quote: the quoted words */}
        {type === 'Quote' && (
          <blockquote className="text-[14.5px] font-semibold leading-normal text-[var(--shell-ink)]">
            <span>&ldquo;{quoteContent}&rdquo;</span>
          </blockquote>
        )}

        {/* Comment: the passage it answers, then the comment */}
        {type === 'Comment' && (
          <div className="flex flex-col gap-1.5">
            {commentQuote && (
              <blockquote className="border-l-[3px] border-[#fdd835] pl-2.5 text-[13px] font-semibold leading-normal text-[var(--shell-muted)]">
                <span>&ldquo;{commentQuote}&rdquo;</span>
              </blockquote>
            )}
            <p className="text-[14.5px] leading-[1.55] text-[var(--shell-ink)]">{content}</p>
          </div>
        )}

        {/* Footer: reactions, then Copy link and Delete */}
        <div className="flex items-center justify-between gap-2">
          <CommentReactions actionId={_id} reactions={actionReactions} />
          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleCopy() }}
              className="h-[30px] px-2.5 text-[13px] font-bold text-[var(--shell-ink-2)]"
              aria-label="Copy link"
            >
              <Link2 className="size-3.5" aria-hidden="true" />
              Copy link
            </Button>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); handleDelete() }}
                className="h-[30px] px-2.5 text-[13px] font-bold text-[var(--shell-down)] hover:bg-destructive/10 hover:text-[var(--shell-down)]"
                aria-label="Delete"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
