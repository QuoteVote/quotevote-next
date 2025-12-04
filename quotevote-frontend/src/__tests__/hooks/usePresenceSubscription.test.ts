import { renderHook } from '@testing-library/react'
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useSubscription export
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
    let mockUser: { data: { id?: string; username?: string } }

    beforeEach(() => {
        jest.clearAllMocks()
        mockUpdatePresence = jest.fn()
        mockUser = { data: { id: '1', username: 'testuser' } }

        const mockStore = useAppStore as unknown as jest.Mock
        mockStore.mockImplementation((selector: (state: unknown) => unknown) => {
            const state = {
                user: mockUser,
                updatePresence: mockUpdatePresence,
            }
            return selector(state)
        })
    })

    it('should subscribe to presence updates when user is logged in', () => {
        const mockSubscription = useSubscription as jest.Mock
        mockSubscription.mockReturnValue({
            data: null,
            error: null,
        })

        renderHook(() => usePresenceSubscription())

        expect(useSubscription).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({
                variables: { userId: '1' },
                skip: false,
            })
        )
    })

    it('should skip subscription when user is not logged in', () => {
        mockUser = { data: {} }
        const mockSubscription = useSubscription as jest.Mock
        mockSubscription.mockReturnValue({
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
            statusMessage: 'Hello',
        }

        const mockSubscription = useSubscription as jest.Mock
        mockSubscription.mockReturnValue({
            data: { presence: presenceData },
            error: null,
        })

        renderHook(() => usePresenceSubscription())

        expect(mockUpdatePresence).toHaveBeenCalledWith('2', {
            status: 'online',
            statusMessage: 'Hello',
            lastSeen: new Date(presenceData.lastSeen).getTime(),
        })
    })

    it('should not update store when no presence data', () => {
        const mockSubscription = useSubscription as jest.Mock
        mockSubscription.mockReturnValue({
            data: null,
            error: null,
        })

        renderHook(() => usePresenceSubscription())

        expect(mockUpdatePresence).not.toHaveBeenCalled()
    })

    it('should not log error on subscription error', () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
        const testError = new Error('Subscription error')

        const mockSubscription = useSubscription as jest.Mock
        mockSubscription.mockReturnValue({
            data: null,
            error: testError,
        })

        renderHook(() => usePresenceSubscription())

        expect(consoleErrorSpy).not.toHaveBeenCalled()
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

        const mockSubscription = useSubscription as jest.Mock
        mockSubscription.mockReturnValue({
            data: { presence: presenceData1 },
            error: null,
        })

        const { rerender } = renderHook(() => usePresenceSubscription())

        expect(mockUpdatePresence).toHaveBeenCalledWith('2', {
            status: 'online',
            statusMessage: '',
            lastSeen: new Date(presenceData1.lastSeen).getTime(),
        })

        // Update subscription data
        mockSubscription.mockReturnValue({
            data: { presence: presenceData2 },
            error: null,
        })

        rerender()

        expect(mockUpdatePresence).toHaveBeenCalledWith('2', {
            status: 'offline',
            statusMessage: '',
            lastSeen: new Date(presenceData2.lastSeen).getTime(),
        })
        expect(mockUpdatePresence).toHaveBeenCalledTimes(2)
    })
})
