'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { useQuery } from '@apollo/client/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import AvatarDisplay from '@/components/Avatar'
import { GET_GROUP } from '@/graphql/queries'
import getTopPostsVoteHighlights from '@/lib/utils/getTopPostsVoteHighlights'
import useGuestGuard from '@/hooks/useGuestGuard'
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
    POSTED: 'border-l-4 border-l-[#56b3ff]',
    COMMENTED: 'border-l-4 border-l-[#fdd835]',
    UPVOTED: 'border-l-4 border-l-[#52b274]',
    DOWNVOTED: 'border-l-4 border-l-[#ff6060]',
    LIKED: 'border-l-4 border-l-[#56b3ff]',
    QOUTED: 'border-l-4 border-l-[#e36dfa]',
  }
  return bgMap[activityType.toUpperCase()] || bgMap.POSTED
}

export default function PostCard({
  _id,
  text,
  title,
  url,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  const cardBgClass = getCardBgClass(activityType)

  const handleRedirectToProfile = (username?: string | null) => {
    if (!username) return
    if (guestGuard()) {
      router.push(`/Profile/${username}`)
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

  return (
    <Card
      className={cn(
        'rounded-lg border cursor-pointer transition-shadow hover:shadow-lg',
        cardBgClass
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4 pb-3 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
              <ArrowUp className="h-4 w-4 text-[#52b274]" />
              <span className="text-sm font-medium">{approvedBy?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-muted">
              <ArrowDown className="h-4 w-4 text-[#ff6060]" />
              <span className="text-sm font-medium">{rejectedBy?.length || 0}</span>
            </div>
          </div>
          <div className="px-2 py-1 rounded bg-muted text-sm text-muted-foreground">
            {interactions.length} interactions
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-foreground cursor-pointer break-words">
              {title || 'Untitled'}
            </h3>
            {groupId && (
              <span className="text-xs text-[#52b274] font-semibold px-2 py-1 rounded-full bg-[#52b274]/10 border border-[#52b274]/20 uppercase tracking-wide">
                {groupData?.group 
                  ? groupData.group.title 
                  : groupLoading 
                    ? 'Loading...'
                    : groupError 
                      ? '#GROUP'
                      : ''
                }
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div
              className={cn(
                'text-base text-foreground leading-relaxed',
                shouldShowButton && !isExpanded && 'line-clamp-4'
              )}
            >
              {displayText}
            </div>
            {shouldShowButton && (
              <Button
                variant="ghost"
                className="text-[#52b274] hover:text-[#52b274] hover:underline p-0 h-auto font-medium"
                onClick={handleShowMoreToggle}
              >
                {isExpanded ? 'Show Less' : 'Show More'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            handleRedirectToProfile(username)
          }}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={typeof avatar === 'string' ? avatar : undefined} />
            <AvatarFallback>
              <AvatarDisplay
                size={32}
                src={typeof avatar === 'string' ? avatar : undefined}
                alt={name || username}
                fallback={name || username}
              />
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-bold text-foreground">{username}</span>
        </button>
        <span className="text-muted-foreground">|</span>
        <span className="text-xs text-muted-foreground">
          {moment(created).calendar(null, {
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            nextWeek: 'dddd',
            lastDay: '[Yesterday]',
            lastWeek: '[Last] dddd',
            sameElse: 'MMM DD, YYYY',
          })}
          {` @ ${moment(created).format('h:mm A')}`}
        </span>
      </div>
    </Card>
  )
}

