// src/components/ui/Post/PostSkeleton.tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { JSX } from 'react';

/**
 * Loading skeleton for Post component
 * Displays placeholder content while posts are loading
 */
export function PostSkeleton(): JSX.Element {
  return (
    <Card className="mb-4">
      {/* Header with controls */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-48 mr-2" />
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-7 w-7 rounded-full" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Skeleton className="h-5 w-8" />
            <span className="text-xs text-muted-foreground">/</span>
            <Skeleton className="h-5 w-8" />
          </div>
        </div>
      </CardHeader>

      {/* Avatar and user info */}
      <div className="px-6 pb-2 flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>

      {/* Content */}
      <CardContent className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-1/2" />
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex items-center gap-2 pl-2 pr-2">
        <Skeleton className="h-8 w-32 mr-2" />
        <Skeleton className="h-8 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </CardFooter>
    </Card>
  );
}

export default PostSkeleton;
