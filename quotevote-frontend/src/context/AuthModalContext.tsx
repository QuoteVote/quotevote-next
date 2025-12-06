'use client'

import { createContext, useState, useContext } from 'react'
import type {
  AuthModalContextValue,
  AuthModalProviderProps,
} from '@/types/context'

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined
)

/**
 * Provider for global invite modal state management
 */
export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openAuthModal = () => setIsModalOpen(true)
  const closeAuthModal = () => setIsModalOpen(false)

  const value: AuthModalContextValue = {
    isModalOpen,
    openAuthModal,
    closeAuthModal,
  }

  return (
    <AuthModalContext.Provider value={value}>
      {children}
    </AuthModalContext.Provider>
  )
}

/**
 * Hook to access invite modal state and controls
 * @throws {Error} When used outside AuthModalProvider
 */
export const useAuthModal = (): AuthModalContextValue => {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

