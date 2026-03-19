'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery } from '@apollo/client/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Quote,
  Eye,
  ExternalLink,
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

/**
 * Helper function to limit string length
 */
function stringLimit(text: string, limit: number): string {
  if (!text || text.length <= limit) return text
  return text.slice(0, limit) + '...'
}

/**
 * Get card background color class based on activity type
 */
function getCardBgClass(activityType: string = 'POSTED'): string {
  const bgMap: Record<string, string> = {
    POSTED: 'border-l-4 border-l-blue-400',
    COMMENTED: 'border-l-4 border-l-yellow-400',
    UPVOTED: 'border-l-4 border-l-primary',
    DOWNVOTED: 'border-l-4 border-l-destructive',
    LIKED: 'border-l-4 border-l-blue-400',
    QOUTED: 'border-l-4 border-l-purple-400',
  }
  return bgMap[activityType.toUpperCase()] || bgMap.POSTED
}

export default function PostCard({
  _id,
  text,
  title,
  url,
  bookmarkedBy: _bookmarkedBy = [],
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

  const postText = text || ''
  const contentLimit = limitText ? 20 : 200
  const isContentTruncated = postText && postText.length > contentLimit
  const shouldShowButton = isContentTruncated && !limitText

  // Determine what text to show based on expanded state
  let displayText: string | React.ReactNode = isExpanded || !shouldShowButton
    ? postText
    : stringLimit(postText, contentLimit)

  let interactions: unknown[] = []

  if (!isEmpty(comments)) {
    interactions = interactions.concat(comments)
  }

  if (!isEmpty(votes)) {
    interactions = interactions.concat(votes)
    // Map PostVote[] to Vote[] format expected by getTopPostsVoteHighlights
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

  if (!isEmpty(quotes)) {
    interactions = interactions.concat(quotes)
  }

  const messages = messageRoom && 'messages' in messageRoom
    ? (messageRoom as { messages?: unknown[] }).messages || []
    : []
  if (!isEmpty(messages)) {
    interactions = interactions.concat(messages)
  }

  const handleRedirectToProfile = (username?: string | null) => {
    if (!username) return
    if (guestGuard()) {
      router.push(`/dashboard/profile/${username}`)
    }
  }

  const { data: groupData, loading: groupLoading, error: groupError } = useQuery<{
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

  // Keep getCardBgClass reference alive (used by activity feed consumers)
  void getCardBgClass
  void activityType

  return (
    <Card
      className={cn(
        'bg-card rounded-xl border border-border',
        'cursor-pointer hover:bg-accent/50',
        'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
        'py-0 gap-0'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 pb-0">
        {/* Author row — Twitter style */}
        <div className="flex items-center gap-3 mb-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleRedirectToProfile(username)
            }}
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} />
              <AvatarFallback>
                <AvatarDisplay
                  size={40}
                  src={typeof avatar === 'string' ? avatar : undefined}
                  alt={name || username}
                  fallback={name || username}
                />
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleRedirectToProfile(username)
              }}
              className="flex items-center gap-1.5 min-w-0 hover:underline"
            >
              <span className="text-sm font-bold text-foreground truncate">
                {name}
              </span>
              <span className="text-sm text-muted-foreground truncate">
                @{username}
              </span>
            </button>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
              {moment(created).fromNow()}
            </span>
          </div>
        </div>

        {/* Title + group badge */}
        <div className="flex items-start gap-2 mb-1">
          <h3 className="text-lg font-semibold text-foreground break-words min-w-0 flex-1">
            <HighlightText text={title || 'Untitled'} highlightTerms={searchKey || ''} />
          </h3>
          {groupId && (
            <Badge
              variant="outline"
              className="text-primary border-primary/30 bg-primary/10 text-xs font-medium uppercase tracking-wide flex-shrink-0 mt-0.5"
            >
              {groupData?.group
                ? groupData.group.title
                : groupLoading
                  ? 'Loading...'
                  : groupError
                    ? '#GROUP'
                    : ''
              }
            </Badge>
          )}
        </div>

        {/* Citation link badge */}
        {citationUrl && (
          <a
            href={citationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-2.5 py-1 rounded-full bg-muted border border-border hover:text-primary hover:border-primary/30 transition-colors w-fit mb-2"
          >
            <ExternalLink className="h-3 w-3" />
            {getDomain(citationUrl)}
          </a>
        )}

        {/* Post body text */}
        <div className="mt-1 mb-3">
          <div
            className={cn(
              'text-base text-foreground/90 leading-relaxed',
              shouldShowButton && !isExpanded && 'line-clamp-4'
            )}
          >
            {displayText}
          </div>
          {shouldShowButton && (
            <Button
              variant="ghost"
              className="text-primary hover:text-primary hover:bg-transparent hover:underline p-0 h-auto font-medium text-sm mt-1"
              onClick={handleShowMoreToggle}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>
      </CardContent>

      {/* Engagement bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-5">
          {/* Upvotes */}
          <div className="flex items-center gap-1.5 group">
            <ThumbsUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              {approvedBy?.length || 0}
            </span>
          </div>

          {/* Downvotes */}
          <div className="flex items-center gap-1.5 group">
            <ThumbsDown className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-destructive transition-colors">
              {rejectedBy?.length || 0}
            </span>
          </div>

          {/* Comments */}
          <div className="flex items-center gap-1.5 group">
            <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              {comments?.length || 0}
            </span>
          </div>

          {/* Quotes */}
          <div className="flex items-center gap-1.5 group">
            <Quote className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
              {quotes?.length || 0}
            </span>
          </div>
        </div>

        {/* Total interactions */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Eye className="h-4 w-4" />
          <span className="text-sm">{interactions.length}</span>
        </div>
      </div>
    </Card>
  )
}
