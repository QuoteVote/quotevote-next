import Link from 'next/link'
import Image from 'next/image'
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
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/icons/android-chrome-192x192.png"
            alt="Quote.Vote"
            width={32}
            height={32}
          />
          <span className="font-semibold text-lg text-foreground">Quote.Vote</span>
        </Link>
        <Button asChild variant="outline">
          <Link href="/auths/request-access">Request Access</Link>
        </Button>
      </div>
    </header>
  )
}
