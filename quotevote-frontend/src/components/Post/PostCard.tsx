'use client'

import { useState, memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery, useMutation } from '@apollo/client/react'
import { Link2, Bookmark, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDomain, toAppPostUrl } from '@/lib/utils/sanitizeUrl'
import { useAppStore } from '@/store'
import { GET_GROUP } from '@/graphql/queries'
import { UPDATE_POST_BOOKMARK, APPROVE_POST, REJECT_POST } from '@/graphql/mutations'
import { toast } from 'sonner'
import getTopPostsVoteHighlights from '@/lib/utils/getTopPostsVoteHighlights'
import useGuestGuard from '@/hooks/useGuestGuard'
import HighlightText from '@/components/HighlightText/HighlightText'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import type { PostCardProps } from '@/types/post'

// Standard post cards are always blue. Vote state is communicated by the
// up/down controls, not the card chrome. Green/red belong to profile activity
// cards (see ActivityCard + getCardBackgroundColor).
const CARD_THEME = {
  borderColor: '#56b3ff',
  shadow: '4px 4px 0px rgba(86,179,255,0.45)',
  hoverShadow: '7px 7px 0px rgba(86,179,255,0.55)',
} as const

type VoteStateMutationPost = {
  _id: string
  approvedBy?: string[]
  rejectedBy?: string[]
}

type ApprovePostMutationData = {
  approvePost?: VoteStateMutationPost
}

type RejectPostMutationData = {
  rejectPost?: VoteStateMutationPost
}

function stringLimit(text: string, limit: number): string {
  if (!text || text.length <= limit) return text
  return text.slice(0, limit) + '...'
}

