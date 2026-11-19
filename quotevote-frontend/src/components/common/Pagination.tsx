'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PaginationProps } from '@/types/components';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';

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
  itemLabel = 'posts',
}: PaginationProps) {
  const isMobile = useIsMobile();
  const pageWindow = isMobile ? Math.min(maxVisiblePages, 3) : maxVisiblePages;

  const visiblePages = useMemo(() => {
    if (totalPages <= pageWindow) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const half = Math.floor(pageWindow / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + pageWindow - 1);
    if (end - start + 1 < pageWindow) {
      start = Math.max(1, end - pageWindow + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [totalPages, pageWindow, currentPage]);

  const showStartEllipsis = visiblePages[0]! > 1;
  const showEndEllipsis = visiblePages[visiblePages.length - 1]! < totalPages;
  // First/last chevrons already jump to the ends — skip extra 1 / last number chips.
  const showEdgePageNumbers = !showFirstLast;

  const go = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || disabled) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  if (totalPages <= 1) return null;

  // The design's pager (redesign): range and progress on the left, controls on the right.
  const iconBtn = 'qv-pub-pg-icon focus-visible:ring-2 focus-visible:ring-[var(--shell-blue)]';
  const navBtn =
    'qv-auth-btn h-10! rounded-[12px] px-2.5! focus-visible:ring-2 focus-visible:ring-[var(--shell-blue)] disabled:opacity-40';
  const pageBtn = 'qv-pub-pg focus-visible:ring-2 focus-visible:ring-[var(--shell-blue)]';
  const progress = totalCount > 0 ? Math.max(2, Math.min(100, (endItem / totalCount) * 100)) : 0;

  return (
    <nav
      aria-label="Pagination"
      data-testid="pagination"
      className="qv-auth qv-pub qv-pub-pager mx-4 my-4 min-w-0 max-w-full flex-wrap overflow-x-hidden bg-[var(--shell-surface)]! font-redesign sm:mx-0"
    >
      {showPageInfo && (
        <span className="flex min-w-[96px] flex-col gap-[7px] text-[13px] font-semibold text-[var(--shell-muted)] sm:min-w-[170px]">
          <span className="tabular-nums" data-testid="pagination-range">
            <b className="text-[var(--shell-ink)]">
              {startItem}–{endItem}
            </b>{' '}
            of {totalCount.toLocaleString()}
            {itemLabel ? ` ${itemLabel}` : ''}
          </span>
          <span className="qv-inv-track hidden sm:block" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </span>
        </span>
      )}

      <div data-testid="pagination-controls" className="ml-auto flex max-w-full flex-wrap items-center gap-1.5">
        {showFirstLast && (
          <button
            type="button"
            onClick={() => go(1)}
            disabled={currentPage === 1 || disabled}
            aria-label="First page"
            className={cn(iconBtn, 'max-sm:hidden!')}
          >
            <ChevronsLeft className="size-[18px]" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          onClick={() => go(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          aria-label="Previous page"
          className={navBtn}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </button>

        <div className="qv-pub-pg-nums">
          {showStartEllipsis && (
            <>
              {showEdgePageNumbers && (
                <button type="button" onClick={() => go(1)} disabled={disabled} className={pageBtn} aria-label="Page 1">
                  1
                </button>
              )}
              <span className="qv-pub-pg-gap select-none" aria-hidden="true">
                …
              </span>
            </>
          )}

          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => go(page)}
              disabled={disabled}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
              className={pageBtn}
            >
              {page}
            </button>
          ))}

          {showEndEllipsis && (
            <>
              <span className="qv-pub-pg-gap select-none" aria-hidden="true">
                …
              </span>
              {showEdgePageNumbers && (
                <button
                  type="button"
                  onClick={() => go(totalPages)}
                  disabled={disabled}
                  className={pageBtn}
                  aria-label={`Page ${totalPages}`}
                >
                  {totalPages}
                </button>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => go(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          aria-label="Next page"
          className={navBtn}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </button>

        {showFirstLast && (
          <button
            type="button"
            onClick={() => go(totalPages)}
            disabled={currentPage === totalPages || disabled}
            aria-label="Last page"
            className={cn(iconBtn, 'max-sm:hidden!')}
          >
            <ChevronsRight className="size-[18px]" aria-hidden="true" />
          </button>
        )}
      </div>
    </nav>
  );
}

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
        className="flex min-h-9 items-center gap-1 rounded-md px-2 -mx-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]"
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
        className="flex min-h-9 items-center gap-1 rounded-md px-2 -mx-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b274]"
      >
        Next
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
