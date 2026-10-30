/**
 * @jest-environment jsdom
 */

/**
 * useSyncCurrentUserPresence (#468)
 *
 * Loads the status the signed-in user picked earlier so it persists across
 * reloads. It only ever reads: a status changes only when the user changes it.
 */

import { act, renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import type { ReactNode } from 'react'
import { useSyncCurrentUserPresence } from '@/hooks/useSyncCurrentUserPresence'
import { GET_USER_PRESENCE } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import { resetStore } from '@/__tests__/utils/test-utils'

const mockUseQuery = jest.fn()
const mockUseMutation = jest.fn()
jest.mock('@apollo/client/react', () => ({
  ...jest.requireActual('@apollo/client/react'),
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

const chat = () => useAppStore.getState().chat

function presence(status: string, statusMessage = '') {
  return { getPresence: { userId: 'user-1', status, statusMessage, lastSeen: null } }
}

describe('useSyncCurrentUserPresence', () => {
  let refetch: jest.Mock

  beforeEach(() => {
    resetStore()
    useAppStore.getState().setUserData({ _id: 'user-1', username: 'alice' })
    refetch = jest.fn()
    mockUseQuery.mockReturnValue({ data: undefined, refetch })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('reads the signed-in user\'s presence, and only reads', () => {
    renderHook(() => useSyncCurrentUserPresence())

    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_USER_PRESENCE,
      expect.objectContaining({
        variables: { userId: 'user-1' },
        skip: false,
        fetchPolicy: 'network-only',
        errorPolicy: 'all',
      })
    )
    expect(mockUseMutation).not.toHaveBeenCalled()
  })

  it('falls back to the `id` field when there is no `_id`', () => {
    useAppStore.getState().setUserData({ id: 'user-9', username: 'bob' })
    renderHook(() => useSyncCurrentUserPresence())

    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_USER_PRESENCE,
      expect.objectContaining({ variables: { userId: 'user-9' }, skip: false })
    )
  })

  it('skips the request when nobody is signed in', () => {
    useAppStore.getState().setUserData({})
    renderHook(() => useSyncCurrentUserPresence())

    expect(mockUseQuery).toHaveBeenCalledWith(
      GET_USER_PRESENCE,
      expect.objectContaining({ skip: true })
    )
    expect(chat().userStatus).toBe('invisible')
  })

  it('applies the status and message the user saved earlier', () => {
    mockUseQuery.mockReturnValue({ data: presence('away', 'Back at 5'), refetch })
    renderHook(() => useSyncCurrentUserPresence())

    expect(chat().userStatus).toBe('away')
    expect(chat().userStatusMessage).toBe('Back at 5')
    expect(chat().userStatusLoaded).toBe(true)
  })

  it('treats a stored Available (the "online" value) as Available', () => {
    mockUseQuery.mockReturnValue({ data: presence('online', 'Around'), refetch })
    renderHook(() => useSyncCurrentUserPresence())

    expect(chat().userStatus).toBe('online')
  })

  it('applies Invisible without carrying a stored message over', () => {
    mockUseQuery.mockReturnValue({ data: presence('invisible', 'Secret plans'), refetch })
    renderHook(() => useSyncCurrentUserPresence())

    expect(chat().userStatus).toBe('invisible')
    expect(chat().userStatusMessage).toBe('')
  })

  it('never overrides a status the user has already chosen', () => {
    useAppStore.getState().setUserStatus('online', 'Chosen just now')
    mockUseQuery.mockReturnValue({ data: presence('away', 'Old value'), refetch })
    renderHook(() => useSyncCurrentUserPresence())

    expect(chat().userStatus).toBe('online')
    expect(chat().userStatusMessage).toBe('Chosen just now')
  })

  it('leaves the default when the request fails', () => {
    mockUseQuery.mockReturnValue({ data: undefined, error: new Error('boom'), refetch })
    renderHook(() => useSyncCurrentUserPresence())

    expect(chat().userStatus).toBe('invisible')
    expect(chat().userStatusLoaded).toBe(false)
  })

  describe('when the server only says "offline"', () => {
    it('keeps the default, then asks once more after a short delay', () => {
      jest.useFakeTimers()
      mockUseQuery.mockReturnValue({ data: presence('offline'), refetch })
      const { rerender } = renderHook(() => useSyncCurrentUserPresence())

      expect(chat().userStatus).toBe('invisible')
      expect(chat().userStatusLoaded).toBe(false)
      expect(refetch).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(refetch).toHaveBeenCalledTimes(1)

      // The heartbeat has restored the real status by now.
      mockUseQuery.mockReturnValue({ data: presence('away', 'Back soon'), refetch })
      rerender()

      expect(chat().userStatus).toBe('away')
      expect(chat().userStatusMessage).toBe('Back soon')
    })

    it('asks only once, then leaves the default alone', () => {
      jest.useFakeTimers()
      mockUseQuery.mockReturnValue({ data: presence('offline'), refetch })
      const { rerender } = renderHook(() => useSyncCurrentUserPresence())

      act(() => {
        jest.advanceTimersByTime(3000)
      })
      mockUseQuery.mockReturnValue({ data: presence('offline'), refetch })
      rerender()
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      expect(refetch).toHaveBeenCalledTimes(1)
      expect(chat().userStatus).toBe('invisible')
    })

    it('does not ask again if the hook goes away first', () => {
      jest.useFakeTimers()
      mockUseQuery.mockReturnValue({ data: presence('offline'), refetch })
      const { unmount } = renderHook(() => useSyncCurrentUserPresence())

      unmount()
      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(refetch).not.toHaveBeenCalled()
    })
  })

  it('loads the next account\'s status after a sign-out and sign-in', () => {
    const byUser: Record<string, unknown> = {
      'user-1': presence('away', 'Account one'),
      'user-2': { getPresence: { userId: 'user-2', status: 'dnd', statusMessage: 'Account two', lastSeen: null } },
    }
    mockUseQuery.mockImplementation((_doc, options: { skip: boolean; variables: { userId: string } }) => ({
      data: options.skip ? undefined : byUser[options.variables.userId],
      refetch,
    }))
    const { rerender } = renderHook(() => useSyncCurrentUserPresence())
    expect(chat().userStatus).toBe('away')

    act(() => {
      useAppStore.getState().logout()
    })
    expect(chat().userStatus).toBe('invisible')

    act(() => {
      useAppStore.getState().setUserData({ _id: 'user-2', username: 'bob' })
    })
    rerender()

    expect(chat().userStatus).toBe('dnd')
    expect(chat().userStatusMessage).toBe('Account two')
  })

  it('works against the real query document (integration)', async () => {
    mockUseQuery.mockImplementation(jest.requireActual('@apollo/client/react').useQuery)
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={[
          {
            request: { query: GET_USER_PRESENCE, variables: { userId: 'user-1' } },
            result: { data: presence('dnd', 'Heads down') },
          },
        ]}
      >
        {children}
      </MockedProvider>
    )
    renderHook(() => useSyncCurrentUserPresence(), { wrapper })

    await waitFor(() => {
      expect(chat().userStatus).toBe('dnd')
    })
    expect(chat().userStatusMessage).toBe('Heads down')
  })
})
