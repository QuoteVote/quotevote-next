import { renderHook } from '@testing-library/react'
import { useSubscription } from '@apollo/client'
import { usePresenceSubscription } from '@/hooks/usePresenceSubscription'
import { useAppStore } from '@/store'

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
    ...jest.requireActual('@apollo/client'),
    useSubscription: jest.fn(),
}))

// Mock Zustand store
jest.mock('@/store', () => ({
    useAppStore: jest.fn(),
}))

describe('usePresenceSubscription', () => {
    let mockUpdatePresence: jest.Mock
    let mockUser: { id: string; username: string } | null

    beforeEach(() => {
        jest.clearAllMocks()
        mockUpdatePresence = jest.fn()
        mockUser = { id: '1', username: 'testuser' }

            ; (useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
                const state = {
                    user: mockUser,
                    updatePresence: mockUpdatePresence,
                }
                return selector(state)
            })
    })

    it('should subscribe to presence updates when user is logged in', () => {
        ; (useSubscription as jest.Mock).mockReturnValue({
            data: null,
            error: null,
        })

        renderHook(() => usePresenceSubscription())

        expect(useSubscription).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                variables: { userId: null },
                skip: false,
            })
        )
    })

    it('should skip subscription when user is not logged in', () => {
        mockUser = null
            ; (useSubscription as jest.Mock).mockReturnValue({
                data: null,
                error: null,
            })

        renderHook(() => usePresenceSubscription())

        expect(useSubscription).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                skip: true,
            })
        )
    })

    it('should update store when presence data is received', () => {
        const presenceData = {
            userId: '2',
            isOnline: true,
            lastSeen: '2024-01-01T00:00:00Z',
        }

            ; (useSubscription as jest.Mock).mockReturnValue({
                data: { presence: presenceData },
                error: null,
            })

        renderHook(() => usePresenceSubscription())

        expect(mockUpdatePresence).toHaveBeenCalledWith(presenceData)
    })

    it('should not update store when no presence data', () => {
        ; (useSubscription as jest.Mock).mockReturnValue({
            data: null,
            error: null,
        })

        renderHook(() => usePresenceSubscription())

        expect(mockUpdatePresence).not.toHaveBeenCalled()
    })

    it('should log error but not throw on subscription error', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        const testError = new Error('Subscription error')

            ; (useSubscription as jest.Mock).mockReturnValue({
                data: null,
                error: testError,
            })

        renderHook(() => usePresenceSubscription())

        expect(consoleErrorSpy).toHaveBeenCalledWith('Presence subscription error:', testError)
        consoleErrorSpy.mockRestore()
    })

    it('should update store when presence data changes', () => {
        const presenceData1 = {
            userId: '2',
            isOnline: true,
            lastSeen: '2024-01-01T00:00:00Z',
        }

        const presenceData2 = {
            userId: '2',
            isOnline: false,
            lastSeen: '2024-01-01T01:00:00Z',
        }

            ; (useSubscription as jest.Mock).mockReturnValue({
                data: { presence: presenceData1 },
                error: null,
            })

        const { rerender } = renderHook(() => usePresenceSubscription())

        expect(mockUpdatePresence).toHaveBeenCalledWith(presenceData1)

            // Update subscription data
            ; (useSubscription as jest.Mock).mockReturnValue({
                data: { presence: presenceData2 },
                error: null,
            })

        rerender()

        expect(mockUpdatePresence).toHaveBeenCalledWith(presenceData2)
        expect(mockUpdatePresence).toHaveBeenCalledTimes(2)
    })
})
