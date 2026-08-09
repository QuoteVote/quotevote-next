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

// Mirrors the deployed API's `User` type, which exposes neither `bio` nor
// `presence`. Presence is served separately by `getPresence(userId)`.
function makeGetUserMock() {
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
          upvotes: 0,
          downvotes: 0,
          _followingId: [],
          _followersId: [],
          avatar: qualities,
          contributorBadge: false,
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

  it('leaves chat presence untouched — GET_USER no longer carries it', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MockedProvider mocks={[makeGetUserMock()]}>{children}</MockedProvider>
    )
    const before = useAppStore.getState().chat.userStatus
    renderHook(() => useSyncCurrentUserProfile(), { wrapper })

    await waitFor(() => {
      expect(useAppStore.getState().user.data.avatar).toEqual(qualities)
    })
    expect(useAppStore.getState().chat.userStatus).toBe(before)
  })
})
