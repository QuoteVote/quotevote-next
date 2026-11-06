import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { buildPageMetadata, pageTitle } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: pageTitle('Session expired'),
  description: 'Your Quote.Vote session has expired. Sign in again to continue.',
  path: '/unauth',
  noIndex: true,
})

export default function UnauthPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="bg-card rounded-xl shadow-sm w-full max-w-md p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Your session has expired</h1>
        <p className="text-muted-foreground">Please sign in again to continue.</p>
        <Button asChild>
          <Link href="/auths/login">Sign In</Link>
        </Button>
      </div>
    </div>
  )
}
