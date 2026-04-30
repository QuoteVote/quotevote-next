'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationProps } from '@/types/components';
import { cn } from '@/lib/utils';

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
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [totalPages, maxVisiblePages, currentPage]);

  const showStartEllipsis = visiblePages[0]! > 1;
  const showEndEllipsis = visiblePages[visiblePages.length - 1]! < totalPages;

  const go = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || disabled) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  if (totalPages <= 1) return null;

  const btnBase =
    'flex items-center justify-center rounded-lg border border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium';
  const btnMd = cn(btnBase, 'size-9');

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-5">
      {/* Page info */}
      {showPageInfo && (
        <p className="text-xs text-muted-foreground tabular-nums">
          {startItem}–{endItem} of {totalCount.toLocaleString()} posts
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* First */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => go(1)}
            disabled={currentPage === 1 || disabled}
            aria-label="First page"
            className={btnMd}
          >
            <ChevronsLeft className="size-4" />
          </button>
        )}

        {/* Prev */}
        <button
          type="button"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Previous page"
          className={btnMd}
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Start ellipsis */}
        {showStartEllipsis && (
          <>
            <button type="button" onClick={() => go(1)} disabled={disabled} className={btnMd}>
              1
            </button>
            <span className="flex items-center justify-center size-9 text-xs text-muted-foreground select-none">
              …
            </span>
          </>
        )}

        {/* Page numbers */}
        {visiblePages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => go(page)}
            disabled={disabled}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              btnMd,
              page === currentPage
                ? 'bg-[#52b274] border-[#52b274] text-white hover:bg-[#3d9659] hover:border-[#3d9659]'
                : 'hover:bg-muted'
            )}
          >
            {page}
          </button>
        ))}

        {/* End ellipsis */}
        {showEndEllipsis && (
          <>
            <span className="flex items-center justify-center size-9 text-xs text-muted-foreground select-none">
              …
            </span>
            <button
              type="button"
              onClick={() => go(totalPages)}
              disabled={disabled}
              className={btnMd}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Next page"
          className={btnMd}
        >
          <ChevronRight className="size-4" />
        </button>

        {/* Last */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => go(totalPages)}
            disabled={currentPage === totalPages || disabled}
            aria-label="Last page"
            className={btnMd}
          >
            <ChevronsRight className="size-4" />
          </button>
        )}
      </div>

      {/* Mobile: compact page indicator */}
      <p className="sm:hidden text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}

// Mobile-only compact variant (prev / X of Y / next)
export function PaginationCompact({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'onPageChange' | 'disabled'>) {
  const go = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || disabled) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
      <button
        type="button"
        onClick={() => go(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="size-4" />
        Prev
      </button>
      <span className="text-xs text-muted-foreground tabular-nums">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => go(currentPage + 1)}
        disabled={currentPage === totalPages || disabled}
        className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
