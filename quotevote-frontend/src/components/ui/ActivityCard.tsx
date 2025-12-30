'use client'

import { memo } from 'react'
import moment from 'moment'
import { isEmpty } from 'lodash'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import Avatar from '@/components/Avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
    <div className="flex justify-between items-center mb-2.5 ml-5">
      <Button
        variant="ghost"
        className="h-auto p-0 text-base font-medium hover:underline"
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
  width,
  handleRedirectToProfile,
  username,
  post,
  activityType,
}: {
  date: string | number
  content: string
  avatar?: string | { src?: string; alt?: string }
  width?: 'lg' | 'md' | 'sm' | 'xl' | 'xs' | number
  handleRedirectToProfile?: (username: string) => void
  username: string
  post?: Partial<{ title?: string; [key: string]: unknown }>
  activityType?: string
}) {
  const numericWidth = typeof width === 'number' ? width : width === 'lg' || width === 'xl' ? 600 : 400
  const contentLength = numericWidth > 500 ? 1000 : 500
  const isPosted = activityType?.toUpperCase() === 'POSTED'
  const title = post?.title ? (isPosted ? post.title : post.title.substring(0, 100)) : ''
  
  const avatarSrc = typeof avatar === 'string' ? avatar : avatar?.src
  const avatarAlt = typeof avatar === 'string' ? undefined : avatar?.alt || username

  return (
    <div className="flex gap-4 min-h-[130px]">
      <Avatar
        src={avatarSrc}
        alt={avatarAlt || username}
        size={40}
        className="cursor-pointer shrink-0"
        onClick={(e) => {
          e.stopPropagation()
          if (handleRedirectToProfile) {
            handleRedirectToProfile(username)
          }
        }}
      />
      <div className="flex-1 min-w-0">
        <ActivityHeader
          name={username}
          date={date}
          handleRedirectToProfile={handleRedirectToProfile}
        />
        {isPosted && title && (
          <p className="ml-5 mb-2.5 text-base font-semibold cursor-pointer">
            {title}
          </p>
        )}
        {!isPosted && title && (
          <p className="ml-5 mb-2.5 text-base cursor-pointer">
            <span className="font-semibold">{activityType?.toUpperCase()}</span>
            {' on '}
            <span className="italic">{title}</span>
          </p>
        )}
        <p className="ml-5 mb-2.5 text-base cursor-pointer">
          &quot;{content.length > 1000 ? `${content.slice(0, contentLength)}...` : content}&quot;
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

  return (
    <Card
      className={cn(
        'min-w-[350px] min-h-[200px] rounded-md cursor-pointer transition-shadow hover:shadow-md',
        'sm:max-w-full sm:min-w-full sm:w-full'
      )}
      style={{
        backgroundColor: cardColor || '#FFF',
        width: typeof width === 'number' ? `${width}px` : '100%',
      }}
      onClick={onCardClick}
    >
      <CardContent className="pt-6">
        <ActivityContent
          date={date}
          content={content}
          avatar={avatar}
          width={width}
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

