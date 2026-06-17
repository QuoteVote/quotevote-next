'use client'

import { Suspense, useEffect } from 'react'
import { useAuthModal } from '@/context/AuthModalContext'
import { RequestInviteDialog } from '@/components/RequestInviteDialog'
import { registerAuthGateHandler } from '@/lib/auth-gate'

/**
 * Global auth gate dialog — mounted once in the root layout so guests on any
 * route see the invite/login modal instead of being redirected away.
 */
export function AuthGateDialog() {
  const { isModalOpen, modalView, openAuthModal, closeAuthModal } = useAuthModal()

  useEffect(() => {
    registerAuthGateHandler((options) => openAuthModal(options))
    return () => registerAuthGateHandler(null)
  }, [openAuthModal])

  return (
    <Suspense fallback={null}>
      <RequestInviteDialog
        open={isModalOpen}
        onClose={closeAuthModal}
        view={modalView}
      />
    </Suspense>
  )
}
