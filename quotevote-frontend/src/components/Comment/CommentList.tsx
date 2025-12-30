"use client"

import { useEffect } from 'react'
import { Filter } from '@/components/Icons'
import moment from 'moment'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Comment from './Comment'
import { CommentData } from '@/types/comment'
import { cn } from '@/lib/utils'

interface CommentListProps {
  comments?: CommentData[]
  loading?: boolean
  postUrl?: string
}

export default function CommentList({ comments = [], loading, postUrl }: CommentListProps) {
  // Hash handling in Next.js app router is done via window.location usually or searching params if appropriate.
  // We'll trust the classic window logic since hash isn't a search param.
  
  useEffect(() => {
    const hash = window.location.hash
    if (!loading && comments.length && hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [loading, comments])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comments</h3>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl bg-black/5 hover:bg-black/10 hover:scale-105 transition-all shadow-sm"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {comments && comments.length > 0 ? (
        <div className={cn(
          "flex flex-col gap-2 w-full mt-2",
          comments.length > 2 && "max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-rounded-md"
        )}>
          {comments
            .slice() // create copy to sort
            .sort((a, b) => moment(b.created).diff(moment(a.created)))
            .map((comment) => (
              <div
                id={comment._id}
                key={comment._id}
                className="w-full"
              >
                <Comment
                  comment={comment}
                  postUrl={postUrl}
                  selected={typeof window !== 'undefined' && window.location.hash === `#${comment._id}`}
                />
              </div>
            ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Start the discussion...
          </CardContent>
        </Card>
      )}
    </div>
  )
}
