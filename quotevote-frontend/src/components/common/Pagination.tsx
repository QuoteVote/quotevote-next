'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationProps } from '@/types/components';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Pagination Component
 * 
 * A pagination component with page numbers, navigation buttons, and page info.
 * Replaces Material UI components with shadcn/ui Button and Tailwind CSS.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  showPageInfo = true,
  showFirstLast = true,
  maxVisiblePages = 5,
  disabled = false,
}: PaginationProps) {
  const [isChangingPage, setIsChangingPage] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate visible page numbers
  const visiblePages = useMemo(() => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }, [totalPages, maxVisiblePages, currentPage]);

  const showStartEllipsis = visiblePages[0]! > 1;
  const showEndEllipsis = visiblePages[visiblePages.length - 1]! < totalPages;

  // Reset loading state after timeout or when currentPage changes
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If we're in a changing state, set a timeout to reset it
    if (isChangingPage) {
      timeoutRef.current = setTimeout(() => {
        setIsChangingPage(false);
      }, 2000);
    }

    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isChangingPage, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !disabled) {
      setIsChangingPage(true);
      onPageChange(page);
    }
  };

  const getPageInfo = () => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);
    return `${startItem}-${endItem} of ${totalCount}`;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-6 gap-2 flex-wrap w-full max-w-full overflow-x-hidden box-border sm:p-4 sm:gap-1">
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-center gap-2 flex-wrap w-full">
        {/* First Page Button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || disabled || isChangingPage}
            aria-label="Go to first page"
            className="min-w-9 h-9 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous Page Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled || isChangingPage}
          aria-label="Go to previous page"
          className="min-w-9 h-9 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {/* Start Ellipsis */}
          {showStartEllipsis && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={disabled || isChangingPage}
                aria-label="Go to page 1"
                className="min-w-9 h-9 rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                1
              </Button>
              <div className="flex items-center justify-center min-w-9 h-9 text-[#999] text-xs font-medium">
                ...
              </div>
            </>
          )}

          {/* Visible Page Numbers */}
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageChange(page)}
              disabled={disabled || isChangingPage}
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={cn(
                'min-w-9 h-9 rounded-lg text-xs font-medium transition-all shadow-sm',
                page === currentPage
                  ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:-translate-y-0.5'
                  : 'hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
              )}
            >
              {page}
            </Button>
          ))}

          {/* End Ellipsis */}
          {showEndEllipsis && (
            <>
              <div className="flex items-center justify-center min-w-9 h-9 text-[#999] text-xs font-medium">
                ...
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={disabled || isChangingPage}
                aria-label={`Go to page ${totalPages}`}
                className="min-w-9 h-9 rounded-lg text-xs font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        {/* Next Page Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled || isChangingPage}
          aria-label="Go to next page"
          className="min-w-9 h-9 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page Button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || disabled || isChangingPage}
            aria-label="Go to last page"
            className="min-w-9 h-9 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}

        {/* Page Info */}
        {showPageInfo && (
          <div className="flex items-center gap-4 mx-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              {getPageInfo()}
            </span>
          </div>
        )}

        {/* Loading Indicator */}
        {isChangingPage && (
          <div className="flex items-center ml-4 bg-[var(--color-primary)] px-3 py-1.5 rounded-md border border-[var(--color-primary)]/80">
            <div className="animate-spin rounded-full border-2 border-white border-t-transparent h-4.5 w-4.5" />
            <span className="ml-2 text-xs text-white font-medium">Loading...</span>
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="flex sm:hidden flex-col items-center gap-1 w-full">
        {/* Navigation Row */}
        <div className="flex items-center gap-1 mb-1">
          {/* First Page Button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1 || disabled || isChangingPage}
              aria-label="Go to first page"
              className="min-w-8 h-8 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || disabled || isChangingPage}
            aria-label="Go to previous page"
            className="min-w-8 h-8 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-0.5">
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
                disabled={disabled || isChangingPage}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
                className={cn(
                  'min-w-8 h-8 rounded-lg text-xs font-medium transition-all shadow-sm',
                  page === currentPage
                    ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 hover:shadow-lg hover:-translate-y-0.5'
                    : 'hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                )}
              >
                {page}
              </Button>
            ))}
          </div>

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || disabled || isChangingPage}
            aria-label="Go to next page"
            className="min-w-8 h-8 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>

          {/* Last Page Button */}
          {showFirstLast && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages || disabled || isChangingPage}
              aria-label="Go to last page"
              className="min-w-8 h-8 rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Page Info Row */}
        <div className="flex justify-center items-center">
          <span className="text-xs text-[var(--color-text-secondary)]">
            Page {currentPage} of {totalPages}
          </span>
          {isChangingPage && (
            <div className="flex items-center ml-2 bg-[var(--color-primary)] px-2 py-1 rounded-md border border-[var(--color-primary)]/80">
              <div className="animate-spin rounded-full border-2 border-white border-t-transparent h-3.5 w-3.5" />
              <span className="ml-1.5 text-xs text-white font-medium">Loading...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

