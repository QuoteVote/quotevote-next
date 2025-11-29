import { jwtDecode } from 'jwt-decode'
import { DecodedToken } from '@/types/store'

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
  } catch (err) {
    return false
  }
}

export function requireAuth<Args extends unknown[], R>(action: (...args: Args) => R) {
  return (...args: Args): R | void => {
    if (!isAuthenticated()) {
      window.location.assign(
        `https://quote.vote/invite?from=${window.location.pathname}`,
      )
      return
    }
    return action(...args)
  }
}
