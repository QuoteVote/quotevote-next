export default function ExploreLoading() {
  return (
    <div className="-mx-4 -mt-6">
      {/* Search bar skeleton */}
      <div className="border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="h-10 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>

      {/* Quick action pills skeleton */}
      <div className="border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
          ))}
        </div>
      </div>

      {/* Tab bar skeleton */}
      <div className="border-b border-border px-4">
        <div className="max-w-2xl mx-auto flex gap-6 py-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-16 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>

      {/* Feed skeleton */}
      <div className="max-w-2xl mx-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-border px-4 py-5 space-y-3 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-muted flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-28 rounded bg-muted" />
                <div className="h-3 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-2 pl-[52px]">
              <div className="h-4 w-4/5 rounded bg-muted" />
              <div className="h-3.5 w-full rounded bg-muted" />
              <div className="h-3.5 w-3/4 rounded bg-muted" />
            </div>
            <div className="flex gap-6 pl-[52px] pt-1">
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
