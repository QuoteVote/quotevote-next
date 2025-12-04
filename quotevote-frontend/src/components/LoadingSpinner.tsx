import type { LoadingSpinnerProps } from '@/types/components'
import { cn } from '@/lib/utils'

/**
 * LoadingSpinner Component
 * 
 * A centered loading spinner with customizable size and margin.
 * Uses Tailwind CSS for styling with a custom animated spinner.
 * 
 * @param size - Size of the spinner in pixels (default: 80)
 * @param marginTop - Top margin for the spinner container (default: '15px')
 */
export function LoadingSpinner({ size = 80, marginTop = '15px' }: LoadingSpinnerProps) {
  return (
    <div 
      className="flex items-center justify-center w-full"
      style={{ marginTop }}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-4 border-solid',
          'border-[var(--color-primary)] border-t-transparent'
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}

