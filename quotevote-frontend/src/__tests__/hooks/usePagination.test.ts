import { renderHook, act, waitFor } from '@testing-library/react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { usePagination, usePaginationWithFilters } from '@/hooks/usePagination'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
    usePathname: jest.fn(),
    useSearchParams: jest.fn(),
}))

describe('usePagination', () => {
    const mockPush = jest.fn()
    const mockPathname = '/test'
    let mockSearchParams: URLSearchParams

    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParams = new URLSearchParams()

        mockPush.mockImplementation((url: string) => {
            const urlObj = new URL(url, 'http://localhost')
            urlObj.searchParams.forEach((value, key) => {
                mockSearchParams.set(key, value)
            })
            // Also handle removals if needed, but for now just setting is enough for these tests
            // Actually, we should probably replace the params to be accurate
            const newParams = new URLSearchParams(urlObj.search)
            mockSearchParams = newParams
                ; (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
        })

            ; (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
            ; (usePathname as jest.Mock).mockReturnValue(mockPathname)
            ; (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    })

    it('should initialize with default values', () => {
        const { result } = renderHook(() => usePagination())

        expect(result.current.currentPage).toBe(1)
        expect(result.current.pageSize).toBe(20)
    })

    it('should initialize from URL parameters', () => {
        mockSearchParams.set('page', '3')
        mockSearchParams.set('page_size', '50')

        const { result } = renderHook(() => usePagination())

        expect(result.current.currentPage).toBe(3)
        expect(result.current.pageSize).toBe(50)
    })

    it('should handle page change', () => {
        const onPageChange = jest.fn()
        const { result } = renderHook(() => usePagination({ onPageChange }))

        act(() => {
            result.current.handlePageChange(2)
        })

        expect(result.current.currentPage).toBe(2)
        expect(onPageChange).toHaveBeenCalledWith(2)
        expect(mockPush).toHaveBeenCalledWith('/test?page=2', { scroll: false })
    })

    it('should handle page size change and reset to page 1', () => {
        const onPageSizeChange = jest.fn()
        const { result } = renderHook(() => usePagination({ onPageSizeChange }))

        // First go to page 2
        act(() => {
            result.current.handlePageChange(2)
        })

        // Then change page size
        act(() => {
            result.current.handlePageSizeChange(50)
        })

        expect(result.current.currentPage).toBe(1)
        expect(result.current.pageSize).toBe(50)
        expect(onPageSizeChange).toHaveBeenCalledWith(50)
    })

    it('should reset to first page', () => {
        const { result } = renderHook(() => usePagination())

        act(() => {
            result.current.handlePageChange(3)
        })

        act(() => {
            result.current.resetToFirstPage()
        })

        expect(result.current.currentPage).toBe(1)
    })

    it('should calculate pagination correctly', () => {
        const { result } = renderHook(() => usePagination({ defaultPageSize: 10 }))

        act(() => {
            result.current.handlePageChange(2)
        })

        const pagination = result.current.calculatePagination(45)

        expect(pagination).toEqual({
            currentPage: 2,
            totalPages: 5,
            totalCount: 45,
            pageSize: 10,
            hasNextPage: true,
            hasPreviousPage: true,
            startIndex: 10,
            endIndex: 20,
        })
    })

    it('should not update URL if page size is default', () => {
        const { result } = renderHook(() => usePagination({ defaultPageSize: 20 }))

        act(() => {
            result.current.handlePageSizeChange(20)
        })

        // Should not push since page size is default
        expect(mockPush).not.toHaveBeenCalled()
    })

    it('should use custom URL parameter names', () => {
        const { result } = renderHook(() =>
            usePagination({
                pageParam: 'p',
                pageSizeParam: 'size',
            })
        )

        act(() => {
            result.current.handlePageChange(3)
        })

        expect(mockPush).toHaveBeenCalledWith('/test?p=3', { scroll: false })
    })
})

describe('usePaginationWithFilters', () => {
    const mockPush = jest.fn()
    const mockPathname = '/test'
    let mockSearchParams: URLSearchParams

    beforeEach(() => {
        jest.clearAllMocks()
        mockSearchParams = new URLSearchParams()

        mockPush.mockImplementation((url: string) => {
            const urlObj = new URL(url, 'http://localhost')
            // Reset params from URL
            const newParams = new URLSearchParams(urlObj.search)
            mockSearchParams = newParams
                ; (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
        })

            ; (useRouter as jest.Mock).mockReturnValue({ push: mockPush })
            ; (usePathname as jest.Mock).mockReturnValue(mockPathname)
            ; (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    })

    it('should reset to page 1 when dependencies change', async () => {
        const { result, rerender } = renderHook(
            ({ deps }) => usePaginationWithFilters({}, deps),
            { initialProps: { deps: ['filter1'] } }
        )

        // Go to page 2
        act(() => {
            result.current.handlePageChange(2)
        })

        expect(result.current.currentPage).toBe(2)

        // Change dependencies
        rerender({ deps: ['filter2'] })

        await waitFor(() => {
            expect(result.current.currentPage).toBe(1)
        })
    })

    it('should not reset if resetOnFilterChange is false', async () => {
        const { result, rerender } = renderHook(
            ({ deps }) => usePaginationWithFilters({ resetOnFilterChange: false }, deps),
            { initialProps: { deps: ['filter1'] } }
        )

        act(() => {
            result.current.handlePageChange(2)
        })

        rerender({ deps: ['filter2'] })

        await waitFor(() => {
            expect(result.current.currentPage).toBe(2)
        })
    })
})
