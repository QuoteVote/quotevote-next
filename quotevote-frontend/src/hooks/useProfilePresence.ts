'use client'

import { useQuery } from '@apollo/client/react'
import { GET_USER_PRESENCE } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import { getPublicPresence } from '@/lib/utils/presence'
import type { PublicPresence } from '@/types/chat'
import type { UserPresenceQueryData } from '@/types/hooks'

/**
 * What the public may see of a profile owner's availability (#468): their
 * status for the avatar indicator and their status message for the header.
 * `null` means show nothing (Invisible, Offline, unknown, or not loaded yet).
 *
 * - Your own profile reads the status you picked from the store, so it
 *   changes the moment you save the Set Your Status dialog.
 * - Anyone else's is read with `getPresence`. A newer live update from the
 *   presence subscription (kept in the store) wins over an older query result,
 *   so the indicator follows a change while you are looking at the profile.
 * - All the hiding rules live in `getPublicPresence`.
 */
export function useProfilePresence(
  userId: string | undefined,
  isOwnProfile: boolean
): PublicPresence | null {
  const ownStatus = useAppStore((state) => state.chat.userStatus)
  const ownStatusMessage = useAppStore((state) => state.chat.userStatusMessage)
  const live = useAppStore((state) => (userId ? state.chat.presenceMap[userId] : undefined))

  const { data } = useQuery<UserPresenceQueryData>(GET_USER_PRESENCE, {
    variables: { userId: userId ?? '' },
    skip: isOwnProfile || !userId,
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
  })

  if (isOwnProfile) return getPublicPresence(ownStatus, ownStatusMessage)

  const queried = data?.getPresence
  const queriedAt = queried?.lastSeen ? new Date(queried.lastSeen).getTime() : 0
  const source = live && live.lastSeen > queriedAt ? live : queried

  return source ? getPublicPresence(source.status, source.statusMessage) : null
}

export default useProfilePresence
