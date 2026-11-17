'use client'

import { memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery, useMutation } from '@apollo/client/react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bookmark,
  ExternalLink,
  Hash,
  MessagesSquare,
  Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDomain, toAppPostUrl, toAbsolutePostUrl } from '@/lib/utils/sanitizeUrl'
import { useAppStore } from '@/store'
import { GET_TAG } from '@/graphql/queries'
import { UPDATE_POST_BOOKMARK } from '@/graphql/mutations'
import { toast } from 'sonner'
import getTopPostsVoteHighlights from '@/lib/utils/getTopPostsVoteHighlights'
import useGuestGuard from '@/hooks/useGuestGuard'
import HighlightText from '@/components/HighlightText/HighlightText'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import type { PostCardProps } from '@/types/post'
import { STANDARD_POST_CARD_THEME } from '@/lib/constants/postCardTheme'
import { announceBookmarkChange } from '@/lib/utils/bookmarkFeedback'

// Standard post cards are always blue. Green/red belong to profile activity
// cards (see ActivityCard + getCardBackgroundColor).
const CARD_THEME = STANDARD_POST_CARD_THEME

function stringLimit(text: string, limit: number): string {
  if (!text || text.length <= limit) return text
  return text.slice(0, limit) + '...'
}

/** Up and down vote totals: the stored counts, or a count of `votes` when they are missing. */
function countVotes(
  votes: PostCardProps['votes'],
  upvotes: number | null | undefined,
  downvotes: number | null | undefined
): { up: number; down: number } {
  if (typeof upvotes === 'number' && typeof downvotes === 'number') {
    return { up: upvotes, down: downvotes }
  }
  let up = 0
  let down = 0
  for (const v of votes ?? []) {
    const type = v.type?.toUpperCase()
    if (type === 'UP' || type === 'UPVOTE') up += 1
    else if (type === 'DOWN' || type === 'DOWNVOTE') down += 1
  }
  return { up: upvotes ?? up, down: downvotes ?? down }
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
  tagId,
  citationUrl,
  attribution,
  searchKey,
  compact = false,
  upvotes,
  downvotes,
  timeOnly = false,
}: PostCardProps) {
  const router = useRouter()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const guestGuard = useGuestGuard()
  const userId = useAppStore(
    (state) => state.user.data?._id || state.user.data?.id
  ) as string | undefined

  const [updateBookmark] = useMutation(UPDATE_POST_BOOKMARK)

  const isBookmarked = userId ? bookmarkedBy.includes(userId) : false

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!guestGuard()) return
    if (!userId) return
    try {
      await updateBookmark({ variables: { postId: _id, userId } })
      announceBookmarkChange(isBookmarked)
    } catch {
      toast.error('Failed to update bookmark')
    }
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const postUrl = toAbsolutePostUrl(url)
    if (!postUrl) {
      toast.error('Unable to copy link — this post has no shareable URL')
      return
    }
    try {
      await navigator.clipboard.writeText(postUrl)
      toast.success('Link copied!')
    } catch {
      toast.error('Failed to copy link')
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

  const { data: tagData } = useQuery<{ tag?: { _id: string; title: string } | null }>(GET_TAG, {
    variables: { tagId: tagId || '' },
    skip: !tagId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const handleCardClick = () => {
    if (typeof window !== 'undefined') {
      const selection = window.getSelection()
      if (selection && !selection.isCollapsed && (selection.toString()?.length ?? 0) > 0) {
        return
      }
    }
    setSelectedPost(_id)
    if (url) router.push(toAppPostUrl(url))
  }

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const uname = creator?.username
    if (!uname) return
    router.push(`/profile/${uname}`)
  }

  const username = creator?.username || 'Anonymous'
  // Seed the default avatar with the same value the profile/chat use
  // (display name, falling back to username) so an unset avatar looks
  // identical across the post card, profile and messages.
  const avatarSeed = creator?.name || username
  const tagTitle = tagId && tagData?.tag ? tagData.tag.title : null

  // Opens the home results with this tag applied, keeping the current search,
  // date, sort and Following filters when already on the home page.
  const handleTagClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!tagId) return
    const params = new URLSearchParams(
      window.location.pathname === '/' ? window.location.search : ''
    )
    params.set('tag', tagId)
    params.delete('group')
    params.delete('page')
    router.push(`/?${params.toString()}`)
  }

  const formattedDate = useMemo(() => {
    const time = moment(created).format('h:mm A')
    if (timeOnly) return time
    const day = moment(created).calendar(null, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: 'dddd',
      lastDay: '[Yesterday]',
      lastWeek: '[Last] dddd',
      sameElse: 'MMM DD, YYYY',
    })
    return `${day} @ ${time}`
  }, [created, timeOnly])

  const { up, down } = countVotes(votes, upvotes, downvotes)
  const displayName = creator?.name?.trim() || username

  return (
    <article
      data-testid="post-card"
      data-post-title={title || ''}
      data-compact={compact ? 'true' : undefined}
      className={cn(
        'group/card font-redesign rounded-[7px] cursor-pointer overflow-hidden bg-card',
        // An outline, not a ring: the card's inline box-shadow would hide a ring.
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#52b274]'
      )}
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
      <div className="flex flex-col gap-2.5 p-4 sm:gap-3 sm:px-[22px] sm:pt-5 sm:pb-[18px]">
        {/* ── Author and time, then the topic and (full cards) save/share ── */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="group/author flex min-w-0 items-center gap-2.5 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-1"
            onClick={handleProfileClick}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <DisplayAvatar
              avatar={creator?.avatar as string | Record<string, unknown> | undefined}
              username={avatarSeed}
              size={36}
              className="size-8 flex-shrink-0 sm:size-9"
            />
            <span className="flex min-w-0 flex-col">
              <b className="truncate text-[13px] text-[var(--shell-ink)] group-hover/author:underline sm:text-sm">
                {displayName}
              </b>
              <span className="truncate text-xs text-[var(--shell-muted)] sm:text-[13px]">
                {creator?.username ? `@${creator.username} · ` : ''}
                <time suppressHydrationWarning>{formattedDate}</time>
              </span>
            </span>
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {tagTitle && (
              <button
                type="button"
                data-testid="post-card-tag"
                aria-label={`Show posts tagged #${tagTitle}`}
                title={`Show posts tagged #${tagTitle}`}
                onClick={handleTagClick}
                onKeyDown={(e) => e.stopPropagation()}
                className="inline-flex h-6 max-w-[11rem] items-center gap-0.5 rounded-full bg-[var(--shell-green-soft)] px-2.5 text-[11px] font-bold text-[var(--shell-green)] transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-1 sm:h-7 sm:px-[11px] sm:text-[12.5px]"
              >
                <Hash className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{tagTitle}</span>
              </button>
            )}
            {!compact && (
              <div
                className="flex items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={cn(
                    'rounded p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]',
                    isBookmarked
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground hover:bg-amber-500/10 hover:text-amber-600'
                  )}
                  onClick={handleBookmark}
                  aria-label={isBookmarked ? 'Remove saved post' : 'Save post'}
                  aria-pressed={isBookmarked}
                >
                  <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-[#52b274]/10 hover:text-[#2f6f4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] dark:hover:text-[#7fdc9c]"
                  onClick={handleShare}
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Title and quote open the post ── */}
        <h3 className="text-xl! leading-[1.25]! font-extrabold! tracking-[-0.02em]! break-words text-[var(--shell-ink)] decoration-[#52b274]/60 underline-offset-4 group-hover/card:underline sm:text-[23px]!">
          <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
        </h3>

        {/* Body preview: 3 lines / ~150 chars, no Show More (#474). Quote marks come from CSS. */}
        <div className="line-clamp-3 text-[14.5px] leading-[1.6] whitespace-pre-line text-[var(--shell-ink-2)] before:content-['\201C'] after:content-['\201D'] sm:text-base sm:leading-[1.65]">
          {displayText}
        </div>

        {attribution || citationUrl ? (
          <p className="-mt-1 text-[13px]! leading-normal! font-semibold text-[var(--shell-muted)]">
            {attribution ? <span>— {attribution}</span> : null}
            {attribution && citationUrl ? <span aria-hidden="true"> · </span> : null}
            {citationUrl ? (
              <a
                href={citationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                aria-label={`Source: ${getDomain(citationUrl)} (opens in a new tab)`}
                className="inline-flex items-center gap-1 text-[var(--shell-blue)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976d2]"
              >
                {getDomain(citationUrl)}
                <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
              </a>
            ) : null}
          </p>
        ) : null}

        {/* ── Votes, activity and the way into the post ── */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 border-t border-[var(--shell-divider)] pt-2.5 text-[12.5px] font-bold text-[var(--shell-ink-2)] sm:gap-x-[18px] sm:pt-3 sm:text-[13.5px]">
          <span className="inline-flex items-center gap-1 text-[var(--shell-green)]" data-testid="post-card-upvotes">
            <ArrowUp className="size-4" aria-hidden="true" />
            <span className="sr-only">Up votes:</span>
            {up}
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--shell-down)]" data-testid="post-card-downvotes">
            <ArrowDown className="size-4" aria-hidden="true" />
            <span className="sr-only">Down votes:</span>
            {down}
          </span>
          <span className="inline-flex items-center gap-1.5" data-testid="post-card-interactions">
            <MessagesSquare className="size-4" aria-hidden="true" />
            {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
          </span>
          <span
            className="ml-auto hidden items-center gap-1 text-[var(--shell-blue)] transition-transform group-hover/card:translate-x-0.5 sm:inline-flex"
            aria-hidden="true"
          >
            Open post
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>
    </article>
  )
}

const PostCard = memo(PostCardComponent)
export default PostCard
