'use client'

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import type { AlertListProps } from '@/types/components'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

/**
 * AlertSkeletonLoader Component
 * 
 * Displays skeleton loaders for alerts while data is loading.
 * Uses Tailwind CSS for styling.
 */
function AlertSkeletonLoader({ limit }: { limit: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: limit }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="relative w-full rounded-lg border px-4 py-3 animate-pulse bg-muted"
        >
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2" />
          <div className="h-3 bg-muted-foreground/20 rounded w-full" />
        </div>
      ))}
    </div>
  )
}

/**
 * AlertList Component
 * 
 * Renders a list of Alert components in sequence.
 * Supports loading states, empty states, and dismiss functionality.
 * Uses shadcn/ui Alert components and Tailwind CSS for styling.
 * 
 * @param alerts - Array of alert items to display
 * @param loading - Whether the component is in a loading state
 * @param skeletonLimit - Number of skeleton loaders to show when loading
 * @param emptyMessage - Message to display when there are no alerts
 * @param className - Additional CSS classes for the container
 */
export function AlertList({
  alerts,
  loading = false,
  skeletonLimit = 3,
  emptyMessage = 'No alerts to display',
  className,
}: AlertListProps) {
  // Show skeleton loader when loading
  if (loading) {
    return <AlertSkeletonLoader limit={skeletonLimit} />
  }

  // Show empty state when no alerts
  if (!alerts || alerts.length === 0) {
    return (
      <div className={cn('w-full text-center py-8 text-muted-foreground', className)}>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  // Render list of alerts
  return (
    <div className={cn('w-full space-y-4', className)}>
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          variant={alert.variant || 'default'}
          className="relative"
        >
          {alert.onDismiss && (
            <button
              type="button"
              onClick={() => alert.onDismiss?.(alert.id)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          )}
          {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
          {alert.description && (
            <AlertDescription>{alert.description}</AlertDescription>
          )}
        </Alert>
      ))}
    </div>
  )
}

