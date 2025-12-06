'use client'

import { useRouter } from 'next/navigation'
import { Copy, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { SubmitPostAlertProps } from '@/types/components'
// Note: Using process.env directly for client-side access

export function SubmitPostAlert({
  hideAlert,
  shareableLink,
  error,
  setShowAlert,
  setOpen,
}: SubmitPostAlertProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  // Use NEXT_PUBLIC_SERVER_URL for client-side access
  const DOMAIN = process.env.NEXT_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_DOMAIN || 'localhost:3000'
  const fullLink = shareableLink ? `${DOMAIN}${shareableLink.replace(/\?/g, '')}` : ''

  const handleCopy = async () => {
    if (fullLink) {
      try {
        await navigator.clipboard.writeText(fullLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const goToPost = async () => {
    if (shareableLink) {
      await router.push(shareableLink.replace(/\?/g, ''))
      setShowAlert(false)
      setOpen(false)
    }
  }

  if (error) {
    return (
      <Dialog open onOpenChange={() => hideAlert()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Error
            </DialogTitle>
            <DialogDescription>
              An error occurred while creating your post.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : typeof error === 'object' && error !== null && 'message' in error
                  ? String(error.message)
                  : (error && typeof error === 'object' && 'toString' in error && typeof error.toString === 'function')
                    ? error.toString()
                    : 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button onClick={hideAlert} variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={() => hideAlert()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Post Created Successfully!
          </DialogTitle>
          <DialogDescription>
            Share your post with friends and family.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Alert variant="success">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your post has been created successfully.
            </AlertDescription>
          </Alert>
          {fullLink && (
            <div className="flex items-center gap-2 rounded-md border p-3">
              <code className="flex-1 overflow-auto text-sm">{fullLink}</code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                title="Copy link to clipboard"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={hideAlert}>
            Close
          </Button>
          <Button onClick={goToPost} disabled={!shareableLink}>
            Go to Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

