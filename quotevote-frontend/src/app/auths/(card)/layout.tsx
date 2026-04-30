import type { ReactNode } from 'react'

export default function CardAuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-8">
      <div className="bg-card rounded-xl shadow-sm w-full max-w-md p-8">{children}</div>
    </main>
  )
}
