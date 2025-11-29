import { renderHook, waitFor } from '@testing-library/react'
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
        jest.advanceTimersByTime(interval)
        expect(mockHeartbeat).toHaveBeenCalledTimes(2)

        // Advance again
        jest.advanceTimersByTime(interval)
        expect(mockHeartbeat).toHaveBeenCalledTimes(3)
    })

    it('should use default interval of 45 seconds', () => {
        renderHook(() => usePresenceHeartbeat())

        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        jest.advanceTimersByTime(45000)
        expect(mockHeartbeat).toHaveBeenCalledTimes(2)
    })

    it('should retry on failure with exponential backoff', async () => {
        mockHeartbeat
            .mockRejectedValueOnce(new Error('Network error'))
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ data: { heartbeat: { success: true } } })

        renderHook(() => usePresenceHeartbeat(10000))

        // Initial call fails
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(1)
        })

        // First retry after 10000ms (interval * 2^1)
        jest.advanceTimersByTime(20000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(2)
        })

        // Second retry after 40000ms (interval * 2^2)
        jest.advanceTimersByTime(40000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(3)
        })
    })

    it('should stop retrying after max retries', async () => {
        mockHeartbeat.mockRejectedValue(new Error('Network error'))

        renderHook(() => usePresenceHeartbeat(10000))

        // Initial call
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(1)
        })

        // Retry 1
        jest.advanceTimersByTime(20000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(2)
        })

        // Retry 2
        jest.advanceTimersByTime(40000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(3)
        })

        // Retry 3
        jest.advanceTimersByTime(80000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(4)
        })

        // Should not retry after max retries (3)
        jest.advanceTimersByTime(160000)
        expect(mockHeartbeat).toHaveBeenCalledTimes(4)
    })

    it('should reset retry count on successful heartbeat', async () => {
        mockHeartbeat
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValue({ data: { heartbeat: { success: true } } })

        renderHook(() => usePresenceHeartbeat(10000))

        // Initial call fails
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(1)
        })

        // Retry succeeds
        jest.advanceTimersByTime(20000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(2)
        })

        // Next interval should work normally (not with backoff)
        jest.advanceTimersByTime(10000)
        await waitFor(() => {
            expect(mockHeartbeat).toHaveBeenCalledTimes(3)
        })
    })

    it('should cleanup interval on unmount', () => {
        const { unmount } = renderHook(() => usePresenceHeartbeat(10000))

        expect(mockHeartbeat).toHaveBeenCalledTimes(1)

        unmount()

        // Advance time - should not call heartbeat after unmount
        jest.advanceTimersByTime(10000)
        expect(mockHeartbeat).toHaveBeenCalledTimes(1)
    })

    it('should return error from mutation', () => {
        const testError = new Error('Test error')
            ; (useMutation as jest.Mock).mockReturnValue([mockHeartbeat, { error: testError }])

        const { result } = renderHook(() => usePresenceHeartbeat())

        expect(result.current.error).toBe(testError)
    })
})
