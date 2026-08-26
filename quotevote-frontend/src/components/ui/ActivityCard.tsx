'use client'

import { memo } from 'react'
import moment from 'moment'
import { isEmpty } from 'lodash'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { DisplayAvatar } from '@/components/DisplayAvatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  STANDARD_POST_CARD_THEME,
  isPostedActivityType,
} from '@/lib/constants/postCardTheme'
import type { ActivityCardProps } from '@/types/activity'

function ActivityHeader({
  name,
  date,
  handleRedirectToProfile,
}: {
  name: string
  date: string | number
  handleRedirectToProfile?: (username: string) => void
}) {
  const formattedDate = moment(date).calendar(null, {
    sameDay: '[Today]',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd',
    lastDay: '[Yesterday]',
    lastWeek: '[Last] dddd',
    sameElse: 'MMM DD, YYYY',
  })
  const time = moment(date).format('h:mm A')

  return (
    <div
      data-testid="activity-header"
      className="flex flex-col items-start gap-0.5 mb-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
    >
      <Button
        variant="ghost"
        className="h-10 px-0 py-0 text-base font-medium hover:underline"
        onClick={(e) => {
          e.stopPropagation()
          if (handleRedirectToProfile) {
            handleRedirectToProfile(name)
          }
        }}
      >
        {name}
      </Button>
      <span className="text-sm text-muted-foreground">
        {formattedDate} @ {time}
      </span>
    </div>
  )
}

function ActivityContent({
  date,
  content,
  avatar,
  handleRedirectToProfile,
  username,
  post,
  activityType,
}: {
  date: string | number
  content: string
  avatar?: string | Record<string, unknown> | { src?: string; alt?: string }
  handleRedirectToProfile?: (username: string) => void
  username: string
  post?: Partial<{ title?: string; [key: string]: unknown }>
  activityType?: string
}) {
  const PREVIEW_CHAR_LIMIT = 150
  const isPosted = activityType?.toUpperCase() === 'POSTED'
  const title = post?.title ? (isPosted ? post.title : post.title.substring(0, 100)) : ''

  // Legacy ActivityCard shape used `{ src, alt }`; API avatars are URLs or qualities objects.
  const isLegacyAvatarShape =
    typeof avatar === 'object' &&
    avatar !== null &&
    ('src' in avatar || 'alt' in avatar) &&
    !('topType' in avatar) &&
    !('url' in avatar)
  const avatarValue = isLegacyAvatarShape
    ? (avatar as { src?: string }).src
    : (avatar as string | Record<string, unknown> | undefined)

  return (
    <div data-testid="activity-content" className="flex items-start gap-3 min-h-[130px]">
      <button
        type="button"
        className="cursor-pointer shrink-0 rounded-full leading-none"
        onClick={(e) => {
          e.stopPropagation()
          if (handleRedirectToProfile) {
            handleRedirectToProfile(username)
          }
        }}
      >
        <DisplayAvatar avatar={avatarValue} username={username} size={40} />
      </button>
      <div className="flex-1 min-w-0">
        <ActivityHeader
          name={username}
          date={date}
          handleRedirectToProfile={handleRedirectToProfile}
        />
        {isPosted && title && (
          <p className="mb-2.5 text-base font-semibold cursor-pointer">
            {title}
          </p>
        )}
        {!isPosted && title && (
          <p className="mb-2.5 text-base cursor-pointer">
            <span className="font-semibold">{activityType?.toUpperCase()}</span>
            {' on '}
            <span className="italic">{title}</span>
          </p>
        )}
        <p className="ml-5 mb-2.5 text-base cursor-pointer line-clamp-3">
          &quot;{content.length > PREVIEW_CHAR_LIMIT ? `${content.slice(0, PREVIEW_CHAR_LIMIT)}...` : content}&quot;
        </p>
      </div>
    </div>
  )
}

function ActivityActions({
  liked,
  onLike,
  interactions,
}: {
  liked?: boolean
  onLike?: (liked: boolean, event: React.MouseEvent) => void
  interactions: unknown[]
}) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <span className="text-sm text-muted-foreground">{interactions.length}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-auto w-auto p-0"
        onClick={(e) => {
          e.stopPropagation()
          if (onLike) {
            onLike(liked || false, e)
          }
        }}
        aria-label={liked ? 'Unbookmark' : 'Bookmark'}
      >
        {liked ? (
          <BookmarkCheck className="size-5" />
        ) : (
          <Bookmark className="size-5" />
        )}
      </Button>
    </div>
  )
}

export const ActivityCard = memo(function ActivityCard({
  avatar = '',
  cardColor,
  name: _name = 'Username',
  username,
  date,
  content = '',
  comments = [],
  quotes = [],
  messages = [],
  votes = [],
  liked = false,
  width,
  onLike = () => {},
  onCardClick = () => {},
  handleRedirectToProfile = () => {},
  post = {},
  activityType = '',
}: ActivityCardProps) {
  // name prop is kept for API compatibility but username is used for display
  void _name
  const interactions: unknown[] = []
  // RC1-028 / #380: POSTED cards use the same blue chrome as feed PostCards.
  // Colored fills stay for voted/commented/quoted activity only.
  const isPosted = isPostedActivityType(activityType)

  if (!isEmpty(comments)) {
    interactions.push(...comments)
  }

  if (!isEmpty(votes)) {
    interactions.push(...votes)
  }

  if (!isEmpty(quotes)) {
    interactions.push(...quotes)
  }

  if (!isEmpty(messages)) {
    interactions.push(...messages)
  }

  // ponytail: apply cardColor directly on Card style for profile activity context
  return (
    <Card
      data-chrome={isPosted ? 'standard-blue' : 'activity'}
      className={cn(
        'min-w-[350px] min-h-[200px] cursor-pointer text-neutral-900',
        'sm:max-w-full sm:min-w-full sm:w-full',
        isPosted
          ? 'rounded-[7px] overflow-hidden bg-card border-0 shadow-none'
          : 'rounded-md border transition-shadow hover:shadow-md'
      )}
      style={{
        backgroundColor: isPosted ? undefined : cardColor || '#FFFFFF',
        width: typeof width === 'number' ? `${width}px` : '100%',
        ...(isPosted
          ? {
              border: `2px solid ${STANDARD_POST_CARD_THEME.borderColor}`,
              borderBottom: `8px solid ${STANDARD_POST_CARD_THEME.borderColor}`,
              boxShadow: STANDARD_POST_CARD_THEME.shadow,
              transition: 'box-shadow 0.15s ease, transform 0.15s ease',
            }
          : {}),
      }}
      onMouseEnter={
        isPosted
          ? (e) => {
              e.currentTarget.style.boxShadow = STANDARD_POST_CARD_THEME.hoverShadow
              e.currentTarget.style.transform = 'translate(-2px, -2px)'
            }
          : undefined
      }
      onMouseLeave={
        isPosted
          ? (e) => {
              e.currentTarget.style.boxShadow = STANDARD_POST_CARD_THEME.shadow
              e.currentTarget.style.transform = ''
            }
          : undefined
      }
      onClick={onCardClick}
    >
      <CardContent className="pt-1">
        <ActivityContent
          date={date}
          content={content}
          avatar={avatar}
          username={username}
          handleRedirectToProfile={handleRedirectToProfile}
          post={post ? { ...post, title: post.title ?? undefined } : undefined}
          activityType={activityType}
        />
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0">
        <ActivityActions
          interactions={interactions}
          liked={liked}
          onLike={onLike}
        />
      </CardFooter>
    </Card>
  )
})


