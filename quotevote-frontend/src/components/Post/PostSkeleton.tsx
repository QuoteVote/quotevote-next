'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * PostSkeleton Component
 * 
 * Loading skeleton for Post component.
 * Uses shadcn/ui Card and Skeleton components with Tailwind CSS.
 */
export default function PostSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-start gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="mt-4 flex flex-row items-center justify-start gap-2">
          <Skeleton className="h-6 w-8" />
          <span>/</span>
          <Skeleton className="h-6 w-8" />
        </div>
      </CardHeader>
      <CardHeader className="p-0 pl-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
      <div className="flex items-center gap-2 px-5 pb-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </Card>
  )
}

