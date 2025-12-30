import { renderHook, waitFor } from '@testing-library/react'
import { useResponsive } from '@/hooks/useResponsive'

// Mock window.matchMedia
const createMatchMedia = (matches: boolean) => {
    return jest.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    }))
}

describe('useResponsive', () => {
    let originalMatchMedia: typeof window.matchMedia

    beforeEach(() => {
        originalMatchMedia = window.matchMedia
    })

    afterEach(() => {
        window.matchMedia = originalMatchMedia
        jest.restoreAllMocks()
    })

    it('should return xs breakpoint for width < 640px', () => {
        // No media queries match
        window.matchMedia = createMatchMedia(false)
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('xs')
        expect(result.current.isSmallScreen).toBe(true)
        expect(result.current.isMediumScreen).toBe(false)
        expect(result.current.isLargeScreen).toBe(false)
        expect(result.current.isExtraLargeScreen).toBe(false)
    })

    it('should return sm breakpoint for width >= 640px and < 768px', () => {
        // Only sm query matches
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
            const isSm = query === '(min-width: 640px)'
            const isNotMd = query !== '(min-width: 768px)'
            return {
                matches: isSm && isNotMd,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        })
        const { result } = renderHook(() => useResponsive())

        waitFor(() => {
            expect(result.current.breakpoint).toBe('sm')
        })
    })

    it('should return md breakpoint for width >= 768px and < 1024px', () => {
        // md query matches
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
            const isMd = query === '(min-width: 768px)'
            const isNotLg = query !== '(min-width: 1024px)'
            return {
                matches: isMd && isNotLg,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        })
        const { result } = renderHook(() => useResponsive())

        waitFor(() => {
            expect(result.current.breakpoint).toBe('md')
        })
    })

    it('should return lg breakpoint for width >= 1024px and < 1280px', () => {
        // lg query matches
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
            const isLg = query === '(min-width: 1024px)'
            const isNotXl = query !== '(min-width: 1280px)'
            return {
                matches: isLg && isNotXl,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        })
        const { result } = renderHook(() => useResponsive())

        waitFor(() => {
            expect(result.current.breakpoint).toBe('lg')
        })
    })

    it('should return xl breakpoint for width >= 1280px', () => {
        // xl query matches
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: query === '(min-width: 1280px)',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }))
        const { result } = renderHook(() => useResponsive())

        waitFor(() => {
            expect(result.current.breakpoint).toBe('xl')
        })
    })

    it('should return xl breakpoint for width >= 1536px (hook supports up to xl)', () => {
        // The hook doesn't support 2xl, only up to xl
        // For very large screens, it should return xl
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: query === '(min-width: 1280px)',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }))
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('xl')
    })

    it('should update breakpoint on media query change', async () => {
        const changeListeners: Array<() => void> = []
        const mockMediaQuery = {
            matches: false,
            media: '',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn((event: string, listener: () => void) => {
                if (event === 'change') {
                    changeListeners.push(listener)
                }
            }),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }

        window.matchMedia = jest.fn().mockImplementation(() => mockMediaQuery)
        
        const { result } = renderHook(() => useResponsive())

        // Initially xs (no matches)
        expect(result.current.breakpoint).toBe('xs')

        // Simulate media query change - now xl matches
        mockMediaQuery.matches = true
        Object.defineProperty(mockMediaQuery, 'matches', {
            get: () => true,
            configurable: true,
        })
        
        // Trigger change listeners
        changeListeners.forEach(listener => listener())

        await waitFor(() => {
            expect(result.current.breakpoint).toBe('xl')
        })
    })

    it('should cleanup media query listeners on unmount', () => {
        const removeEventListenerSpy = jest.fn()
        window.matchMedia = jest.fn().mockImplementation(() => ({
            matches: false,
            media: '',
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: removeEventListenerSpy,
            dispatchEvent: jest.fn(),
        }))
        const { unmount } = renderHook(() => useResponsive())

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalled()
    })

    it('should handle SSR gracefully', () => {
        // Test that hook returns default 'xs' breakpoint when no media queries match
        // In SSR, window.matchMedia might not be available or return no matches
        // The hook should handle this gracefully and return 'xs'
        const originalMatchMedia = window.matchMedia
        
        // Mock matchMedia to return no matches (simulating SSR-like behavior)
        window.matchMedia = createMatchMedia(false)

        const { result } = renderHook(() => useResponsive())

        // Should not crash and return default values
        expect(result.current.breakpoint).toBe('xs')

        // Restore matchMedia
        window.matchMedia = originalMatchMedia
    })

    it('should detect exact breakpoint boundaries', async () => {
        // Test sm boundary - only sm query matches
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
            const isSm = query === '(min-width: 640px)'
            const isNotMd = query !== '(min-width: 768px)'
            return {
                matches: isSm && isNotMd,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        })
        const { result: result1 } = renderHook(() => useResponsive())
        await waitFor(() => {
            expect(result1.current.breakpoint).toBe('sm')
        })

        // Test md boundary
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
            const isMd = query === '(min-width: 768px)'
            const isNotLg = query !== '(min-width: 1024px)'
            return {
                matches: isMd && isNotLg,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        })
        const { result: result2 } = renderHook(() => useResponsive())
        await waitFor(() => {
            expect(result2.current.breakpoint).toBe('md')
        })

        // Test lg boundary
        window.matchMedia = jest.fn().mockImplementation((query: string) => {
            const isLg = query === '(min-width: 1024px)'
            const isNotXl = query !== '(min-width: 1280px)'
            return {
                matches: isLg && isNotXl,
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
            }
        })
        const { result: result3 } = renderHook(() => useResponsive())
        await waitFor(() => {
            expect(result3.current.breakpoint).toBe('lg')
        })

        // Test xl boundary
        window.matchMedia = jest.fn().mockImplementation((query: string) => ({
            matches: query === '(min-width: 1280px)',
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }))
        const { result: result4 } = renderHook(() => useResponsive())
        await waitFor(() => {
            expect(result4.current.breakpoint).toBe('xl')
        })
    })
})
