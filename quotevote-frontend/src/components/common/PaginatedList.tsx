'use client';

import type { PaginatedListProps } from '@/types/components';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from './Pagination';
import { StickyPaginationWrapper } from './StickyPaginationWrapper';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * PaginatedList Component
 * 
 * Higher-order component for paginated lists.
 * Handles pagination state, loading, and error states.
 * Replaces Material UI components with Tailwind CSS and shadcn/ui.
 */
export function PaginatedList<T = unknown>({
  // Data props
  data,
  loading,
  error,
  totalCount,
  
  // Pagination props
  defaultPageSize = 20,
  pageParam = 'page',
  pageSizeParam = 'page_size',
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  
  // Render props
  renderItem,
  renderEmpty,
  renderError,
  renderLoading,
  
  // Callbacks
  onPageChange,
  onPageSizeChange,
  onRefresh,
  
  // Styling
  className,
  contentClassName,
  // paginationClassName is reserved for future use
  paginationClassName: _paginationClassName,
  // Other props
  children,
  ...otherProps
}: PaginatedListProps<T>) {
  const pagination = usePagination({
    defaultPageSize,
    pageParam,
    pageSizeParam,
    onPageChange,
    onPageSizeChange,
  });

  const paginationData = pagination.calculatePagination(totalCount || 0);

  // Always show pagination if there are multiple pages, regardless of loading/error/empty states
  const shouldShowPagination = paginationData.totalPages > 1;

  // Create pagination component - always show if there are multiple pages
  const paginationComponent = shouldShowPagination ? (
    <Pagination
      currentPage={paginationData.currentPage}
      totalPages={paginationData.totalPages}
      totalCount={paginationData.totalCount}
      pageSize={paginationData.pageSize}
      onPageChange={pagination.handlePageChange}
      showPageInfo={showPageInfo}
      showFirstLast={showFirstLast}
      maxVisiblePages={maxVisiblePages}
      disabled={false} // Never disable pagination - let it handle its own loading state
    />
  ) : null;

  return (
    <StickyPaginationWrapper 
      className={className} 
      pagination={paginationComponent}
      {...otherProps}
    >
      {/* Content */}
      <div className={cn('relative', contentClassName)}>
        {/* Handle loading state */}
        {loading && (!data || data.length === 0) ? (
          renderLoading ? (
            renderLoading()
          ) : (
            <div className="flex justify-center items-center p-16 min-h-[200px]">
              <div className="w-full max-w-[600px]">
                <div className="h-[200px] rounded-lg bg-[var(--color-gray-light)] animate-pulse" />
              </div>
            </div>
          )
        ) : error ? (
          /* Handle error state */
          renderError ? (
            renderError(error, onRefresh)
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center min-h-[200px] text-[var(--color-destructive)]">
              <h3 className="text-lg font-semibold mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                {error.message || 'An error occurred while loading the data.'}
              </p>
              {onRefresh && (
                <Button
                  onClick={onRefresh}
                  className="mt-4 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90"
                >
                  Try Again
                </Button>
              )}
            </div>
          )
        ) : !loading && (!data || data.length === 0) ? (
          /* Handle empty state - only show when not loading and no data */
          renderEmpty ? (
            renderEmpty()
          ) : (
            <div className="flex flex-col items-center justify-center p-16 text-center min-h-[200px]">
              <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">
                No items found
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Try adjusting your search or filters
              </p>
            </div>
          )
        ) : (
          /* Show content */
          children || data?.map((item, index) => renderItem?.(item, index))
        )}

        {/* Subtle top-bar while re-fetching with existing results visible */}
        {loading && data && data.length > 0 && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-20 bg-primary/20 overflow-hidden">
            <div className="h-full bg-primary animate-pulse" />
          </div>
        )}
      </div>
    </StickyPaginationWrapper>
  );
}

