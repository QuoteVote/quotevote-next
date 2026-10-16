import { renderHook } from '@testing-library/react'
import { useMutation, useQuery } from '@apollo/client/react'
import { useUserBlock } from '@/hooks/useUserBlock'
import { GET_BUDDY_LIST, GET_USER_BLOCK_STATUS } from '@/graphql/queries'

jest.mock('@apollo/client/react', () => ({
    ...jest.requireActual('@apollo/client/react'),
    useMutation: jest.fn(),
    useQuery: jest.fn(),
}))

describe('useUserBlock', () => {
    let mockBlock: jest.Mock
    let mockUnblock: jest.Mock
    let mutationOptions: Record<string, { refetchQueries?: unknown[] }>

    beforeEach(() => {
        jest.clearAllMocks()
        mockBlock = jest.fn().mockResolvedValue({ data: {} })
        mockUnblock = jest.fn().mockResolvedValue({ data: {} })
        mutationOptions = {}
        ;(useMutation as unknown as jest.Mock).mockImplementation((mutation, options) => {
            const name = mutation.definitions[0]?.name?.value
            mutationOptions[name] = options
            return [name === 'BlockUser' ? mockBlock : mockUnblock, {}]
        })
        ;(useQuery as unknown as jest.Mock).mockReturnValue({ data: undefined, loading: false })
    })

    it('returns false flags when there is no data', () => {
        const { result } = renderHook(() => useUserBlock('u2'))
        expect(result.current.blockedByMe).toBe(false)
        expect(result.current.blockedMe).toBe(false)
    })

    it('reads flags from userBlockStatus', () => {
        ;(useQuery as unknown as jest.Mock).mockReturnValue({
            data: { userBlockStatus: { userId: 'u2', blockedByMe: true, blockedMe: true } },
            loading: false,
        })
        const { result } = renderHook(() => useUserBlock('u2'))
        expect(result.current.blockedByMe).toBe(true)
        expect(result.current.blockedMe).toBe(true)
    })

    it('queries with the userId and skips when it is missing', () => {
        renderHook(() => useUserBlock('u2'))
        expect(useQuery).toHaveBeenLastCalledWith(
            GET_USER_BLOCK_STATUS,
            expect.objectContaining({ variables: { userId: 'u2' }, skip: false })
        )
        renderHook(() => useUserBlock(undefined))
        expect(useQuery).toHaveBeenLastCalledWith(
            GET_USER_BLOCK_STATUS,
            expect.objectContaining({ skip: true })
        )
    })

    it('does not call mutations without a userId', async () => {
        const { result } = renderHook(() => useUserBlock(undefined))
        await result.current.block()
        await result.current.unblock()
        expect(mockBlock).not.toHaveBeenCalled()
        expect(mockUnblock).not.toHaveBeenCalled()
    })

    it('block and unblock send userId', async () => {
        const { result } = renderHook(() => useUserBlock('u2'))
        await result.current.block()
        await result.current.unblock()
        expect(mockBlock).toHaveBeenCalledWith({ variables: { userId: 'u2' } })
        expect(mockUnblock).toHaveBeenCalledWith({ variables: { userId: 'u2' } })
    })

    it('refetches status and buddy list after mutations', () => {
        renderHook(() => useUserBlock('u2'))
        const expected = [
            { query: GET_USER_BLOCK_STATUS, variables: { userId: 'u2' } },
            { query: GET_BUDDY_LIST },
        ]
        expect(mutationOptions.BlockUser.refetchQueries).toEqual(expected)
        expect(mutationOptions.UnblockUser.refetchQueries).toEqual(expected)
    })

    it('reports loading', () => {
        ;(useQuery as unknown as jest.Mock).mockReturnValue({ data: undefined, loading: true })
        const { result } = renderHook(() => useUserBlock('u2'))
        expect(result.current.loading).toBe(true)
    })
})
