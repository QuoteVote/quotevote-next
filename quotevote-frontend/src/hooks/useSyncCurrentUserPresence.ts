'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@apollo/client/react'
import { GET_USER_PRESENCE } from '@/graphql/queries'
import { useAppStore } from '@/store/useAppStore'
import { isDeclaredStatus } from '@/lib/utils/presence'
import type { UserPresenceQueryData } from '@/types/hooks'

/** How long to wait before asking again when the first answer was "offline". */
const OFFLINE_RETRY_DELAY_MS = 3000

/**
 * Loads the status the signed-in user picked earlier, so it survives a reload
 * or a new device: "Selected status persists until changed" (#468).
 *
 * - Read-only. It never writes a status; only the Set Your Status dialog does,
 *   so a status changes only when the user changes it.
 * - Applied once per sign-in, and never over a status the user has already
 *   chosen in this session (see `hydrateUserStatus`).
 * - "offline" is not a status anyone picks (it means "no record yet", or "the
 *   server marked a stale heartbeat"), so it is ignored and the default
 *   (Invisible) stays. The heartbeat that starts on load can restore the real
 *   status a moment later, so one more read is made after a short delay.
 * - A failed request leaves the default in place; nothing breaks.
 */
export function useSyncCurrentUserPresence(): void {
  const userId = useAppStore((state) => {
    const { _id, id } = state.user.data
    if (typeof _id === 'string' && _id) return _id
    return typeof id === 'string' && id ? id : undefined
  })
  const hydrateUserStatus = useAppStore((state) => state.hydrateUserStatus)
  const retriesRef = useRef(0)

  const { data, refetch } = useQuery<UserPresenceQueryData>(GET_USER_PRESENCE, {
    variables: { userId: userId ?? '' },
    skip: !userId,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  })

  useEffect(() => {
    retriesRef.current = 0
  }, [userId])

  useEffect(() => {
    const presence = data?.getPresence
    if (!userId || !presence) return undefined

    if (isDeclaredStatus(presence.status)) {
      // Invisible has no public message, so never carry one over.
      hydrateUserStatus(
        presence.status,
        presence.status === 'invisible' ? '' : (presence.statusMessage ?? '')
      )
      return undefined
    }

    if (retriesRef.current >= 1) return undefined
    const timer = setTimeout(() => {
      retriesRef.current += 1
      void refetch()
    }, OFFLINE_RETRY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [data, userId, hydrateUserStatus, refetch])
}

export default useSyncCurrentUserPresence