function PostCardComponent({
  _id,
  text,
  title,
  url,
  bookmarkedBy = [],
  approvedBy = [],
  rejectedBy = [],
  created,
  creator,
  activityType: _activityType = 'POSTED',
  limitText = false,
  votes = [],
  comments = [],
  quotes = [],
  messageRoom,
  groupId,
  citationUrl,
  attribution,
  searchKey,
  compact = false,
}: PostCardProps) {
  const router = useRouter()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const guestGuard = useGuestGuard()
  const userId = useAppStore(
    (state) => state.user.data?._id || state.user.data?.id
  ) as string | undefined

  const [updateBookmark] = useMutation(UPDATE_POST_BOOKMARK)
  const [approvePost, { loading: approvingPost }] =
    useMutation<ApprovePostMutationData>(APPROVE_POST)
  const [rejectPost, { loading: rejectingPost }] =
    useMutation<RejectPostMutationData>(REJECT_POST)

  // Local optimistic state — updates immediately on vote so color reflects right away
  const [localApprovedBy, setLocalApprovedBy] = useState<string[]>(() => approvedBy || [])
  const [localRejectedBy, setLocalRejectedBy] = useState<string[]>(() => rejectedBy || [])

  // Sync when server data refreshes — updating state during render is the React-recommended
  // pattern for deriving state from props without triggering a cascading effect cycle.
  const [prevApprovedBy, setPrevApprovedBy] = useState(approvedBy)
  const [prevRejectedBy, setPrevRejectedBy] = useState(rejectedBy)
  if (prevApprovedBy !== approvedBy) {
    setPrevApprovedBy(approvedBy)
    setLocalApprovedBy(approvedBy || [])
  }
  if (prevRejectedBy !== rejectedBy) {
    setPrevRejectedBy(rejectedBy)
    setLocalRejectedBy(rejectedBy || [])
  }

  const isBookmarked = userId ? bookmarkedBy.includes(userId) : false
  const hasApproved = userId ? localApprovedBy.includes(userId) : false
  const hasRejected = userId ? localRejectedBy.includes(userId) : false

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!guestGuard()) return
    if (!userId) return
    try {
      await updateBookmark({ variables: { postId: _id, userId } })
    } catch {
      toast.error('Failed to update bookmark')
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const postUrl = url
      ? `${window.location.origin}${toAppPostUrl(url)}`
      : window.location.href
    await navigator.clipboard.writeText(postUrl)
    toast.success('Link copied!')
  }

  const handleApprove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!guestGuard()) return
    if (!userId) return
    // Optimistic update
    if (hasApproved) {
      setLocalApprovedBy((prev) => prev.filter((id) => id !== userId))
    } else {
      setLocalApprovedBy((prev) => [...prev, userId])
      setLocalRejectedBy((prev) => prev.filter((id) => id !== userId))
    }
    try {
      const { data } = await approvePost({
        variables: { postId: _id, userId, remove: hasApproved },
      })
      const updatedPost = data?.approvePost
      if (updatedPost) {
        // The optimistic update is only immediate feedback; the completed mutation is authoritative.
        setLocalApprovedBy(updatedPost.approvedBy || [])
        setLocalRejectedBy(updatedPost.rejectedBy || [])
      }
    } catch {
      setLocalApprovedBy(approvedBy || [])
      setLocalRejectedBy(rejectedBy || [])
      toast.error('Failed to update vote')
    }
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!guestGuard()) return
    if (!userId) return
    // Optimistic update
    if (hasRejected) {
      setLocalRejectedBy((prev) => prev.filter((id) => id !== userId))
    } else {
      setLocalRejectedBy((prev) => [...prev, userId])
      setLocalApprovedBy((prev) => prev.filter((id) => id !== userId))
    }
    try {
      const { data } = await rejectPost({
        variables: { postId: _id, userId, remove: hasRejected },
      })
      const updatedPost = data?.rejectPost
      if (updatedPost) {
        // Reconcile both arrays because rejecting can also remove an existing approval.
        setLocalApprovedBy(updatedPost.approvedBy || [])
        setLocalRejectedBy(updatedPost.rejectedBy || [])
      }
    } catch {
      setLocalApprovedBy(approvedBy || [])
      setLocalRejectedBy(rejectedBy || [])
      toast.error('Failed to update vote')
    }
  }

  const postText = text || ''
  const contentLimit = limitText ? 20 : 150
  const isContentTruncated = postText.length > contentLimit

  let displayText: string | React.ReactNode = isContentTruncated
    ? stringLimit(postText, contentLimit)
    : postText

  if (!isEmpty(votes)) {
    const mappedVotes = votes
      .filter((v) => v.startWordIndex != null && v.endWordIndex != null)
      .map((v) => ({
        startWordIndex: v.startWordIndex ?? 0,
        endWordIndex: v.endWordIndex ?? 0,
        type: v.type ?? undefined,
        up: v.type?.toUpperCase() === 'UP' || v.type?.toUpperCase() === 'UPVOTE' ? 1 : 0,
        down:
          v.type?.toUpperCase() === 'DOWN' || v.type?.toUpperCase() === 'DOWNVOTE' ? 1 : 0,
      }))
    displayText = getTopPostsVoteHighlights(mappedVotes, displayText, postText)
  }

  const messages =
    messageRoom && 'messages' in messageRoom
      ? (messageRoom as { messages?: unknown[] }).messages || []
      : []

  const interactionCount =
    (approvedBy?.length ?? 0) +
    (rejectedBy?.length ?? 0) +
    comments.length +
    votes.length +
    quotes.length +
    messages.length

  const { data: groupData } = useQuery<{ group?: { _id: string; title: string } }>(GET_GROUP, {
    variables: { groupId: groupId || '' },
    skip: !groupId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const handleCardClick = () => {
    setSelectedPost(_id)
    if (url) router.push(toAppPostUrl(url))
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const uname = creator?.username
    if (!uname) return
    router.push(`/dashboard/profile/${uname}`)
  }

  const username = creator?.username || 'Anonymous'
  // Seed the default avatar with the same value the profile/chat use
  // (display name, falling back to username) so an unset avatar looks
  // identical across the post card, profile and messages.
  const avatarSeed = creator?.name || username
  const upvoteCount = localApprovedBy.length
  const downvoteCount = localRejectedBy.length


  const formattedDate = useMemo(
    () =>
      moment(created).calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        lastDay: '[Yesterday]',
        lastWeek: '[Last] dddd',
        sameElse: 'MMM DD, YYYY',
      }) + ` @ ${moment(created).format('h:mm A')}`,
    [created]
  )

  return (
    <article
      data-testid="post-card"
      data-post-title={title || ''}
      data-compact={compact ? 'true' : undefined}
      className={cn('group/card rounded-[7px] cursor-pointer overflow-hidden bg-card')}
      style={{
        border: `2px solid ${CARD_THEME.borderColor}`,
        borderBottom: `8px solid ${CARD_THEME.borderColor}`,
        boxShadow: CARD_THEME.shadow,
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = CARD_THEME.hoverShadow
        e.currentTarget.style.transform = 'translate(-2px, -2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = CARD_THEME.shadow
        e.currentTarget.style.transform = ''
      }}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
      tabIndex={0}
      role="article"
      aria-label={title || 'Post'}
      data-sentiment="neutral"
    >
      {/* ── Vote + interactions row ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-border/30">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <button
            type="button"
            onClick={handleApprove}
            disabled={approvingPost || rejectingPost}
            aria-label={hasApproved ? 'Remove support' : 'Support this post'}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-sm font-semibold transition-colors disabled:opacity-60',
              hasApproved
                ? 'bg-[#52b274] text-white'
                : 'bg-muted/50 text-foreground hover:bg-[#52b274]/15 hover:text-[#52b274]'
            )}
          >
            <span className={cn('font-bold', hasApproved ? 'text-white' : 'text-[#52b274]')}>↑</span>
            <span className="tabular-nums">{upvoteCount}</span>
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={approvingPost || rejectingPost}
            aria-label={hasRejected ? 'Remove disagreement' : 'Disagree with this post'}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded text-sm font-semibold transition-colors disabled:opacity-60',
              hasRejected
                ? 'bg-[#ff6060] text-white'
                : 'bg-muted/50 text-foreground hover:bg-[#ff6060]/15 hover:text-[#ff6060]'
            )}
          >
            <span className={cn('font-bold', hasRejected ? 'text-white' : 'text-[#ff6060]')}>↓</span>
            <span className="tabular-nums">{downvoteCount}</span>
          </button>
          {!compact && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/30">
              {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {compact ? (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted/40 shrink-0">
            {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={cn(
                'p-1.5 rounded transition-colors',
                isBookmarked
                  ? 'text-amber-500'
                  : 'text-muted-foreground/60 hover:text-amber-500 hover:bg-amber-500/10'
              )}
              onClick={handleBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="p-1.5 rounded text-muted-foreground/60 hover:text-[#52b274] hover:bg-[#52b274]/10 transition-colors"
              onClick={handleShare}
              aria-label="Share"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div className={cn('px-4 pt-3', compact ? 'pb-2' : 'pb-3')}>
        <h3
          className={cn(
            'font-bold text-foreground leading-snug mb-2 break-words group-hover/card:text-[#52b274] transition-colors',
            compact ? 'text-lg text-center' : 'text-xl'
          )}
        >
          <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
        </h3>

        {(groupId && groupData?.group) || citationUrl || (compact && attribution) ? (
          <div
            className={cn(
              'flex items-center flex-wrap gap-1.5',
              compact ? 'justify-center mb-1' : 'mb-3'
            )}
          >
            {groupId && groupData?.group && (
              <span className="text-[10px] font-semibold text-[#52b274] bg-[rgba(82,178,116,0.1)] border border-[rgba(82,178,116,0.2)] px-2 py-0.5 rounded-full uppercase tracking-wide">
                #{groupData.group.title}
              </span>
            )}
            {citationUrl && (
              <a
                href={citationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1976d2] bg-[rgba(25,118,210,0.08)] border border-[rgba(25,118,210,0.2)] px-2 py-0.5 rounded-full hover:bg-[rgba(25,118,210,0.18)] transition-colors"
              >
                <Link2 className="size-3" />
                Source: {getDomain(citationUrl)}
              </a>
            )}
            {compact && attribution ? (
              <span className="text-xs italic text-muted-foreground">— {attribution}</span>
            ) : null}
          </div>
        ) : null}

        {/* Body */}
        {!compact && (
          <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3">
            {displayText}
          </div>
        )}
      </div>

      {/* ── Footer: avatar + username + date ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/30 bg-muted/10">
        <button
          type="button"
          className="flex items-center gap-2 group/author min-w-0"
          onClick={handleProfileClick}
        >
          <DisplayAvatar
            avatar={creator?.avatar as string | Record<string, unknown> | undefined}
            username={avatarSeed}
            size={32}
          />
          <span className="text-sm font-bold text-[#52b274] group-hover/author:underline truncate">
            {username}
          </span>
        </button>
        <span className="text-muted-foreground/40 flex-shrink-0">|</span>
        <time
          className="text-xs text-muted-foreground/70 flex-shrink-0"
          suppressHydrationWarning
        >
          {formattedDate}
        </time>
      </div>
    </article>
  )
}

const PostCard = memo(PostCardComponent)
export default PostCard
