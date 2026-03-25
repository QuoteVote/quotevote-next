'use client'

export default function PostSkeleton() {
  return (
    <div className="px-4 py-4 animate-pulse">
      <div className="flex gap-3">
        <div className="size-10 rounded-full bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2.5">
          {/* Author line */}
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-24 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-3 w-14 rounded bg-muted" />
          </div>
          {/* Title */}
          <div className="h-4 w-4/5 rounded bg-muted" />
          {/* Body lines */}
          <div className="space-y-1.5">
            <div className="h-3.5 w-full rounded bg-muted" />
            <div className="h-3.5 w-full rounded bg-muted" />
            <div className="h-3.5 w-3/4 rounded bg-muted" />
          </div>
          {/* Action bar */}
          <div className="flex items-center gap-6 pt-1">
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
            <div className="h-4 w-10 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
