export default function SearchLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      {/* Search bar skeleton */}
      <div className="h-10 w-full animate-pulse rounded-md bg-muted" />

      {/* Post card skeletons */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
          <div className="h-3 w-5/6 rounded bg-muted" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-16 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
