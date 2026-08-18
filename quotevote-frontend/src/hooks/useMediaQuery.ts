/**
 * Responsive media-query hooks.
 * Uses useSyncExternalStore so SSR and hydration both see `false`, then the
 * client snapshot applies after mount — no window reads during hydration.
 */

import { useCallback, useSyncExternalStore } from 'react'

function subscribeToQuery(query: string, onStoreChange: () => void): () => void {
  const media = window.matchMedia(query)
  const listener = () => onStoreChange()
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', listener)
  } else {
    media.addListener(listener)
  }
  return () => {
    if (typeof media.removeEventListener === 'function') {
      media.removeEventListener('change', listener)
    } else {
      media.removeListener(listener)
    }
  }
}

function getServerSnapshot(): boolean {
  return false
}

function subscribeToMounted(): () => void {
  return () => undefined
}

function getClientMountedSnapshot(): boolean {
  return true
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToQuery(query, onStoreChange),
    [query],
  )
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** False during SSR/hydration, true after the client has mounted. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(subscribeToMounted, getClientMountedSnapshot, getServerSnapshot)
}

export const useIsMobile = () => useMediaQuery('(max-width: 768px)')
export const useIsTablet = () => useMediaQuery('(min-width: 769px) and (max-width: 1024px)')
export const useIsDesktop = () => useMediaQuery('(min-width: 1025px)')
export const useIsLandscapeMobile = () =>
  useMediaQuery('(orientation: landscape) and (max-height: 500px)')
