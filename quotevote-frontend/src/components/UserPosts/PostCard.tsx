'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { PostCardProps } from '@/types/userPosts'
import { cn } from '@/lib/utils'

/**
 * PostCard Component
 * 
 * Placeholder component for displaying post cards.
 * This will be replaced when Post components are fully migrated.
 * 
 * @param post - Post data to display
 * @param index - Optional index for styling
 */
export function PostCard({ post, index }: PostCardProps) {
  const creator = post.creator
  const username = creator?.username || 'Unknown'
  const avatar = creator?.avatar || undefined
  const name = creator?.name || username

  // Format date
  const createdDate = post.created
    ? new Date(post.created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  // Get initials for avatar fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card
      className={cn(
        'w-full mb-4 transition-shadow hover:shadow-md',
        index !== undefined && index > 0 && '-mt-4'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {post.title || 'Untitled Post'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>{username}</span>
              {createdDate && (
                <>
                  <span>•</span>
                  <span>{createdDate}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {post.text && (
          <p className="text-sm text-foreground mb-4 line-clamp-3">
            {post.text}
          </p>
        )}
        {post.url && (
          <Link
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {post.url}
          </Link>
        )}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {post.upvotes !== null && post.upvotes !== undefined && (
            <span>↑ {post.upvotes}</span>
          )}
          {post.downvotes !== null && post.downvotes !== undefined && (
            <span>↓ {post.downvotes}</span>
          )}
          {post.comments && post.comments.length > 0 && (
            <span>💬 {post.comments.length}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

