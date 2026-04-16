'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery, useMutation } from '@apollo/client/react'
import { Badge } from '@/components/ui/badge'
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageCircle,
  Quote,
  ExternalLink,
  Bookmark,
  Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDomain } from '@/lib/utils/sanitizeUrl'
import { useAppStore } from '@/store'
import { GET_GROUP } from '@/graphql/queries'
import { UPDATE_POST_BOOKMARK } from '@/graphql/mutations'
import { toast } from 'sonner'
import getTopPostsVoteHighlights from '@/lib/utils/getTopPostsVoteHighlights'
import useGuestGuard from '@/hooks/useGuestGuard'
import HighlightText from '@/components/HighlightText/HighlightText'
import type { PostCardProps } from '@/types/post'

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
  searchKey,
}: PostCardProps) {
  const router = useRouter()
  const setSelectedPost = useAppStore((state) => state.setSelectedPost)
  const guestGuard = useGuestGuard()
  const [isExpanded, setIsExpanded] = useState(false)
  const userId = useAppStore((state) => state.user.data?._id || state.user.data?.id) as string | undefined

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
    const postUrl = url ? `${window.location.origin}${url.replace(/\?/g, '')}` : window.location.href
    await navigator.clipboard.writeText(postUrl)
    toast.success('Link copied!')
  }

  const postText = text || ''
  const contentLimit = limitText ? 20 : 280
  const isContentTruncated = postText && postText.length > contentLimit
  const shouldShowButton = isContentTruncated && !limitText

  let displayText: string | React.ReactNode = isExpanded || !shouldShowButton
    ? postText
    : stringLimit(postText, contentLimit)

  const interactions: unknown[] = []

  if (!isEmpty(votes)) {
    const mappedVotes = votes
      .filter((vote) => vote.startWordIndex != null && vote.endWordIndex != null)
      .map((vote) => ({
        startWordIndex: vote.startWordIndex ?? 0,
        endWordIndex: vote.endWordIndex ?? 0,
        type: vote.type ?? undefined,
        up: vote.type?.toUpperCase() === 'UP' || vote.type?.toUpperCase() === 'UPVOTE' ? 1 : 0,
        down: vote.type?.toUpperCase() === 'DOWN' || vote.type?.toUpperCase() === 'DOWNVOTE' ? 1 : 0,
      }))
    displayText = getTopPostsVoteHighlights(mappedVotes, displayText, postText)
  }

  const messages = messageRoom && 'messages' in messageRoom
    ? (messageRoom as { messages?: unknown[] }).messages || []
    : []

  void [...interactions, ...comments, ...votes, ...quotes, ...messages]

  const handleRedirectToProfile = (username?: string | null) => {
    if (!username) return
    if (guestGuard()) {
      router.push(`/dashboard/profile/${username}`)
    }
  }

  const { data: groupData } = useQuery<{
    group?: { _id: string; title: string }
  }>(GET_GROUP, {
    variables: { groupId: groupId || '' },
    skip: !groupId,
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
  })

  const handleCardClick = () => {
    setSelectedPost(_id)
    if (url) {
      router.push(url.replace(/\?/g, ''))
    }
  }

  const handleShowMoreToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  const username = creator?.username || 'Anonymous'

  const upvoteCount = approvedBy?.length || 0
  const downvoteCount = rejectedBy?.length || 0
  const netVotes = upvoteCount - downvoteCount
  const commentCount = comments?.length || 0
  const quoteCount = quotes?.length || 0

  return (
    <article
      className="group/card flex bg-card hover:bg-accent/30 border-b border-border/40 transition-colors duration-150 cursor-pointer"
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      tabIndex={0}
      role="article"
      aria-label={title || 'Post'}
    >
      {/* Vote column */}
      <div
        className="flex flex-col items-center py-4 px-2 sm:px-3 gap-0.5 flex-shrink-0 select-none"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className={cn(
            'p-0.5 rounded-md transition-colors',
            upvoteCount > 0
              ? 'text-[var(--color-upvote)]'
              : 'text-muted-foreground/50 hover:text-[var(--color-upvote)] hover:bg-[var(--color-upvote)]/10'
          )}
          aria-label={`${upvoteCount} upvotes`}
        >
          <ArrowBigUp className="size-6" strokeWidth={1.5} />
        </button>
        <span
          className={cn(
            'text-xs font-bold tabular-nums leading-none',
            netVotes > 0 && 'text-[var(--color-upvote)]',
            netVotes < 0 && 'text-[var(--color-downvote)]',
            netVotes === 0 && 'text-muted-foreground/70'
          )}
        >
          {netVotes}
        </span>
        <button
          type="button"
          className={cn(
            'p-0.5 rounded-md transition-colors',
            downvoteCount > 0
              ? 'text-[var(--color-downvote)]'
              : 'text-muted-foreground/50 hover:text-[var(--color-downvote)] hover:bg-[var(--color-downvote)]/10'
          )}
          aria-label={`${downvoteCount} downvotes`}
        >
          <ArrowBigDown className="size-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0 py-3.5 pr-4">
        {/* Meta line: author + group + time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mb-1">
          {groupId && groupData?.group && (
            <>
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-[17px] font-semibold bg-[var(--color-primary)]/8 text-[var(--color-primary)] border-0 rounded-sm"
              >
                {groupData.group.title}
              </Badge>
              <span className="text-muted-foreground/30">|</span>
            </>
          )}
          <span className="text-muted-foreground/60">Posted by</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleRedirectToProfile(username)
            }}
            className="font-medium text-muted-foreground hover:text-[var(--color-primary)] hover:underline transition-colors"
          >
            @{username}
          </button>
          <span className="text-muted-foreground/30">·</span>
          <time className="whitespace-nowrap text-muted-foreground/50" suppressHydrationWarning>
            {moment(created).fromNow()}
          </time>
        </div>

        {/* Title */}
        <h3 className="text-[9px] font-medium text-foreground leading-snug mb-1 group-hover/card:text-[var(--color-primary)] transition-colors">
          <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
        </h3>

        {/* Citation */}
        {citationUrl && (
          <a
            href={citationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-[var(--color-primary)]/70 hover:text-[var(--color-primary)] hover:underline mb-1 transition-colors"
          >
            <ExternalLink className="size-3" />
            {getDomain(citationUrl)}
          </a>
        )}

        {/* Body */}
        <div className="mt-0.5">
          <div
            className={cn(
              'text-[13px] text-foreground/70 leading-[1.65] whitespace-pre-line',
              shouldShowButton && !isExpanded && 'line-clamp-3'
            )}
          >
            {displayText}
          </div>
          {shouldShowButton && (
            <button
              type="button"
              className="text-[var(--color-primary)] text-[12px] font-semibold hover:underline mt-0.5"
              onClick={handleShowMoreToggle}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Show less content' : 'Show more content'}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center gap-1 mt-2.5 -ml-1.5" role="group" aria-label="Post engagement">
          <button
            type="button"
            className="group/btn inline-flex items-center gap-1 px-2 py-1 rounded-sm text-muted-foreground/60 hover:text-[var(--color-info)] hover:bg-[var(--color-info)]/8 text-xs transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={`${commentCount || 0} comments`}
          >
            <MessageCircle className="size-3.5" />
            <span className="font-medium tabular-nums">{commentCount}</span>
            <span className="hidden sm:inline">Comments</span>
          </button>

          <button
            type="button"
            className="group/btn inline-flex items-center gap-1 px-2 py-1 rounded-sm text-muted-foreground/60 hover:text-[var(--color-quoted)] hover:bg-[var(--color-quoted)]/8 text-xs transition-colors"
            onClick={(e) => e.stopPropagation()}
            aria-label={`${quoteCount || 0} quotes`}
          >
            <Quote className="size-3.5" />
            <span className="font-medium tabular-nums">{quoteCount}</span>
            <span className="hidden sm:inline">Quotes</span>
          </button>

          <button
            type="button"
            className={cn(
              "group/btn inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs transition-colors",
              isBookmarked
                ? "text-[var(--color-warning)]"
                : "text-muted-foreground/60 hover:text-[var(--color-warning)] hover:bg-[var(--color-warning)]/8"
            )}
            onClick={handleBookmark}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark className="size-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            className="group/btn inline-flex items-center gap-1 px-2 py-1 rounded-sm text-muted-foreground/60 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/8 text-xs transition-colors"
            onClick={handleShare}
            aria-label="Share"
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>
    </article>
  )
}

const PostCard = memo(PostCardComponent)
export default PostCard
