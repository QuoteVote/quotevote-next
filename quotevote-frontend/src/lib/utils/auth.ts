import { jwtDecode } from 'jwt-decode'
import { DecodedToken } from '@/types/store'
import { triggerAuthGate } from '@/lib/auth-gate'
import { useAppStore } from '@/store/useAppStore'

export function isAuthenticated(): boolean {
  const token = localStorage.getItem('token')
  if (!token) return false
  try {
    const decoded = jwtDecode<DecodedToken>(token)
    const currentTime = Date.now() / 1000
    if (decoded.exp && decoded.exp < currentTime) {
      return false
    }
    return true
  } catch (_err) {
    return false
  }
}

/** True when JWT is valid or the persisted session user is present (dashboard chrome). */
export function hasActiveSession(): boolean {
  if (typeof window === 'undefined') return false
  const data = useAppStore.getState().user.data
  if (data._id || data.id) return true
  return isAuthenticated()
}

export function requireAuth<Args extends unknown[], R>(action: (...args: Args) => R) {
  return (...args: Args): R | void => {
    if (!hasActiveSession()) {
      triggerAuthGate({ view: 'login' })
      return
    }
    return action(...args)
  }
}
