'use client';

import type { StickyPaginationWrapperProps } from '@/types/components';
import { cn } from '@/lib/utils';

/**
 * StickyPaginationWrapper Component
 * 
 * Wrapper component that provides sticky pagination at the bottom.
 * This ensures pagination is always visible regardless of content length.
 * Replaces Material UI Box with Tailwind CSS styling.
 */
export function StickyPaginationWrapper({
  children,
  pagination,
  className,
}: StickyPaginationWrapperProps) {
  return (
    <div className={cn('flex flex-col min-h-screen relative', className)}>
      {/* Main content */}
      <div className="flex-1 pb-48 mb-8 overflow-auto w-full max-w-full overflow-x-hidden box-border">
        {children}
      </div>
      
      {/* Sticky pagination */}
      {pagination && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[var(--color-gray-light)]/50 z-[1000] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-6 w-full max-w-full overflow-x-hidden box-border sm:p-4">
          {pagination}
        </div>
      )}
    </div>
  );
}

