"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Create quote while the tags load: the composer's shape, field by field. */
export function SubmitPostSkeleton() {
  return (
    <div className="qv-compose-form" aria-busy="true" aria-label="Loading the composer">
      <Card className="qv-compose-main gap-0 rounded-none border-0 py-0 shadow-none">
        <div className="qv-compose-head">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="size-10 rounded-md" />
        </div>
        <div className="qv-compose-body">
          <Skeleton className="h-4 w-64" />
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-36 w-full sm:h-48" />
          </div>
          <Skeleton className="h-28 w-full" />
        </div>
        <div className="qv-compose-foot">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-11 w-24" />
        </div>
      </Card>
      <div className="qv-compose-preview">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}
