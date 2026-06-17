'use client'

import { createContext, useState, useContext, useCallback } from 'react'
import type {
  AuthModalContextValue,
  AuthModalProviderProps,
  AuthModalView,
} from '@/types/context'

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined
)

/**
 * Provider for global auth / request-invite modal state
 */
export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalView, setModalView] = useState<AuthModalView>('invite')

  const openAuthModal = useCallback((options?: { view?: AuthModalView }) => {
    setModalView(options?.view ?? 'invite')
    setIsModalOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsModalOpen(false)
    setModalView('invite')
  }, [])

  const value: AuthModalContextValue = {
    isModalOpen,
    modalView,
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
 * Hook to access auth modal state and controls
 * @throws {Error} When used outside AuthModalProvider
 */
export const useAuthModal = (): AuthModalContextValue => {
  const context = useContext(AuthModalContext)
  if (context === undefined) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}
