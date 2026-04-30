'use client';

import type { StickyPaginationWrapperProps } from '@/types/components';
import { cn } from '@/lib/utils';

export function StickyPaginationWrapper({
  children,
  pagination,
  className,
}: StickyPaginationWrapperProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex-1">
        {children}
      </div>
      {pagination && (
        <div className="border-t border-border/40">
          {pagination}
        </div>
      )}
    </div>
  );
}
