'use client'

import { useAppStore } from '@/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthModal } from '@/context/AuthModalContext'

/**
 * SearchGuestSections component
 *
 * Renders a sign-up CTA for unauthenticated users below the search results.
 * Returns null if the user is already logged in.
 */
export default function SearchGuestSections() {
  const user = useAppStore((state) => state.user.data)
  const { openAuthModal } = useAuthModal()

  if (user?._id || user?.id) return null

  return (
    <Card className="mt-4">
      <CardContent className="p-6 text-center space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Join Quote.Vote</h3>
          <p className="text-muted-foreground text-sm">
            Sign up to see trending posts, vote on quotes, and join the discussion.
          </p>
        </div>
        <div className="space-y-2 opacity-50 blur-sm pointer-events-none">
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
          <div className="h-8 bg-muted rounded" />
        </div>
        <Button onClick={openAuthModal} className="w-full">
          Sign up to read more
        </Button>
      </CardContent>
    </Card>
  )
}
