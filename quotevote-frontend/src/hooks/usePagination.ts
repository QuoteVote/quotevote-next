'use client'

import { useState, useEffect, useCallback, startTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import type {
    PaginationOptions,
    UsePaginationReturn,
    PaginationCalculation,
} from '@/types/hooks'

/**
 * Custom hook for managing pagination state with URL synchronization
 * Uses Next.js App Router navigation APIs (useRouter, usePathname, useSearchParams)
 */
export const usePagination = ({
    defaultPage = 1,
    defaultPageSize = 20,
    pageParam = 'page',
    pageSizeParam = 'page_size',
    onPageChange,
    onPageSizeChange,
    resetOnFilterChange: _resetOnFilterChange = true, // Used by usePaginationWithFilters
}: PaginationOptions = {}): UsePaginationReturn => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Parse URL parameters
    const urlPage = parseInt(searchParams.get(pageParam) ?? '', 10)
    const urlPageSize = parseInt(searchParams.get(pageSizeParam) ?? '', 10)

    // Initialize state from URL or defaults
    const [currentPage, setCurrentPage] = useState<number>(
        urlPage && urlPage > 0 ? urlPage : defaultPage
    )
    const [pageSize, setPageSize] = useState<number>(
        urlPageSize && urlPageSize > 0 ? urlPageSize : defaultPageSize
    )

    // Update URL when pagination changes
    const updateURL = useCallback(
        (page: number, size: number): void => {
            const params = new URLSearchParams(searchParams.toString())

            // Always set page parameter to preserve it in URL
            params.set(pageParam, page.toString())

            // Update page size parameter (only if different from default)
            if (size !== defaultPageSize) {
                params.set(pageSizeParam, size.toString())
            } else {
                params.delete(pageSizeParam)
            }

            // Update URL without triggering a page reload
            const newSearch = params.toString()
            const newURL = `${pathname}${newSearch ? `?${newSearch}` : ''}`

            router.push(newURL, { scroll: false })
        },
        [router, pathname, searchParams, pageParam, pageSizeParam, defaultPageSize]
    )

    // Handle page change
    const handlePageChange = useCallback(
        (page: number): void => {
            if (page !== currentPage) {
                setCurrentPage(page)
                updateURL(page, pageSize)
                onPageChange?.(page)
            }
        },
        [currentPage, pageSize, updateURL, onPageChange]
    )

    // Handle page size change
    const handlePageSizeChange = useCallback(
        (size: number): void => {
            if (size !== pageSize) {
                setPageSize(size)
                setCurrentPage(1) // Reset to first page when page size changes
                updateURL(1, size)
                onPageSizeChange?.(size)
            }
        },
        [pageSize, updateURL, onPageSizeChange]
    )

    // Reset to first page (useful when filters change)
    const resetToFirstPage = useCallback((): void => {
        if (currentPage !== 1) {
            setCurrentPage(1)
            updateURL(1, pageSize)
            onPageChange?.(1)
        }
    }, [currentPage, pageSize, updateURL, onPageChange])

    // Sync with URL changes (browser back/forward)
    useEffect(() => {
        const newUrlPage = parseInt(searchParams.get(pageParam) ?? '', 10)
        const newUrlPageSize = parseInt(searchParams.get(pageSizeParam) ?? '', 10)

        // Update page if URL has a valid page number and it's different from current
        if (newUrlPage && newUrlPage > 0 && newUrlPage !== currentPage) {
            startTransition(() => {
                setCurrentPage(newUrlPage)
                onPageChange?.(newUrlPage)
            })
        }
        // If URL doesn't have a page parameter but we're not on page 1, reset to page 1
        else if (!newUrlPage && currentPage !== 1) {
            startTransition(() => {
                setCurrentPage(1)
                onPageChange?.(1)
            })
        }

        // Update page size if URL has a valid page size and it's different from current
        if (newUrlPageSize && newUrlPageSize > 0 && newUrlPageSize !== pageSize) {
            startTransition(() => {
                setPageSize(newUrlPageSize)
                onPageSizeChange?.(newUrlPageSize)
            })
        }
    }, [searchParams, pageParam, pageSizeParam, currentPage, pageSize, onPageChange, onPageSizeChange])

    // Calculate pagination values
    const calculatePagination = useCallback(
        (totalCount: number): PaginationCalculation => {
            const totalPages = Math.ceil(totalCount / pageSize)
            const normalizedPage = Math.min(Math.max(currentPage, 1), totalPages || 1)

            return {
                currentPage: normalizedPage,
                totalPages: Math.max(totalPages, 1),
                totalCount,
                pageSize,
                hasNextPage: normalizedPage < totalPages,
                hasPreviousPage: normalizedPage > 1,
                startIndex: (normalizedPage - 1) * pageSize,
                endIndex: Math.min(normalizedPage * pageSize, totalCount),
            }
        },
        [currentPage, pageSize]
    )

    return {
        currentPage,
        pageSize,
        handlePageChange,
        handlePageSizeChange,
        resetToFirstPage,
        calculatePagination,
        // Legacy support for existing code
        setCurrentPage: handlePageChange,
        setPageSize: handlePageSizeChange,
    }
}

/**
 * Hook for managing pagination with filter synchronization
 * Automatically resets to page 1 when filters change
 */
export const usePaginationWithFilters = (
    paginationOptions: PaginationOptions = {},
    dependencies: unknown[] = []
): UsePaginationReturn => {
    const pagination = usePagination(paginationOptions)
    const [previousDependencies, setPreviousDependencies] = useState<unknown[]>(dependencies)

    // Reset to first page when dependencies (filters) change
    useEffect(() => {
        // Only reset if dependencies actually changed (not on initial mount)
        const dependenciesChanged = dependencies.some((dep, index) => dep !== previousDependencies[index])

        if (dependenciesChanged && paginationOptions.resetOnFilterChange !== false) {
            pagination.resetToFirstPage()
        }

        setPreviousDependencies(dependencies)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, dependencies)

    return pagination
}

export default usePagination
