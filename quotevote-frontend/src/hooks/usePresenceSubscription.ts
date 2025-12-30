'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/store'
// TODO: Fix Apollo Client v4.0.9 type resolution issues
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useSubscription export
import { useSubscription } from '@apollo/client'
import { PRESENCE_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { PresenceSubscriptionResult } from '@/types/hooks'

/**
 * Custom hook to subscribe to presence updates
 * Automatically updates Zustand store when presence changes
 * 
 * When userId is null, subscribes to all users' presence updates (matches old client behavior)
 */
export const usePresenceSubscription = (): void => {
    const user = useAppStore((state) => state.user)
    const updatePresence = useAppStore((state) => state.updatePresence)

    // Subscribe to all presence updates (userId: null means all users)
    // Only skip if user is not logged in
    const { data, error } = useSubscription<PresenceSubscriptionResult>(PRESENCE_SUBSCRIPTION, {
        variables: { userId: null },
        skip: !user.data?.id,
    })

    useEffect(() => {
        if (error) {
            // Log error in development mode only
            if (process.env.NODE_ENV === 'development') {
                console.error('[Presence Subscription] Error:', error)
            }
        }

        if (data?.presence) {
            const { userId, status, statusMessage, lastSeen } = data.presence
            updatePresence(userId, {
                status: status || 'offline',
                statusMessage: statusMessage || '',
                lastSeen: lastSeen ? new Date(lastSeen).getTime() : Date.now(),
            })
        }
    }, [data, error, updatePresence])
}

export default usePresenceSubscription
