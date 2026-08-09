'use client'

import { useEffect, useRef } from 'react'
import { useMutation } from '@apollo/client/react'
import { HEARTBEAT } from '@/graphql/mutations'
import { isAuthenticated } from '@/lib/utils/auth'
import type { UsePresenceHeartbeatReturn } from '@/types/hooks'

/**
 * The deployed API's `HeartbeatResponse` carries only `success` and `timestamp`,
 * so the heartbeat keeps presence alive but cannot report status back.
 */
type HeartbeatResult = {
  heartbeat?: {
    success: boolean
    timestamp?: string
  } | null
}

/**
 * Custom hook to send periodic heartbeat to keep presence alive
 * @param interval - Heartbeat interval in milliseconds (default: 45000 = 45 seconds)
 */
export const usePresenceHeartbeat = (interval: number = 45000): UsePresenceHeartbeatReturn => {
  const [heartbeat, { error }] = useMutation<HeartbeatResult>(HEARTBEAT)
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3
  const backoffMultiplier = 2

  useEffect(() => {
    if (!isAuthenticated()) {
      return
    }

    const getRetryDelay = (attempt: number): number => {
      return Math.min(interval * Math.pow(backoffMultiplier, attempt), 300000)
    }

    const sendHeartbeat = async (): Promise<void> => {
      try {
        await heartbeat()
        retryCountRef.current = 0
      } catch {
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1
          const delay = getRetryDelay(retryCountRef.current)
          setTimeout(() => {
            void sendHeartbeat()
          }, delay)
        } else {
          setTimeout(() => {
            retryCountRef.current = 0
          }, interval * 5)
        }
      }
    }

    let timer: ReturnType<typeof setInterval> | null = null

    const startHeartbeat = () => {
      void sendHeartbeat()
      timer = setInterval(() => {
        void sendHeartbeat()
      }, interval)
    }

    const stopHeartbeat = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat()
      } else {
        startHeartbeat()
      }
    }

    startHeartbeat()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopHeartbeat()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [heartbeat, interval])

  return { error }
}

export default usePresenceHeartbeat
