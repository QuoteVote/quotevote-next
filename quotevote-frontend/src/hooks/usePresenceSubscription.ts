'use client'

import { useEffect } from 'react'
// Note: useSubscription may require additional Apollo Client subscription setup
// For now, this is a placeholder implementation
// TODO: Configure Apollo Client with subscription support (WebSocket link)
import { useAppStore } from '@/store'
import type { PresenceData } from '@/types/hooks'

/**
 * Custom hook to subscribe to presence updates
 * Automatically updates Zustand store when presence changes
 * 
 * NOTE: This hook requires Apollo Client to be configured with WebSocket/subscription support.
 * The subscription functionality is currently disabled pending proper Apollo setup.
 */
export const usePresenceSubscription = (): void => {
    const user = useAppStore((state) => state.user)
    const updatePresence = useAppStore((state) => state.updatePresence)

    useEffect(() => {
        // TODO: Implement subscription when Apollo Client WebSocket link is configured
        // const { data, error } = useSubscription(PRESENCE_SUBSCRIPTION, {
        //   variables: { userId: null },
        //   skip: !user,
        // })

        // For now, this is a placeholder
        if (!user) {
            console.warn('usePresenceSubscription: User not logged in')
        }

        // Example of how to update presence when subscription data arrives:
        // if (data?.presence) {
        //   const { userId, ...presenceData } = data.presence
        //   updatePresence(userId, presenceData)
        // }
    }, [user, updatePresence])
}

export default usePresenceSubscription
