import { renderHook, act, waitFor } from '@testing-library/react'
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
    ...jest.requireActual('@apollo/client'),
    useMutation: jest.fn(),
}))

describe('useTypingIndicator', () => {
    let mockUpdateTyping: jest.Mock

    beforeEach(() => {
        jest.clearAllMocks()
        jest.useFakeTimers()
        mockUpdateTyping = jest.fn().mockResolvedValue({ data: { updateTyping: { success: true } } })

            ; (useMutation as jest.Mock).mockReturnValue([mockUpdateTyping, {}])
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('should send typing indicator on handleTyping', () => {
        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        expect(mockUpdateTyping).toHaveBeenCalledWith({
            variables: {
                typing: {
                    messageRoomId: 'room1',
                    isTyping: true,
                },
            },
        })
    })

    it('should not send typing indicator if messageRoomId is empty', () => {
        const { result } = renderHook(() => useTypingIndicator(''))

        act(() => {
            result.current.handleTyping()
        })

        expect(mockUpdateTyping).not.toHaveBeenCalled()
    })

    it('should debounce typing indicator', () => {
        const { result } = renderHook(() => useTypingIndicator('room1'))

        // Call handleTyping multiple times
        act(() => {
            result.current.handleTyping()
            result.current.handleTyping()
            result.current.handleTyping()
        })

        // Should only send typing indicator once
        expect(mockUpdateTyping).toHaveBeenCalledTimes(1)
    })

    it('should stop typing after 3 seconds of inactivity', async () => {
        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        expect(mockUpdateTyping).toHaveBeenCalledWith({
            variables: {
                typing: {
                    messageRoomId: 'room1',
                    isTyping: true,
                },
            },
        })

        // Advance time by 3 seconds
        act(() => {
            jest.advanceTimersByTime(3000)
        })

        await waitFor(() => {
            expect(mockUpdateTyping).toHaveBeenCalledWith({
                variables: {
                    typing: {
                        messageRoomId: 'room1',
                        isTyping: false,
                    },
                },
            })
        })
    })

    it('should reset timeout on subsequent typing', async () => {
        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        // Advance time by 2 seconds
        act(() => {
            jest.advanceTimersByTime(2000)
        })

        // Type again - should reset timeout
        act(() => {
            result.current.handleTyping()
        })

        // Advance time by 2 more seconds (total 4, but timeout should have reset)
        act(() => {
            jest.advanceTimersByTime(2000)
        })

        // Should not have stopped typing yet
        expect(mockUpdateTyping).toHaveBeenCalledTimes(1)

        // Advance time by 1 more second (3 seconds since last typing)
        act(() => {
            jest.advanceTimersByTime(1000)
        })

        await waitFor(() => {
            expect(mockUpdateTyping).toHaveBeenCalledWith({
                variables: {
                    typing: {
                        messageRoomId: 'room1',
                        isTyping: false,
                    },
                },
            })
        })
    })

    it('should manually stop typing', () => {
        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        act(() => {
            result.current.stopTyping()
        })

        expect(mockUpdateTyping).toHaveBeenCalledWith({
            variables: {
                typing: {
                    messageRoomId: 'room1',
                    isTyping: false,
                },
            },
        })
    })

    it('should not stop typing if not currently typing', () => {
        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.stopTyping()
        })

        expect(mockUpdateTyping).not.toHaveBeenCalled()
    })

    it('should cleanup and stop typing on unmount', () => {
        const { result, unmount } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        unmount()

        expect(mockUpdateTyping).toHaveBeenCalledWith({
            variables: {
                typing: {
                    messageRoomId: 'room1',
                    isTyping: false,
                },
            },
        })
    })

    it('should handle mutation errors gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        mockUpdateTyping.mockRejectedValue(new Error('Network error'))

        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to send typing indicator:',
                expect.any(Error)
            )
        })

        consoleErrorSpy.mockRestore()
    })

    it('should handle stop typing errors gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        mockUpdateTyping
            .mockResolvedValueOnce({ data: { updateTyping: { success: true } } })
            .mockRejectedValueOnce(new Error('Network error'))

        const { result } = renderHook(() => useTypingIndicator('room1'))

        act(() => {
            result.current.handleTyping()
        })

        act(() => {
            result.current.stopTyping()
        })

        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                'Failed to stop typing indicator:',
                expect.any(Error)
            )
        })

        consoleErrorSpy.mockRestore()
    })

    it('should cleanup timeout when room changes', () => {
        const { result, rerender } = renderHook(
            ({ roomId }) => useTypingIndicator(roomId),
            { initialProps: { roomId: 'room1' } }
        )

        act(() => {
            result.current.handleTyping()
        })

        // Change room
        rerender({ roomId: 'room2' })

        // Should have stopped typing for old room
        expect(mockUpdateTyping).toHaveBeenCalledWith({
            variables: {
                typing: {
                    messageRoomId: 'room1',
                    isTyping: false,
                },
            },
        })
    })
})
