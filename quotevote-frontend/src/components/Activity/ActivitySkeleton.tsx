'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * ActivitySkeleton Component
 * 
 * Loading skeleton for Activity components.
 * Uses shadcn/ui Card and Skeleton components with Tailwind CSS.
 */
export function ActivitySkeleton() {
  return (
    <Card className="min-w-[350px] min-h-[200px] rounded-md sm:max-w-full sm:min-w-full sm:w-full">
      <CardContent className="pt-6">
        <div className="flex gap-4 min-h-[130px]">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between items-center mb-2.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between pt-0">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-5 w-5" />
      </CardFooter>
    </Card>
  )
}

/**
 * ActivitySkeletonLoader Component
 * 
 * Displays multiple skeleton loaders for activities while data is loading.
 */
export function ActivitySkeletonLoader({ cols = 1 }: { cols?: number }) {
  return (
    <div className="w-full space-y-5">
      {Array.from({ length: cols }).map((_, index) => (
        <ActivitySkeleton key={`activity-skeleton-${index}`} />
      ))}
    </div>
  )
}

