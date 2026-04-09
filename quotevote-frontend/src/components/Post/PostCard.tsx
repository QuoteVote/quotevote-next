'use client'

import { useState, memo } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery } from '@apollo/client/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Quote,
  ExternalLink,
  Bookmark,
  Share2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDomain } from '@/lib/utils/sanitizeUrl'
import { useAppStore } from '@/store'
import AvatarDisplay from '@/components/Avatar'
import { GET_GROUP } from '@/graphql/queries'
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
  bookmarkedBy: _bookmarkedBy = [],
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
  const name = creator?.name || username
  const avatar = creator?.avatar

  const upvoteCount = approvedBy?.length || 0
  const downvoteCount = rejectedBy?.length || 0
  const commentCount = comments?.length || 0
  const quoteCount = quotes?.length || 0

  return (
    <article
      className="px-4 py-4 border-l-4 border-primary/60 hover:bg-muted/30 hover:shadow-md transition-all duration-200 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
      onClick={handleCardClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(); } }}
      tabIndex={0}
      role="article"
      aria-label={title || 'Post'}
    >
      <div className="flex gap-3">
        {/* Avatar column */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleRedirectToProfile(username)
          }}
          className="flex-shrink-0 mt-0.5"
        >
          <Avatar className="size-10">
            <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              <AvatarDisplay
                size={40}
                src={typeof avatar === 'string' ? avatar : undefined}
                alt={name || username}
                fallback={name || username}
              />
            </AvatarFallback>
          </Avatar>
        </button>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Author line */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRedirectToProfile(username)
              }}
              className="inline-flex items-center gap-1.5 min-w-0 hover:underline"
            >
              <span className="text-[15px] font-bold text-foreground truncate">
                {name}
              </span>
              <span className="text-[15px] text-muted-foreground truncate">
                @{username}
              </span>
            </button>
            <span className="text-muted-foreground">·</span>
            <time className="text-sm text-muted-foreground whitespace-nowrap" suppressHydrationWarning>
              {moment(created).fromNow()}
            </time>
            {groupId && groupData?.group && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 text-primary border-primary/30 bg-primary/5 font-medium uppercase tracking-wider"
              >
                {groupData.group.title}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-semibold text-foreground mt-0.5 leading-snug">
            <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
          </h3>

          {/* Citation */}
          {citationUrl && (
            <a
              href={citationUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
            >
              <ExternalLink className="size-3" />
              {getDomain(citationUrl)}
            </a>
          )}

          {/* Body */}
          <div className="mt-1.5">
            <div
              className={cn(
                'text-[15px] text-foreground/90 leading-relaxed whitespace-pre-line',
                shouldShowButton && !isExpanded && 'line-clamp-4'
              )}
            >
              {displayText}
            </div>
            {shouldShowButton && (
              <button
                type="button"
                className="text-primary text-sm font-medium hover:underline mt-0.5"
                onClick={handleShowMoreToggle}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Show less content' : 'Show more content'}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>

          {/* Engagement actions — Twitter-style row */}
          <div className="flex items-center justify-between mt-3 max-w-md" role="group" aria-label="Post engagement">
            {/* Comments */}
            <button
              type="button"
              className="group flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${commentCount || 0} comments`}
            >
              <MessageCircle className="size-[18px] text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors tabular-nums" aria-hidden="true">
                {commentCount || ''}
              </span>
            </button>

            {/* Upvotes */}
            <button
              type="button"
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-green-500/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${upvoteCount || 0} upvotes`}
            >
              <ThumbsUp className="size-[18px] text-muted-foreground group-hover:text-green-600 group-hover:scale-110 transition-all duration-200" />
              <span className="text-xs text-muted-foreground group-hover:text-green-600 transition-colors tabular-nums" aria-hidden="true">
                {upvoteCount || ''}
              </span>
            </button>

            {/* Downvotes */}
            <button
              type="button"
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-red-500/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${downvoteCount || 0} downvotes`}
            >
              <ThumbsDown className="size-[18px] text-muted-foreground group-hover:text-red-500 group-hover:scale-110 transition-all duration-200" />
              <span className="text-xs text-muted-foreground group-hover:text-red-500 transition-colors tabular-nums" aria-hidden="true">
                {downvoteCount || ''}
              </span>
            </button>

            {/* Quotes */}
            <button
              type="button"
              className="group flex items-center gap-1.5 px-2 py-1.5 rounded-full hover:bg-purple-500/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label={`${quoteCount || 0} quotes`}
            >
              <Quote className="size-[18px] text-muted-foreground group-hover:text-purple-500 group-hover:scale-110 transition-all duration-200" />
              <span className="text-xs text-muted-foreground group-hover:text-purple-500 transition-colors tabular-nums" aria-hidden="true">
                {quoteCount || ''}
              </span>
            </button>

            {/* Bookmark */}
            <button
              type="button"
              className="group px-2 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="Bookmark"
            >
              <Bookmark className="size-[18px] text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
            </button>

            {/* Share */}
            <button
              type="button"
              className="group px-2 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
              onClick={(e) => e.stopPropagation()}
              aria-label="Share"
            >
              <Share2 className="size-[18px] text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-200" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}

const PostCard = memo(PostCardComponent)
export default PostCard
