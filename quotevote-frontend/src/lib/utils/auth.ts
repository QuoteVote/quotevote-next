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
  } catch (_err) {
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


// src/lib/utils/auth.ts

/**
 * Validate if a token exists and is valid
 */
export function tokenValidator(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const token = localStorage.getItem('token') || 
                  sessionStorage.getItem('token') ||
                  document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
    
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Get the current auth token
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem('token') || 
           sessionStorage.getItem('token') ||
           document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] || 
           null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */

/**
 * Remove auth token (logout)
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Set auth token
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
}

