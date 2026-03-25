import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
