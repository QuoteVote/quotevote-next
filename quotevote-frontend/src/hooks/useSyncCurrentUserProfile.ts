'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_USER } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'

type SyncedUserFields = {
  avatar?: string | Record<string, unknown> | null
  name?: string | null
  email?: string | null
  contributorBadge?: boolean | null
}

/**
 * Keeps the persisted Zustand user (used by nav / account menu avatars) in sync
 * with the latest profile from GraphQL. Login historically omitted `avatar`, so
 * without this sync the nav shows a seeded default while the profile page is correct.
 *
 * Presence is not synced here: the deployed API's `User` type has no `presence`
 * field. It is exposed separately via `getPresence(userId)`.
 */
export function useSyncCurrentUserProfile(): void {
  const username = useAppStore((state) =>
    typeof state.user.data.username === 'string' ? state.user.data.username : undefined
  )
  const setUserData = useAppStore((state) => state.setUserData)

  const { data } = useQuery<{ user: SyncedUserFields | null }>(GET_USER, {
    variables: { username: username ?? '' },
    skip: !username,
    fetchPolicy: 'cache-and-network',
  })

  useEffect(() => {
    const fetched = data?.user
    if (!fetched || !username) return

    const current = useAppStore.getState().user.data
    const nextAvatar = fetched.avatar ?? undefined
    const avatarChanged =
      JSON.stringify(current.avatar ?? null) !== JSON.stringify(nextAvatar ?? null)
    const nameChanged =
      typeof fetched.name === 'string' && fetched.name.length > 0 && fetched.name !== current.name
    const emailChanged =
      typeof fetched.email === 'string' &&
      fetched.email.length > 0 &&
      fetched.email !== current.email
    const badgeChanged =
      typeof fetched.contributorBadge === 'boolean' &&
      fetched.contributorBadge !== current.contributorBadge

    if (avatarChanged || nameChanged || emailChanged || badgeChanged) {
      setUserData({
        ...current,
        ...(avatarChanged ? { avatar: nextAvatar ?? undefined } : {}),
        ...(nameChanged && typeof fetched.name === 'string' ? { name: fetched.name } : {}),
        ...(emailChanged && typeof fetched.email === 'string' ? { email: fetched.email } : {}),
        ...(badgeChanged && typeof fetched.contributorBadge === 'boolean'
          ? { contributorBadge: fetched.contributorBadge }
          : {}),
      })
    }
  }, [data?.user, username, setUserData])
}
