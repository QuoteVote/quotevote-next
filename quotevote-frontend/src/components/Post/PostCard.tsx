'use client'

import { memo, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery, useMutation } from '@apollo/client/react'
import { ArrowRight, Bookmark, ExternalLink, Hash, MessagesSquare, Share2 } from 'lucide-react'
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
      className={cn(
        'group/card rounded-[7px] cursor-pointer overflow-hidden bg-card',
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
      <div className={cn('px-4 pt-3', compact ? 'pb-2' : 'pb-3')}>
        {/* ── Tag + source on the left, save/share on the right (#528) ── */}
        {tagTitle || citationUrl || !compact ? (
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {tagTitle && (
                <button
                  type="button"
                  data-testid="post-card-tag"
                  aria-label={`Show posts tagged #${tagTitle}`}
                  title={`Show posts tagged #${tagTitle}`}
                  onClick={handleTagClick}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="inline-flex min-h-6 items-center gap-0.5 rounded-full border border-[rgba(82,178,116,0.4)] bg-[rgba(82,178,116,0.12)] px-2.5 py-1 text-xs font-semibold leading-none text-[#2f6f4a] transition-colors hover:bg-[rgba(82,178,116,0.24)] active:bg-[rgba(82,178,116,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-1 dark:text-[#7fdc9c]"
                >
                  <Hash className="size-3" aria-hidden="true" />
                  {tagTitle}
                </button>
              )}
              {citationUrl && (
                <a
                  href={citationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  aria-label={`Source: ${getDomain(citationUrl)} (opens in a new tab)`}
                  className="inline-flex min-h-6 items-center gap-1 rounded-full border border-[rgba(25,118,210,0.25)] bg-[rgba(25,118,210,0.08)] px-2.5 py-1 text-[11px] font-medium leading-none text-[#1565c0] transition-colors hover:bg-[rgba(25,118,210,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1976d2] focus-visible:ring-offset-1 dark:text-[#64b5f6]"
                >
                  <span>Source: {getDomain(citationUrl)}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                </a>
              )}
            </div>

            {!compact && (
              <div
                className="-mr-1.5 -mt-1 flex shrink-0 items-center gap-0.5"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className={cn(
                    'p-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]',
                    isBookmarked
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10'
                  )}
                  onClick={handleBookmark}
                  aria-label={isBookmarked ? 'Remove saved post' : 'Save post'}
                  aria-pressed={isBookmarked}
                >
                  <Bookmark className="size-4" fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded text-muted-foreground hover:text-[#2f6f4a] hover:bg-[#52b274]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] dark:hover:text-[#7fdc9c]"
                  onClick={handleShare}
                  aria-label="Share"
                >
                  <Share2 className="size-4" />
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* ── Title and preview open the post ── */}
        <h3
          className={cn(
            'font-bold text-foreground leading-snug mb-1.5 break-words decoration-[#52b274]/60 underline-offset-4 transition-colors group-hover/card:text-[#52b274] group-hover/card:underline',
            compact ? 'text-lg' : 'text-xl'
          )}
        >
          <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
        </h3>

        {compact && attribution ? (
          <p className="mb-1 text-xs italic text-muted-foreground">— {attribution}</p>
        ) : null}

        {/* Body preview: 3 lines / ~150 chars, no Show More (#474). */}
        <div
          className={cn(
            'text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-3',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {displayText}
        </div>
      </div>

      {/* ── Footer: author and time, then activity and the way into the post ── */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 border-t border-border/30 bg-muted/10">
        <button
          type="button"
          className="flex items-center gap-2 group/author min-w-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274] focus-visible:ring-offset-1"
          onClick={handleProfileClick}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DisplayAvatar
            avatar={creator?.avatar as string | Record<string, unknown> | undefined}
            username={avatarSeed}
            size={28}
          />
          <span className="text-sm font-bold text-[#2f7a4c] group-hover/author:underline truncate dark:text-[#6fcf8f]">
            {username}
          </span>
        </button>
        <span className="text-muted-foreground/40 flex-shrink-0" aria-hidden="true">
          ·
        </span>
        <time className="text-xs text-muted-foreground flex-shrink-0" suppressHydrationWarning>
          {formattedDate}
        </time>

        <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span
            className="inline-flex items-center gap-1"
            data-testid="post-card-interactions"
          >
            <MessagesSquare className="size-3.5" aria-hidden="true" />
            {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
          </span>
          <span
            className="hidden items-center gap-0.5 font-semibold text-[#2f6f4a] transition-transform group-hover/card:translate-x-0.5 sm:inline-flex dark:text-[#7fdc9c]"
            aria-hidden="true"
          >
            Open post
            <ArrowRight className="size-3.5" />
          </span>
        </span>
      </div>
    </article>
  )
}

const PostCard = memo(PostCardComponent)
export default PostCard
