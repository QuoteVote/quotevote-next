import type { ReactNode } from 'react'
import { AuthNavbar } from '@/components/Navbars/AuthNavbar'

export default function CardAuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthNavbar />
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-card rounded-xl shadow-sm w-full max-w-md p-8">{children}</div>
      </main>
    </>
  )
}
