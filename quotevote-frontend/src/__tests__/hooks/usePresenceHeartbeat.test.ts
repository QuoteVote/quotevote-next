import { renderHook, act } from '@testing-library/react'
// TODO: Fix Apollo Client v4.0.9 type resolution issues
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat'

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
    ...jest.requireActual('@apollo/client'),
    useMutation: jest.fn(),
}))

describe('usePresenceHeartbeat', () => {
    let mockHeartbeat: jest.Mock
    let mockError: Error | undefined

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        mockHeartbeat = jest.fn().mockResolvedValue({ data: { heartbeat: { success: true } } })
        mockError = undefined

            ; (useMutation as jest.Mock).mockReturnValue([mockHeartbeat, { error: mockError }])
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should send initial heartbeat immediately', () => {
        renderHook(() => usePresenceHeartbeat())

        expect(mockHeartbeat).toHaveBeenCalledTimes(1)
    })

    it('should send heartbeat at specified interval', () => {
        const interval = 10000 // 10 seconds
        renderHook(() => usePresenceHeartbeat(interval))

        // Initial heartbeat
        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        // Advance time by interval
        act(() => {
            jest.advanceTimersByTime(interval)
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(2)

        // Advance again
        act(() => {
            jest.advanceTimersByTime(interval)
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(3)
    })

    it('should use default interval of 45 seconds', () => {
        renderHook(() => usePresenceHeartbeat())

        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        act(() => {
            jest.advanceTimersByTime(45000)
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(2)
    })

    it('should retry on failure with exponential backoff', async () => {
        mockHeartbeat
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValue({ data: { heartbeat: { success: true } } })

        // Use large interval (1 hour) so interval won't fire during retry tests
        // Retry delays are capped at 300000ms (5 minutes)
        renderHook(() => usePresenceHeartbeat(3600000))

        // Initial call fails
        await act(async () => {
            await Promise.resolve() // Let initial call complete
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        // First retry after 300000ms (capped at max 5 minutes)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let retry promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(2)

        // Second retry after another 300000ms (also capped)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let retry promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(3)
    })

    it('should stop retrying after max retries', async () => {
        mockHeartbeat.mockRejectedValue(new Error('Network error'))

        // Use large interval (1 hour) so interval won't fire during retry tests
        // Retry delays are capped at 300000ms (5 minutes)
        renderHook(() => usePresenceHeartbeat(3600000))

        // Initial call
        await act(async () => {
            await Promise.resolve() // Let initial call complete
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        // Retry 1 (300000ms - capped)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let retry promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(2)

        // Retry 2 (300000ms - capped)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let retry promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(3)

        // Retry 3 (300000ms - capped)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let retry promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(4)

        // Should not retry after max retries (3)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let any pending promises resolve
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(4)
    })

    it('should reset retry count on successful heartbeat', async () => {
        mockHeartbeat
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValue({ data: { heartbeat: { success: true } } })

        // Use large interval (1 hour) so interval won't fire during retry tests
        // Retry delays are capped at 300000ms (5 minutes)
        renderHook(() => usePresenceHeartbeat(3600000))

        // Initial call fails
        await act(async () => {
            await Promise.resolve() // Let initial call complete
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        // Retry succeeds (300000ms - capped)
        await act(async () => {
            jest.advanceTimersByTime(300000)
            await Promise.resolve() // Let retry promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(2)

        // Next interval should work normally (not with backoff)
        await act(async () => {
            jest.advanceTimersByTime(3600000)
            await Promise.resolve() // Let interval promise resolve
        })
            expect(mockHeartbeat).toHaveBeenCalledTimes(3)
    })

    it('should cleanup interval on unmount', () => {
        const { unmount } = renderHook(() => usePresenceHeartbeat(10000))

        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        unmount()

        // Advance time - should not call heartbeat after unmount
        act(() => {
            jest.advanceTimersByTime(10000)
        })
        expect(mockHeartbeat).toHaveBeenCalledTimes(1)
    })

    it('should return error from mutation', () => {
        const testError = new Error('Test error')
            ; (useMutation as jest.Mock).mockReturnValue([mockHeartbeat, { error: testError }])

        const { result } = renderHook(() => usePresenceHeartbeat())

        expect(result.current.error).toBe(testError)
    })
})
