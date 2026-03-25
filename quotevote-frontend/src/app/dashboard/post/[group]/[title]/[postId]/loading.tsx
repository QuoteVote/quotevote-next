export default function PostLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-3xl mx-auto w-full animate-pulse">
      {/* Post header skeleton */}
      <div className="space-y-3">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
      </div>

      {/* Post body skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 w-full rounded bg-muted last:w-4/5" />
        ))}
      </div>

      {/* Vote/action bar skeleton */}
      <div className="flex gap-3">
        <div className="h-8 w-20 rounded-full bg-muted" />
        <div className="h-8 w-20 rounded-full bg-muted" />
        <div className="h-8 w-20 rounded-full bg-muted" />
      </div>

      {/* Comments skeleton */}
      <div className="space-y-3 pt-4">
        <div className="h-5 w-24 rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted" />
              <div className="h-3 w-20 rounded bg-muted" />
            </div>
            <div className="h-3 w-full rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
