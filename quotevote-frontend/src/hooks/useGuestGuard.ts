import { useCallback } from 'react'
import { isAuthenticated } from '@/lib/utils/auth'
import { useAuthModal } from '@/context/AuthModalContext'

/**
 * Guard guest interactions by showing the auth modal instead of redirecting.
 * Returns a function that resolves to false when not authenticated.
 */
export default function useGuestGuard() {
    const { openAuthModal } = useAuthModal()

    return useCallback(() => {
        if (!isAuthenticated()) {
            openAuthModal()
            return false
        }
        return true
    }, [openAuthModal])
}
