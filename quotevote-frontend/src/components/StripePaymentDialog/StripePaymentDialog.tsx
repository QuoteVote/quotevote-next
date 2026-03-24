'use client'

import { useEffect, useRef, useSyncExternalStore } from 'react'
import { X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface StripePaymentDialogProps {
  open: boolean
  onClose: () => void
}

const STRIPE_BUY_BUTTON_ID = 'buy_btn_1RY6bhP3PjIJfZEbu5CpTDjo'
const STRIPE_PUBLISHABLE_KEY =
  'pk_live_51RXriSP3PjIJfZEb1tqnEGBOGFZBHREUxqWHeO22GASJ5It6MKfpakOE3oDtL7II20j5idUR6NuXrBlaKXvszY6q00nn8KxROy'

// External store for stripe script loaded state
let stripeLoaded = false
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function getSnapshot() {
  return stripeLoaded
}
function getServerSnapshot() {
  return false
}

function ensureStripeScript() {
  if (stripeLoaded) return
  if (typeof document === 'undefined') return

  const existing = document.querySelector('script[src*="buy-button.js"]')
  if (existing) {
    stripeLoaded = true
    listeners.forEach((cb) => cb())
    return
  }

  const script = document.createElement('script')
  script.src = 'https://js.stripe.com/v3/buy-button.js'
  script.async = true
  script.onload = () => {
    stripeLoaded = true
    listeners.forEach((cb) => cb())
  }
  document.body.appendChild(script)
}

function StripeBuyButton() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const btn = document.createElement('stripe-buy-button')
    btn.setAttribute('buy-button-id', STRIPE_BUY_BUTTON_ID)
    btn.setAttribute('publishable-key', STRIPE_PUBLISHABLE_KEY)
    el.appendChild(btn)

    return () => {
      el.innerHTML = ''
    }
  }, [])

  return <div ref={containerRef} />
}

export default function StripePaymentDialog({ open, onClose }: StripePaymentDialogProps) {
  const isLoaded = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  useEffect(() => {
    if (open) {
      ensureStripeScript()
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Support Our Mission
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground text-center">
            Your contribution helps us continue building amazing features
            and supporting our community.
          </p>

          <div className="flex justify-center min-h-[80px]">
            {isLoaded ? (
              <StripeBuyButton />
            ) : (
              <div className="flex items-center justify-center">
                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
