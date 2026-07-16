'use client'

import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useResponsive } from '@/hooks/useResponsive'

export function SubmitPostSkeleton() {
  const { isMobile } = useResponsive()

  return (
    <Card
      className={cn(
        'flex h-full min-h-0 w-full flex-col gap-0 rounded-none border-0 py-0 shadow-none',
        !isMobile && 'sm:rounded-lg sm:border sm:shadow-sm'
      )}
    >
      <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <div className="shrink-0 border-b px-4 py-3">
        <Skeleton className="h-10 w-full" />
        <div className="mt-3 flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="min-h-0 flex-1 px-4 py-3">
        <Skeleton className="h-full min-h-48 w-full" />
      </div>
      <div className="shrink-0 space-y-3 border-t px-4 py-3">
        <Skeleton className="h-4 w-40" />
        <div className="space-y-4 rounded-md border border-border/60 bg-muted/30 p-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <CardFooter className="flex shrink-0 flex-col gap-3 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Skeleton className="h-11 w-full" />
      </CardFooter>
    </Card>
  )
}
