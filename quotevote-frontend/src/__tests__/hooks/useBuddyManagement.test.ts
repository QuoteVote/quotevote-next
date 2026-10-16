import { renderHook } from '@testing-library/react'
import { useMutation } from '@apollo/client/react'
import { useBuddyManagement } from '@/hooks/useBuddyManagement'
import { GET_BUDDY_LIST, GET_BUDDY_REQUESTS } from '@/graphql/queries'

jest.mock('@apollo/client/react', () => ({
    ...jest.requireActual('@apollo/client/react'),
    useMutation: jest.fn(),
}))

describe('useBuddyManagement', () => {
    let mockMutations: Record<string, jest.Mock>
    let mutationOptions: Record<string, { refetchQueries?: unknown[] }>

    beforeEach(() => {
        jest.clearAllMocks()
        mockMutations = {
            addBuddy: jest.fn(),
            acceptBuddy: jest.fn(),
            declineBuddy: jest.fn(),
            removeBuddy: jest.fn(),
        }
        mutationOptions = {}
        ;(useMutation as unknown as jest.Mock).mockImplementation((mutation, options) => {
            const name = mutation.definitions[0]?.name?.value || 'unknown'
            const key = name.charAt(0).toLowerCase() + name.slice(1)
            mutationOptions[key] = options
            return [mockMutations[key] || jest.fn(), {}]
        })
    })

    it('addBuddy sends userId and returns the relationship', async () => {
        const rel = { _id: 'r1', status: 'pending' }
        mockMutations.addBuddy.mockResolvedValue({ data: { addBuddy: rel } })
        const { result } = renderHook(() => useBuddyManagement())

        const response = await result.current.addBuddy('user2')

        expect(mockMutations.addBuddy).toHaveBeenCalledWith({ variables: { userId: 'user2' } })
        expect(response).toEqual(rel)
    })

    it('addBuddy rethrows the backend error', async () => {
        mockMutations.addBuddy.mockRejectedValue(new Error('Blocked'))
        const { result } = renderHook(() => useBuddyManagement())
        await expect(result.current.addBuddy('user2')).rejects.toThrow('Blocked')
    })

    it('acceptBuddy sends requestId', async () => {
        const rel = { _id: 'r1', status: 'accepted' }
        mockMutations.acceptBuddy.mockResolvedValue({ data: { acceptBuddy: rel } })
        const { result } = renderHook(() => useBuddyManagement())

        expect(await result.current.acceptBuddy('r1')).toEqual(rel)
        expect(mockMutations.acceptBuddy).toHaveBeenCalledWith({ variables: { requestId: 'r1' } })
    })

    it('declineBuddy sends requestId', async () => {
        const res = { _id: 'r1', success: true }
        mockMutations.declineBuddy.mockResolvedValue({ data: { declineBuddy: res } })
        const { result } = renderHook(() => useBuddyManagement())

        expect(await result.current.declineBuddy('r1')).toEqual(res)
        expect(mockMutations.declineBuddy).toHaveBeenCalledWith({ variables: { requestId: 'r1' } })
    })

    it('removeBuddy sends userId', async () => {
        const res = { _id: 'r1', success: true }
        mockMutations.removeBuddy.mockResolvedValue({ data: { removeBuddy: res } })
        const { result } = renderHook(() => useBuddyManagement())

        expect(await result.current.removeBuddy('user2')).toEqual(res)
        expect(mockMutations.removeBuddy).toHaveBeenCalledWith({ variables: { userId: 'user2' } })
    })

    it('refetches the buddy list and buddy requests after each mutation', () => {
        renderHook(() => useBuddyManagement())
        const expected = [{ query: GET_BUDDY_LIST }, { query: GET_BUDDY_REQUESTS }]
        for (const key of ['addBuddy', 'acceptBuddy', 'declineBuddy', 'removeBuddy']) {
            expect(mutationOptions[key].refetchQueries).toEqual(expected)
        }
    })
})
