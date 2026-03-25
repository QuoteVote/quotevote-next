'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApolloClient } from '@apollo/client/react'
import { Loader2 } from 'lucide-react'
import { removeToken } from '@/lib/auth'
import { useAppStore } from '@/store/useAppStore'

/**
 * LogoutPage Component
 *
 * Handles user logout by:
 * - Clearing authentication token from localStorage and cookie
 * - Resetting Apollo Client store
 * - Clearing Zustand auth state
 * - Redirecting to home page
 */
export function LogoutPage() {
  const router = useRouter()
  const client = useApolloClient()
  const resetStore = useAppStore((s) => s.resetStore)

  useEffect(() => {
    const performLogout = async () => {
      removeToken()
      resetStore()
      await client.resetStore()
      router.push('/')
    }
    performLogout()
  }, [client, resetStore, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="animate-spin h-8 w-8 text-primary" />
      <p className="text-foreground font-medium">Signing you out…</p>
    </div>
  )
}
