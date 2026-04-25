'use client'

import { useEffect } from 'react'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { MessagesSquare } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import PostActionCard from './PostActionCard'
import { useAppStore } from '@/store'
import type { PostActionListProps } from '@/types/postActions'

export default function PostActionList({
  postActions,
  loading = false,
  postUrl = '',
  refetchPost,
  postOwnerId,
}: PostActionListProps) {
  const setFocusedComment = useAppStore((state) => state.setFocusedComment)
  const setSharedComment = useAppStore((state) => state.setSharedComment)

  // Extract hash from URL if present
  const hash = typeof window !== 'undefined' ? window.location.hash : ''

  useEffect(() => {
    if (!hash) {
      setFocusedComment(null)
      setSharedComment(null)
    }
    if (!loading && postActions.length && hash) {
      const elementId = hash.replace('#', '')
      const element = document.getElementById(elementId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [hash, loading, postActions, setFocusedComment, setSharedComment])

  // Sort actions by creation date
  const sortedActions = [...postActions].sort((a, b) => {
    const dateA = moment(a.created)
    const dateB = moment(b.created)
    return dateA.diff(dateB)
  })

  return (
    <div className="w-full">
      {loading && (
        <div className="divide-y divide-border/60">
          <Skeleton className="h-[80px] w-full rounded-none" data-testid="skeleton-loader" />
          <Skeleton className="h-[80px] w-full rounded-none" data-testid="skeleton-loader" />
          <Skeleton className="h-[80px] w-full rounded-none" data-testid="skeleton-loader" />
        </div>
      )}

      {!isEmpty(sortedActions) ? (
        <div className="divide-y divide-border/60">
          {sortedActions.map((action) => (
            <div key={action._id} id={action._id}>
              <PostActionCard
                postAction={action}
                postUrl={postUrl}
                selected={`#${action._id}` === hash}
                refetchPost={refetchPost}
                postOwnerId={postOwnerId}
              />
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MessagesSquare className="size-10 text-muted-foreground/20" />
            <div>
              <p className="text-sm font-medium text-muted-foreground/50">No activity yet</p>
              <p className="text-xs text-muted-foreground/35 mt-0.5">Be the first to vote, comment, or quote</p>
            </div>
          </div>
        )
      )}
    </div>
  )
}

