import { useCallback } from 'react'
import { hasActiveSession } from '@/lib/utils/auth'
import { useAuthModal } from '@/context/AuthModalContext'
import { useAppStore } from '@/store/useAppStore'

/**
 * Guard guest interactions by showing the auth modal instead of redirecting.
 * Returns a function that resolves to false when not authenticated.
 *
 * Uses the Zustand session (same signal as the dashboard chrome) in addition to
 * the JWT check, so a persisted logged-in user is not treated as a guest when
 * the access token is briefly missing/expired.
 */
export default function useGuestGuard() {
  const { openAuthModal } = useAuthModal()
  // Re-subscribe so the guard updates when login/logout changes store state.
  useAppStore((state) => state.user.data._id || state.user.data.id)

  return useCallback(() => {
    if (hasActiveSession()) {
      return true
    }
    openAuthModal({ view: 'login' })
    return false
  }, [openAuthModal])
}
