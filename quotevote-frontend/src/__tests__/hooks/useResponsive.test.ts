import { renderHook, act } from '@testing-library/react'
import { useResponsive } from '@/hooks/useResponsive'

describe('useResponsive', () => {
    let mockInnerWidth: number

    beforeEach(() => {
        mockInnerWidth = 1024
        Object.defineProperty(window, 'innerWidth', {
            writable: true,
            configurable: true,
            value: mockInnerWidth,
        })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('should return xs breakpoint for width < 640px', () => {
        Object.defineProperty(window, 'innerWidth', { value: 500 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('xs')
        expect(result.current.isSmallScreen).toBe(true)
        expect(result.current.isMediumScreen).toBe(false)
        expect(result.current.isLargeScreen).toBe(false)
        expect(result.current.isExtraLargeScreen).toBe(false)
    })

    it('should return sm breakpoint for width >= 640px and < 768px', () => {
        Object.defineProperty(window, 'innerWidth', { value: 700 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('sm')
        expect(result.current.isSmallScreen).toBe(false)
        expect(result.current.isMediumScreen).toBe(false)
    })

    it('should return md breakpoint for width >= 768px and < 1024px', () => {
        Object.defineProperty(window, 'innerWidth', { value: 800 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('md')
        expect(result.current.isSmallScreen).toBe(false)
        expect(result.current.isMediumScreen).toBe(true)
        expect(result.current.isLargeScreen).toBe(false)
    })

    it('should return lg breakpoint for width >= 1024px and < 1280px', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1100 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('lg')
        expect(result.current.isSmallScreen).toBe(false)
        expect(result.current.isMediumScreen).toBe(true)
        expect(result.current.isLargeScreen).toBe(true)
        expect(result.current.isExtraLargeScreen).toBe(false)
    })

    it('should return xl breakpoint for width >= 1280px and < 1536px', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1400 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('xl')
        expect(result.current.isSmallScreen).toBe(false)
        expect(result.current.isMediumScreen).toBe(true)
        expect(result.current.isLargeScreen).toBe(true)
        expect(result.current.isExtraLargeScreen).toBe(true)
    })

    it('should return 2xl breakpoint for width >= 1536px', () => {
        Object.defineProperty(window, 'innerWidth', { value: 1920 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('2xl')
        expect(result.current.isSmallScreen).toBe(false)
        expect(result.current.isMediumScreen).toBe(true)
        expect(result.current.isLargeScreen).toBe(true)
        expect(result.current.isExtraLargeScreen).toBe(true)
    })

    it('should update breakpoint on window resize', () => {
        Object.defineProperty(window, 'innerWidth', { value: 500 })
        const { result } = renderHook(() => useResponsive())

        expect(result.current.breakpoint).toBe('xs')

        // Resize window
        act(() => {
            Object.defineProperty(window, 'innerWidth', { value: 1400 })
            window.dispatchEvent(new Event('resize'))
        })

        expect(result.current.breakpoint).toBe('xl')
    })

    it('should cleanup resize listener on unmount', () => {
        const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')
        const { unmount } = renderHook(() => useResponsive())

        unmount()

        expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    // Skipped: Cannot redefine global.window in this test environment to simulate SSR.
    // TypeError: Cannot redefine property: window
    it.skip('should handle SSR gracefully', () => {
        // Simulate SSR by making window undefined
        const originalWindow = global.window
        // @ts-expect-error - Testing SSR scenario
        delete global.window

        const { result } = renderHook(() => useResponsive())

        // Should not crash and return default values
        expect(result.current.breakpoint).toBe('xs')

        // Restore window
        global.window = originalWindow
    })

    it('should detect exact breakpoint boundaries', () => {
        // Test sm boundary (640px)
        Object.defineProperty(window, 'innerWidth', { value: 640 })
        const { result: result1 } = renderHook(() => useResponsive())
        expect(result1.current.breakpoint).toBe('sm')

        // Test md boundary (768px)
        Object.defineProperty(window, 'innerWidth', { value: 768 })
        const { result: result2 } = renderHook(() => useResponsive())
        expect(result2.current.breakpoint).toBe('md')

        // Test lg boundary (1024px)
        Object.defineProperty(window, 'innerWidth', { value: 1024 })
        const { result: result3 } = renderHook(() => useResponsive())
        expect(result3.current.breakpoint).toBe('lg')

        // Test xl boundary (1280px)
        Object.defineProperty(window, 'innerWidth', { value: 1280 })
        const { result: result4 } = renderHook(() => useResponsive())
        expect(result4.current.breakpoint).toBe('xl')

        // Test 2xl boundary (1536px)
        Object.defineProperty(window, 'innerWidth', { value: 1536 })
        const { result: result5 } = renderHook(() => useResponsive())
        expect(result5.current.breakpoint).toBe('2xl')
    })
})
