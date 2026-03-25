"use client"

import { useEffect } from 'react'
import moment from 'moment'
import { MessageCircle } from 'lucide-react'
import Comment from './Comment'
import { CommentData } from '@/types/comment'

interface CommentListProps {
  comments?: CommentData[]
  loading?: boolean
  postUrl?: string
}

export default function CommentList({ comments = [], loading, postUrl }: CommentListProps) {
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
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="size-8 rounded-full bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!comments.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MessageCircle className="size-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">
          No comments yet. Start the conversation!
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border">
      {comments
        .slice()
        .sort((a, b) => moment(b.created).diff(moment(a.created)))
        .map((comment) => (
          <div
            id={comment._id}
            key={comment._id}
          >
            <Comment
              comment={comment}
              postUrl={postUrl}
              selected={typeof window !== 'undefined' && window.location.hash === `#${comment._id}`}
            />
          </div>
        ))}
    </div>
  )
}
