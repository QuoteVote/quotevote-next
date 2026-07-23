/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import type { ReactNode } from 'react'
import { useSyncCurrentUserProfile } from '@/hooks/useSyncCurrentUserProfile'
import { GET_USER } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import { resetStore } from '@/__tests__/utils/test-utils'

const qualities = { topType: 'LongHairStraight', hairColor: 'Brown' }

function makeGetUserMock(
  presence?: {
    status: string
    statusMessage: string
    preferredStatus?: string
    preferredStatusMessage?: string
  } | null
) {
  return {
    request: {
      query: GET_USER,
      variables: { username: 'alice' },
    },
    result: {
      data: {
        user: {
          _id: 'user-1',
          name: 'Alice',
          username: 'alice',
          bio: 'About me',
          upvotes: 0,
          downvotes: 0,
          _followingId: [],
          _followersId: [],
          avatar: qualities,
          contributorBadge: false,
          presence:
            presence === undefined
              ? { status: 'away', statusMessage: 'In a meeting', preferredStatus: 'away', preferredStatusMessage: 'In a meeting' }
              : presence,
          reputation: null,
        },
      },
    },
  }
}

describe('useSyncCurrentUserProfile', () => {
  beforeEach(() => {
    resetStore()
    useAppStore.getState().setUserData({
      _id: 'user-1',
      username: 'alice',
      name: 'Alice',
      // No avatar in store — mirrors login response before avatar was included
    })
  })

  it('copies avatar from GET_USER into the store for nav/account menu', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[makeGetUserMock()]}>{children}</MockedProvider>
    )
    renderHook(() => useSyncCurrentUserProfile(), { wrapper })

    await waitFor(() => {
      expect(useAppStore.getState().user.data.avatar).toEqual(qualities)
    })
  })

  it('restores status and status message from GET_USER presence', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[makeGetUserMock()]}>{children}</MockedProvider>
    )
    renderHook(() => useSyncCurrentUserProfile(), { wrapper })

    await waitFor(() => {
      expect(useAppStore.getState().chat.userStatus).toBe('away')
      expect(useAppStore.getState().chat.userStatusMessage).toBe('In a meeting')
    })
  })

  it('maps offline presence to online when rehydrating own session', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={[makeGetUserMock({ status: 'offline', statusMessage: 'Back soon' })]}
      >
        {children}
      </MockedProvider>
    )
    renderHook(() => useSyncCurrentUserProfile(), { wrapper })

    await waitFor(() => {
      expect(useAppStore.getState().chat.userStatus).toBe('online')
      expect(useAppStore.getState().chat.userStatusMessage).toBe('Back soon')
    })
  })

  it('restores preferredStatus when cleanup marked the user offline', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider
        mocks={[
          makeGetUserMock({
            status: 'offline',
            statusMessage: '',
            preferredStatus: 'dnd',
            preferredStatusMessage: 'Heads down',
          }),
        ]}
      >
        {children}
      </MockedProvider>
    )
    renderHook(() => useSyncCurrentUserProfile(), { wrapper })

    await waitFor(() => {
      expect(useAppStore.getState().chat.userStatus).toBe('dnd')
      expect(useAppStore.getState().chat.userStatusMessage).toBe('Heads down')
    })
  })
})
