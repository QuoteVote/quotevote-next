import Link from 'next/link'
import { Globe } from '@/components/Icons'
import { Button } from '@/components/ui/button'

/**
 * AuthNavbar Component
 *
 * Server Component navigation bar for authentication pages.
 * Shows logo on the left, "Request Access" button on the right.
 */
export function AuthNavbar() {
  return (
    <header className="bg-card border-b border-border">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Quote.Vote home">
          <Globe size={32} className="size-8" />
          <span className="font-semibold text-lg text-foreground">Quote.Vote</span>
        </Link>
        <Button asChild variant="outline">
          <Link href="/auths/request-access">Request Access</Link>
        </Button>
      </div>
    </header>
  )
}
