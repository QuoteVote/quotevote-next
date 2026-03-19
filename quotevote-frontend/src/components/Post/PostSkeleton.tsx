'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * PostSkeleton Component
 *
 * Loading skeleton that matches the redesigned PostCard layout:
 * Author row at top, title, body text, then engagement bar.
 */
export default function PostSkeleton() {
  return (
    <Card className="bg-card rounded-xl border border-border py-0 gap-0">
      <CardContent className="p-4 pb-0">
        {/* Author row skeleton */}
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Title skeleton */}
        <div className="flex items-start gap-2 mb-2">
          <Skeleton className="h-6 w-3/4" />
        </div>

        {/* Body text skeleton */}
        <div className="mt-1 mb-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>

      {/* Engagement bar skeleton */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        <div className="flex items-center gap-5">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-4 w-10" />
      </div>
    </Card>
  )
}
