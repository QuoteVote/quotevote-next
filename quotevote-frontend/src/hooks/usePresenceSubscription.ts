'use client'

import { useEffect } from 'react'
// Note: useSubscription may require additional Apollo Client subscription setup
// For now, this is a placeholder implementation
// TODO: Configure Apollo Client with subscription support (WebSocket link)
import { useAppStore } from '@/store'

/**
 * Custom hook to subscribe to presence updates
 * Automatically updates Zustand store when presence changes
 * 
 * NOTE: This hook requires Apollo Client to be configured with WebSocket/subscription support.
 * The subscription functionality is currently disabled pending proper Apollo setup.
 */
// TODO: Fix Apollo Client v4.0.9 type resolution issues
// @ts-expect-error - Apollo Client v4.0.9 has type resolution issues with useSubscription export
import { useSubscription } from '@apollo/client'
import { PRESENCE_SUBSCRIPTION } from '@/graphql/subscriptions'
import type { PresenceSubscriptionResult } from '@/types/hooks'

/**
 * Custom hook to subscribe to presence updates
 * Automatically updates Zustand store when presence changes
 */
export const usePresenceSubscription = (): void => {
    const user = useAppStore((state) => state.user)
    const updatePresence = useAppStore((state) => state.updatePresence)

    const { data, error } = useSubscription<PresenceSubscriptionResult>(PRESENCE_SUBSCRIPTION, {
        variables: { userId: user.data.id },
        skip: !user.data.id,
    })

    useEffect(() => {
        if (error) {
            // console.error('Presence subscription error:', error)
        }

        if (data?.presence) {
            const { userId, isOnline, lastSeen, ...rest } = data.presence
            updatePresence(userId, {
                status: isOnline ? 'online' : 'offline',
                statusMessage: (rest.statusMessage as string) || '',
                lastSeen: lastSeen ? new Date(lastSeen).getTime() : Date.now(),
            })
        }
    }, [data, error, updatePresence])
}

export default usePresenceSubscription
