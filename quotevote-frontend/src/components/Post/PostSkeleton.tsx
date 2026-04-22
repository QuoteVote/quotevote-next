'use client'

export default function PostSkeleton() {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-card rounded-[7px] border border-border/60 overflow-hidden animate-pulse"
          style={{ borderBottom: '10px solid #e2e8f0' }}
        >
          {/* Vote row skeleton */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-border/30">
            <div className="flex items-center gap-2">
              <div className="h-6 w-12 rounded bg-muted/50" />
              <div className="h-6 w-12 rounded bg-muted/50" />
              <div className="h-6 w-24 rounded bg-muted/30" />
            </div>
            <div className="flex gap-1">
              <div className="size-7 rounded bg-muted/30" />
              <div className="size-7 rounded bg-muted/30" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="px-4 pt-3 pb-3 space-y-3">
            {/* Title */}
            <div className="space-y-1.5">
              <div className="h-5 w-4/5 rounded bg-muted/60" />
              <div className="h-5 w-3/5 rounded bg-muted/40" />
            </div>
            {/* Badge */}
            <div className="h-5 w-20 rounded-full bg-muted/40" />
            {/* Body */}
            <div className="space-y-2 pt-1">
              <div className="h-4 w-full rounded bg-muted/40" />
              <div className="h-4 w-full rounded bg-muted/40" />
              <div className="h-4 w-full rounded bg-muted/40" />
              <div className="h-4 w-2/3 rounded bg-muted/25" />
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-border/30 bg-muted/10">
            <div className="size-8 rounded-full bg-muted/50" />
            <div className="h-4 w-24 rounded bg-muted/40" />
            <div className="h-3 w-3 rounded bg-muted/20" />
            <div className="h-3 w-32 rounded bg-muted/25" />
          </div>
        </div>
      ))}
    </div>
  )
}
