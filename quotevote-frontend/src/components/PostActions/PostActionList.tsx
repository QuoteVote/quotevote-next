'use client'

import { useEffect } from 'react'
import { isEmpty } from 'lodash'
import moment from 'moment'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import PostActionCard from './PostActionCard'
import { useAppStore } from '@/store'
import type { PostActionListProps } from '@/types/postActions'

export default function PostActionList({
  postActions,
  loading = false,
  postUrl = '',
  refetchPost,
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
        <div className="space-y-4">
          <Skeleton className="h-[118px] w-full" data-testid="skeleton-loader" />
          <Skeleton className="h-[118px] w-full" data-testid="skeleton-loader" />
          <Skeleton className="h-[118px] w-full" data-testid="skeleton-loader" />
        </div>
      )}

      {!isEmpty(sortedActions) ? (
        <ul className="space-y-4">
          {sortedActions.map((action) => (
            <li
              key={action._id}
              id={action._id}
              className="w-full"
            >
              <PostActionCard
                postAction={action}
                postUrl={postUrl}
                selected={`#${action._id}` === hash}
                refetchPost={refetchPost}
              />
            </li>
          ))}
        </ul>
      ) : (
        !loading && (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Start the discussion...
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}

