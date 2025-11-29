import { renderHook } from '@testing-library/react'
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useMutation export
import { useMutation } from '@apollo/client'
import { useRosterManagement } from '@/hooks/useRosterManagement'
import { useAppStore } from '@/store'

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
    ...jest.requireActual('@apollo/client'),
    useMutation: jest.fn(),
}))

// Mock Zustand store
jest.mock('@/store', () => ({
    useAppStore: jest.fn(),
}))

describe('useRosterManagement', () => {
    let mockAddPendingRequest: jest.Mock
    let mockRemovePendingRequest: jest.Mock
    let mockAddBlockedUser: jest.Mock
    let mockRemoveBlockedUser: jest.Mock
    let mockMutations: Record<string, jest.Mock>

    beforeEach(() => {
        jest.clearAllMocks()

        mockAddPendingRequest = jest.fn()
        mockRemovePendingRequest = jest.fn()
        mockAddBlockedUser = jest.fn()
        mockRemoveBlockedUser = jest.fn()

            ; (useAppStore as unknown as jest.Mock).mockImplementation((selector) => {
                const state = {
                    addPendingRequest: mockAddPendingRequest,
                    removePendingRequest: mockRemovePendingRequest,
                    addBlockedUser: mockAddBlockedUser,
                    removeBlockedUser: mockRemoveBlockedUser,
                }
                return selector(state)
            })

        mockMutations = {
            addBuddy: jest.fn(),
            acceptBuddy: jest.fn(),
            declineBuddy: jest.fn(),
            blockBuddy: jest.fn(),
            unblockBuddy: jest.fn(),
            removeBuddy: jest.fn(),
        }

            ; (useMutation as jest.Mock).mockImplementation((mutation) => {
                const mutationName = mutation.definitions[0]?.name?.value || 'unknown'
                const mockFn = mockMutations[mutationName.charAt(0).toLowerCase() + mutationName.slice(1)]
                return [mockFn || jest.fn(), {}]
            })
    })

    describe('addBuddy', () => {
        it('should add a buddy and update store', async () => {
            const buddyData = { id: 'roster1', buddyId: 'user2', status: 'pending' }
            mockMutations.addBuddy.mockResolvedValue({ data: { addBuddy: buddyData } })

            const { result } = renderHook(() => useRosterManagement())

            const response = await result.current.addBuddy('user2')

            expect(mockMutations.addBuddy).toHaveBeenCalledWith({
                variables: { roster: { buddyId: 'user2' } },
            })
            expect(mockAddPendingRequest).toHaveBeenCalledWith(buddyData)
            expect(response).toEqual(buddyData)
        })

        it('should throw error on failure', async () => {
            const error = new Error('Add buddy failed')
            mockMutations.addBuddy.mockRejectedValue(error)

            const { result } = renderHook(() => useRosterManagement())

            await expect(result.current.addBuddy('user2')).rejects.toThrow('Add buddy failed')
        })
    })

    describe('acceptBuddy', () => {
        it('should accept a buddy request and update store', async () => {
            const buddyData = { id: 'roster1', status: 'accepted' }
            mockMutations.acceptBuddy.mockResolvedValue({ data: { acceptBuddy: buddyData } })

            const { result } = renderHook(() => useRosterManagement())

            const response = await result.current.acceptBuddy('roster1')

            expect(mockMutations.acceptBuddy).toHaveBeenCalledWith({
                variables: { rosterId: 'roster1' },
            })
            expect(mockRemovePendingRequest).toHaveBeenCalledWith('roster1')
            expect(response).toEqual(buddyData)
        })

        it('should throw error on failure', async () => {
            const error = new Error('Accept buddy failed')
            mockMutations.acceptBuddy.mockRejectedValue(error)

            const { result } = renderHook(() => useRosterManagement())

            await expect(result.current.acceptBuddy('roster1')).rejects.toThrow('Accept buddy failed')
        })
    })

    describe('declineBuddy', () => {
        it('should decline a buddy request and update store', async () => {
            const buddyData = { id: 'roster1', status: 'declined' }
            mockMutations.declineBuddy.mockResolvedValue({ data: { declineBuddy: buddyData } })

            const { result } = renderHook(() => useRosterManagement())

            const response = await result.current.declineBuddy('roster1')

            expect(mockMutations.declineBuddy).toHaveBeenCalledWith({
                variables: { rosterId: 'roster1' },
            })
            expect(mockRemovePendingRequest).toHaveBeenCalledWith('roster1')
            expect(response).toEqual(buddyData)
        })

        it('should throw error on failure', async () => {
            const error = new Error('Decline buddy failed')
            mockMutations.declineBuddy.mockRejectedValue(error)

            const { result } = renderHook(() => useRosterManagement())

            await expect(result.current.declineBuddy('roster1')).rejects.toThrow('Decline buddy failed')
        })
    })

    describe('blockBuddy', () => {
        it('should block a buddy and update store', async () => {
            const buddyData = { id: 'roster1', status: 'blocked' }
            mockMutations.blockBuddy.mockResolvedValue({ data: { blockBuddy: buddyData } })

            const { result } = renderHook(() => useRosterManagement())

            const response = await result.current.blockBuddy('user2')

            expect(mockMutations.blockBuddy).toHaveBeenCalledWith({
                variables: { buddyId: 'user2' },
            })
            expect(mockAddBlockedUser).toHaveBeenCalledWith('user2')
            expect(response).toEqual(buddyData)
        })

        it('should throw error on failure', async () => {
            const error = new Error('Block buddy failed')
            mockMutations.blockBuddy.mockRejectedValue(error)

            const { result } = renderHook(() => useRosterManagement())

            await expect(result.current.blockBuddy('user2')).rejects.toThrow('Block buddy failed')
        })
    })

    describe('unblockBuddy', () => {
        it('should unblock a buddy and update store', async () => {
            const buddyData = { id: 'roster1', status: 'unblocked' }
            mockMutations.unblockBuddy.mockResolvedValue({ data: { unblockBuddy: buddyData } })

            const { result } = renderHook(() => useRosterManagement())

            const response = await result.current.unblockBuddy('user2')

            expect(mockMutations.unblockBuddy).toHaveBeenCalledWith({
                variables: { buddyId: 'user2' },
            })
            expect(mockRemoveBlockedUser).toHaveBeenCalledWith('user2')
            expect(response).toEqual(buddyData)
        })

        it('should throw error on failure', async () => {
            const error = new Error('Unblock buddy failed')
            mockMutations.unblockBuddy.mockRejectedValue(error)

            const { result } = renderHook(() => useRosterManagement())

            await expect(result.current.unblockBuddy('user2')).rejects.toThrow('Unblock buddy failed')
        })
    })

    describe('removeBuddy', () => {
        it('should remove a buddy', async () => {
            const buddyData = { success: true, message: 'Buddy removed' }
            mockMutations.removeBuddy.mockResolvedValue({ data: { removeBuddy: buddyData } })

            const { result } = renderHook(() => useRosterManagement())

            const response = await result.current.removeBuddy('user2')

            expect(mockMutations.removeBuddy).toHaveBeenCalledWith({
                variables: { buddyId: 'user2' },
            })
            expect(response).toEqual(buddyData)
        })

        it('should throw error on failure', async () => {
            const error = new Error('Remove buddy failed')
            mockMutations.removeBuddy.mockRejectedValue(error)

            const { result } = renderHook(() => useRosterManagement())

            await expect(result.current.removeBuddy('user2')).rejects.toThrow('Remove buddy failed')
        })
    })
})
