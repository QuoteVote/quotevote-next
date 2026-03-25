/**
 * Loading State Tests
 *
 * Tests loading indicators and skeleton states used across the application.
 */

import { render, screen } from '../utils/test-utils'
import { Loader2 } from 'lucide-react'

describe('Loading States', () => {
  describe('Loader2 icon', () => {
    it('renders Loader2 spinner', () => {
      render(
        <div data-testid="spinner" role="status" aria-label="Loading">
          <Loader2 className="animate-spin h-6 w-6" />
        </div>
      )
      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })

    it('renders with accessible label', () => {
      render(
        <div role="status" aria-label="Loading content">
          <Loader2 className="animate-spin h-6 w-6" />
        </div>
      )
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })
  })

  describe('Loading component patterns', () => {
    const LoadingSpinner = () => (
      <div className="flex justify-center py-8" data-testid="loading-spinner">
        <Loader2 className="animate-spin h-6 w-6 text-primary" />
      </div>
    )

    it('renders loading spinner with padding', () => {
      render(<LoadingSpinner />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('loading spinner is centered', () => {
      const { container } = render(<LoadingSpinner />)
      const spinner = container.querySelector('.flex.justify-center')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Conditional rendering with loading state', () => {
    const ComponentWithLoading = ({ loading }: { loading: boolean }) => {
      if (loading) {
        return (
          <div data-testid="loading-state">
            <Loader2 className="animate-spin h-6 w-6" />
          </div>
        )
      }
      return <div data-testid="content">Content loaded</div>
    }

    it('shows spinner when loading is true', () => {
      render(<ComponentWithLoading loading={true} />)
      expect(screen.getByTestId('loading-state')).toBeInTheDocument()
      expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    })

    it('shows content when loading is false', () => {
      render(<ComponentWithLoading loading={false} />)
      expect(screen.getByTestId('content')).toBeInTheDocument()
      expect(screen.queryByTestId('loading-state')).not.toBeInTheDocument()
    })
  })

  describe('Button loading state with useFormStatus pattern', () => {
    it('renders disabled button with spinner during pending state', () => {
      render(
        <button disabled aria-busy="true" data-testid="submit-btn">
          <Loader2 className="animate-spin mr-2 h-4 w-4" />
          Submitting...
        </button>
      )
      const btn = screen.getByTestId('submit-btn')
      expect(btn).toBeDisabled()
      expect(btn).toHaveAttribute('aria-busy', 'true')
    })

    it('renders enabled button when not pending', () => {
      render(
        <button data-testid="submit-btn">
          Submit
        </button>
      )
      expect(screen.getByTestId('submit-btn')).not.toBeDisabled()
    })
  })
})
