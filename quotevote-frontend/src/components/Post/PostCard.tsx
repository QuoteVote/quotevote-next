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
import { UPDATE_POST_BOOKMARK } from '@/graphql/mutations'
import { toast } from 'sonner'
import getTopPostsVoteHighlights from '@/lib/utils/getTopPostsVoteHighlights'
import useGuestGuard from '@/hooks/useGuestGuard'
import HighlightText from '@/components/HighlightText/HighlightText'
import AvatarDisplay from '@/components/Avatar'
import type { PostCardProps } from '@/types/post'

const ACTIVITY_BORDER: Record<string, string> = {
  POSTED: '#56b3ff',
  COMMENTED: '#fdd835',
  UPVOTED: '#52b274',
  DOWNVOTED: '#ff6060',
  LIKED: '#56b3ff',
  QOUTED: '#e36dfa',
  QUOTED: '#e36dfa',
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
  activityType = 'POSTED',
  limitText = false,
  votes = [],
  comments = [],
  quotes = [],
  messageRoom,
  groupId,
  citationUrl,
  searchKey,
}: PostCardProps) {
  const router = useRouter()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const guestGuard = useGuestGuard()
  const [isExpanded, setIsExpanded] = useState(false)
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

  const postText = text || ''
  const contentLimit = limitText ? 20 : 200
  const isContentTruncated = postText.length > contentLimit
  const shouldShowButton = isContentTruncated && !limitText

  let displayText: string | React.ReactNode =
    isExpanded || !shouldShowButton ? postText : stringLimit(postText, contentLimit)

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
    comments.length + votes.length + quotes.length + messages.length

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
    if (guestGuard()) router.push(`/dashboard/profile/${uname}`)
  }

  const username = creator?.username || 'Anonymous'
  const upvoteCount = approvedBy?.length || 0
  const downvoteCount = rejectedBy?.length || 0
  const borderColor =
    ACTIVITY_BORDER[(activityType || 'POSTED').toUpperCase()] ?? '#56b3ff'

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
      className="group/card bg-card rounded-[7px] border border-border/60 cursor-pointer overflow-hidden transition-shadow duration-200 hover:shadow-[10px_7px_10px_0_rgba(82,178,116,0.15),_0_4px_20px_0_rgba(0,0,0,0.1)]"
      style={{ borderBottom: `10px solid ${borderColor}` }}
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
    >
      {/* ── Vote + interactions row ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-border/30">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50 text-sm">
            <span className="font-bold text-[#52b274]">↑</span>
            <span className="font-semibold tabular-nums text-foreground">{upvoteCount}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted/50 text-sm">
            <span className="font-bold text-[#ff6060]">↓</span>
            <span className="font-semibold tabular-nums text-foreground">{downvoteCount}</span>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted/30">
            {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}
          </span>
        </div>

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
      </div>

      {/* ── Main content ── */}
      <div className="px-4 pt-3 pb-3">
        {/* Title */}
        <h3 className="text-xl font-bold text-foreground leading-snug mb-2 break-words group-hover/card:text-[#52b274] transition-colors">
          <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
        </h3>

        {/* Badges: group + citation */}
        {(groupId && groupData?.group) || citationUrl ? (
          <div className="flex items-center flex-wrap gap-1.5 mb-3">
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
          </div>
        ) : null}

        {/* Body */}
        <div
          className={cn(
            'text-base text-muted-foreground leading-relaxed whitespace-pre-line',
            shouldShowButton && !isExpanded && 'line-clamp-4'
          )}
        >
          {displayText}
        </div>
        {shouldShowButton && (
          <button
            type="button"
            className="text-[#52b274] text-sm font-medium hover:underline mt-2"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>

      {/* ── Footer: avatar + username + date ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/30 bg-muted/10">
        <button
          type="button"
          className="flex items-center gap-2 group/author min-w-0"
          onClick={handleProfileClick}
        >
          <AvatarDisplay
            src={typeof creator?.avatar === 'string' ? creator.avatar : undefined}
            alt={username}
            size="sm"
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
