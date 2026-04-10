'use client'

export default function PostSkeleton() {
  return (
    <div className="flex bg-card border-b border-border/40 animate-pulse">
      {/* Vote column skeleton */}
      <div className="flex flex-col items-center py-4 px-2 sm:px-3 gap-1.5 flex-shrink-0">
        <div className="size-6 rounded bg-muted/40" />
        <div className="h-3 w-4 rounded bg-muted/30" />
        <div className="size-6 rounded bg-muted/40" />
      </div>

      {/* Content skeleton */}
      <div className="flex-1 py-3.5 pr-4 space-y-2.5">
        {/* Meta line */}
        <div className="flex items-center gap-2">
          <div className="h-[17px] w-16 rounded-sm bg-muted/50" />
          <div className="h-3 w-20 rounded bg-muted/30" />
          <div className="h-3 w-14 rounded bg-muted/20" />
        </div>
        {/* Title */}
        <div className="h-4 w-4/5 rounded bg-muted/60" />
        {/* Body lines */}
        <div className="space-y-1.5 pt-0.5">
          <div className="h-3 w-full rounded bg-muted/40" />
          <div className="h-3 w-full rounded bg-muted/40" />
          <div className="h-3 w-2/3 rounded bg-muted/25" />
        </div>
        {/* Action bar */}
        <div className="flex items-center gap-3 pt-1">
          <div className="h-5 w-20 rounded-sm bg-muted/25" />
          <div className="h-5 w-16 rounded-sm bg-muted/25" />
          <div className="h-5 w-12 rounded-sm bg-muted/25" />
        </div>
      </div>
    </div>
  )
}
