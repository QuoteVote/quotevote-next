"use client"

import { useState, useEffect, useMemo } from 'react'
import moment from 'moment'
import { MessageCircle, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import Comment from './Comment'
import { CommentData } from '@/types/comment'

type SortMode = 'newest' | 'oldest' | 'reactions'

const SORT_LABELS: Record<SortMode, string> = {
  newest: 'Newest',
  oldest: 'Oldest',
  reactions: 'Most Reactions',
}

const STORAGE_KEY = 'qv-comment-sort'

function getStoredSort(): SortMode {
  if (typeof window === 'undefined') return 'newest'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'newest' || stored === 'oldest' || stored === 'reactions') return stored
  return 'newest'
}

interface CommentListProps {
  comments?: CommentData[]
  loading?: boolean
  postUrl?: string
}

export default function CommentList({ comments = [], loading, postUrl }: CommentListProps) {
  const [sortMode, setSortMode] = useState<SortMode>(getStoredSort)

  const handleSortChange = (mode: SortMode) => {
    setSortMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }

  useEffect(() => {
    const hash = window.location.hash
    if (!loading && comments.length && hash) {
      const element = document.getElementById(hash.replace('#', ''))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [loading, comments])

  const sortedComments = useMemo(() => {
    const list = comments.slice()
    switch (sortMode) {
      case 'oldest':
        return list.sort((a, b) => moment(a.created).diff(moment(b.created)))
      case 'reactions': {
        return list.sort((a, b) => {
          const aReactions = Array.isArray(a.reaction) ? a.reaction.length : 0
          const bReactions = Array.isArray(b.reaction) ? b.reaction.length : 0
          return bReactions - aReactions
        })
      }
      case 'newest':
      default:
        return list.sort((a, b) => moment(b.created).diff(moment(a.created)))
    }
  }, [comments, sortMode])

  if (loading) {
    return (
      <div className="space-y-4" aria-busy={true}>
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
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
        <MessageCircle className="size-10 text-muted-foreground/30 mb-3 animate-bounce" style={{ animationDuration: '2s' }} />
        <p className="text-sm font-medium text-foreground mb-1">No comments yet</p>
        <p className="text-xs text-muted-foreground">
          Be the first to share your thoughts!
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort control */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">{comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 rounded-full">
              <ArrowUpDown className="size-3" />
              {SORT_LABELS[sortMode]}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {(Object.keys(SORT_LABELS) as SortMode[]).map((mode) => (
              <DropdownMenuItem
                key={mode}
                onClick={() => handleSortChange(mode)}
                className={sortMode === mode ? 'bg-muted font-medium' : ''}
              >
                {SORT_LABELS[mode]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Comment list */}
      <div className="divide-y divide-border" role="list" aria-label="Comments">
        {sortedComments.map((comment) => (
          <div
            id={comment._id}
            key={comment._id}
            role="listitem"
          >
            <Comment
              comment={comment}
              postUrl={postUrl}
              selected={typeof window !== 'undefined' && window.location.hash === `#${comment._id}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
