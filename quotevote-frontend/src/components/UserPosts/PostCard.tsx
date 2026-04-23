'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DisplayAvatar } from '@/components/DisplayAvatar'
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

  // Format date
  const createdDate = post.created
    ? new Date(post.created).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  return (
    <Card
      className={cn(
        'w-full mb-4 transition-shadow hover:shadow-md',
        index !== undefined && index > 0 && '-mt-4'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <DisplayAvatar
            avatar={creator?.avatar as string | Record<string, unknown> | undefined}
            username={username}
            size={40}
          />
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

