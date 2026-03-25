import { AuthNavbar } from '@/components/Navbars/AuthNavbar'
import type { ReactNode } from 'react'

/**
 * Auth Layout
 *
 * Server Component layout for all authentication pages.
 * Provides a white card centered layout with AuthNavbar.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AuthNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm w-full max-w-md p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
