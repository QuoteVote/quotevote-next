'use client'

import { useEffect } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_USER } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'

type SyncedPresence = {
  status?: string | null
  statusMessage?: string | null
  preferredStatus?: string | null
  preferredStatusMessage?: string | null
}

type SyncedUserFields = {
  avatar?: string | Record<string, unknown> | null
  name?: string | null
  bio?: string | null
  email?: string | null
  contributorBadge?: boolean | null
  presence?: SyncedPresence | null
}

const PRESENCE_STATUSES = new Set(['online', 'away', 'dnd', 'invisible', 'offline'])

function resolveOwnStatus(presence: SyncedPresence): { status: string; statusMessage: string } {
  const preferred =
    typeof presence.preferredStatus === 'string' && PRESENCE_STATUSES.has(presence.preferredStatus)
      ? presence.preferredStatus
      : null
  const raw = preferred ?? presence.status ?? 'online'
  // You're actively loading the app — don't show yourself as offline.
  const status = raw === 'offline' ? 'online' : raw
  const fromPreferred =
    typeof presence.preferredStatusMessage === 'string' ? presence.preferredStatusMessage : null
  const fromCurrent =
    typeof presence.statusMessage === 'string' ? presence.statusMessage : null
  return {
    status,
    statusMessage: fromPreferred ?? fromCurrent ?? '',
  }
}

/**
 * Keeps the persisted Zustand user (used by nav / account menu avatars) in sync
 * with the latest profile from GraphQL. Login historically omitted `avatar`, so
 * without this sync the nav shows a seeded default while the profile page is correct.
 *
 * Also restores presence (status + message) from the server — Zustand defaults to
 * online/empty on hard reload even though Presence is saved in MongoDB.
 */
export function useSyncCurrentUserProfile(): void {
  const username = useAppStore((state) =>
    typeof state.user.data.username === 'string' ? state.user.data.username : undefined
  )
  const setUserData = useAppStore((state) => state.setUserData)
  const setUserStatus = useAppStore((state) => state.setUserStatus)

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
    const bioChanged =
      typeof fetched.bio === 'string' && fetched.bio !== (current.bio as string | undefined)
    const emailChanged =
      typeof fetched.email === 'string' &&
      fetched.email.length > 0 &&
      fetched.email !== current.email
    const badgeChanged =
      typeof fetched.contributorBadge === 'boolean' &&
      fetched.contributorBadge !== current.contributorBadge

    if (avatarChanged || nameChanged || bioChanged || emailChanged || badgeChanged) {
      setUserData({
        ...current,
        ...(avatarChanged ? { avatar: nextAvatar ?? undefined } : {}),
        ...(nameChanged && typeof fetched.name === 'string' ? { name: fetched.name } : {}),
        ...(bioChanged && typeof fetched.bio === 'string' ? { bio: fetched.bio } : {}),
        ...(emailChanged && typeof fetched.email === 'string' ? { email: fetched.email } : {}),
        ...(badgeChanged && typeof fetched.contributorBadge === 'boolean'
          ? { contributorBadge: fetched.contributorBadge }
          : {}),
      })
    }

    const presence = fetched.presence
    if (!presence?.status && !presence?.preferredStatus) return
    if (presence.status && !PRESENCE_STATUSES.has(presence.status) && !presence.preferredStatus) {
      return
    }

    const { status, statusMessage } = resolveOwnStatus(presence)
    const chat = useAppStore.getState().chat
    if (chat.userStatus === status && chat.userStatusMessage === statusMessage) return

    setUserStatus(status, statusMessage)
  }, [data?.user, username, setUserData, setUserStatus])
}
