/**
 * @jest-environment jsdom
 */

/**
 * useProfilePresence (#468)
 *
 * What the public may see of a profile owner's availability. Your own profile
 * follows the status you picked; someone else's is read with `getPresence`.
 */

import { act, renderHook } from '@testing-library/react'
import { useProfilePresence } from '@/hooks/useProfilePresence'
import { GET_USER_PRESENCE } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import { resetStore } from '@/__tests__/utils/test-utils'

const mockUseQuery = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

function queried(status: string, statusMessage = '', lastSeen: string | null = null) {
  return { data: { getPresence: { userId: 'user-2', status, statusMessage, lastSeen } } }
}

describe('useProfilePresence', () => {
  beforeEach(() => {
    resetStore()
    mockUseQuery.mockReturnValue({ data: undefined })
  })

  describe('your own profile', () => {
    it('shows nothing by default, because Invisible is the default', () => {
      const { result } = renderHook(() => useProfilePresence('user-1', true))
      expect(result.current).toBeNull()
    })

    it('does not ask the server; it follows the status you picked', () => {
      useAppStore.getState().setUserStatus('away', 'Out for lunch')
      const { result } = renderHook(() => useProfilePresence('user-1', true))

      expect(result.current).toEqual({ status: 'away', statusMessage: 'Out for lunch' })
      expect(mockUseQuery).toHaveBeenCalledWith(
        GET_USER_PRESENCE,
        expect.objectContaining({ skip: true })
      )
    })

    it('updates the moment you save a new status', () => {
      const { result } = renderHook(() => useProfilePresence('user-1', true))
      expect(result.current).toBeNull()

      act(() => {
        useAppStore.getState().setUserStatus('online', 'Around')
      })
      expect(result.current).toEqual({ status: 'online', statusMessage: 'Around' })

      act(() => {
        useAppStore.getState().setUserStatus('invisible', '')
      })
      expect(result.current).toBeNull()
    })

    it('hides a message that is still stored while Invisible', () => {
      useAppStore.setState((state) => ({
        chat: { ...state.chat, userStatus: 'invisible', userStatusMessage: 'Left over' },
      }))
      const { result } = renderHook(() => useProfilePresence('user-1', true))

      expect(result.current).toBeNull()
    })
  })

  describe('someone else\'s profile', () => {
    it('reads their presence with getPresence', () => {
      mockUseQuery.mockReturnValue(queried('online', 'Hello'))
      const { result } = renderHook(() => useProfilePresence('user-2', false))

      expect(result.current).toEqual({ status: 'online', statusMessage: 'Hello' })
      expect(mockUseQuery).toHaveBeenCalledWith(
        GET_USER_PRESENCE,
        expect.objectContaining({
          variables: { userId: 'user-2' },
          skip: false,
          errorPolicy: 'all',
          fetchPolicy: 'cache-and-network',
        })
      )
    })

    it('does not use your own status for their profile', () => {
      useAppStore.getState().setUserStatus('dnd', 'Mine')
      mockUseQuery.mockReturnValue({ data: undefined })
      const { result } = renderHook(() => useProfilePresence('user-2', false))

      expect(result.current).toBeNull()
    })

    it.each(['invisible', 'offline'])('shows nothing for %s, even with a message', (status) => {
      mockUseQuery.mockReturnValue(queried(status, 'Secret plans'))
      const { result } = renderHook(() => useProfilePresence('user-2', false))

      expect(result.current).toBeNull()
    })

    it('shows nothing while loading, when it fails, or when there is no record', () => {
      mockUseQuery.mockReturnValue({ data: undefined, loading: true })
      expect(renderHook(() => useProfilePresence('user-2', false)).result.current).toBeNull()

      mockUseQuery.mockReturnValue({ data: undefined, error: new Error('boom') })
      expect(renderHook(() => useProfilePresence('user-2', false)).result.current).toBeNull()

      mockUseQuery.mockReturnValue({ data: { getPresence: null } })
      expect(renderHook(() => useProfilePresence('user-2', false)).result.current).toBeNull()
    })

    it('skips the request when there is no user id', () => {
      renderHook(() => useProfilePresence(undefined, false))

      expect(mockUseQuery).toHaveBeenCalledWith(
        GET_USER_PRESENCE,
        expect.objectContaining({ skip: true })
      )
    })

    describe('live updates from the presence subscription', () => {
      const queriedAt = '2026-10-27T10:00:00.000Z'
      const before = new Date('2026-10-27T09:00:00.000Z').getTime()
      const after = new Date('2026-10-27T11:00:00.000Z').getTime()

      it('a newer live update wins over the query result', () => {
        mockUseQuery.mockReturnValue(queried('online', 'Hello', queriedAt))
        const { result } = renderHook(() => useProfilePresence('user-2', false))
        expect(result.current?.status).toBe('online')

        act(() => {
          useAppStore.getState().updatePresence('user-2', {
            status: 'away',
            statusMessage: 'Stepped out',
            lastSeen: after,
          })
        })

        expect(result.current).toEqual({ status: 'away', statusMessage: 'Stepped out' })
      })

      it('a live update that turns Invisible removes the indicator and message', () => {
        mockUseQuery.mockReturnValue(queried('online', 'Hello', queriedAt))
        const { result } = renderHook(() => useProfilePresence('user-2', false))

        act(() => {
          useAppStore.getState().updatePresence('user-2', {
            status: 'invisible',
            statusMessage: 'Should stay hidden',
            lastSeen: after,
          })
        })

        expect(result.current).toBeNull()
      })

      it('an older live entry does not override a fresher query result', () => {
        useAppStore.getState().updatePresence('user-2', {
          status: 'online',
          statusMessage: 'Stale',
          lastSeen: before,
        })
        mockUseQuery.mockReturnValue(queried('dnd', 'Fresh', queriedAt))
        const { result } = renderHook(() => useProfilePresence('user-2', false))

        expect(result.current).toEqual({ status: 'dnd', statusMessage: 'Fresh' })
      })

      it('uses a live update while the query is still loading', () => {
        useAppStore.getState().updatePresence('user-2', {
          status: 'away',
          statusMessage: '',
          lastSeen: after,
        })
        mockUseQuery.mockReturnValue({ data: undefined, loading: true })
        const { result } = renderHook(() => useProfilePresence('user-2', false))

        expect(result.current).toEqual({ status: 'away', statusMessage: '' })
      })

      it('ignores live updates about other people', () => {
        useAppStore.getState().updatePresence('someone-else', {
          status: 'online',
          statusMessage: 'Not them',
          lastSeen: after,
        })
        mockUseQuery.mockReturnValue(queried('away', 'Them', queriedAt))
        const { result } = renderHook(() => useProfilePresence('user-2', false))

        expect(result.current).toEqual({ status: 'away', statusMessage: 'Them' })
      })
    })
  })
})
