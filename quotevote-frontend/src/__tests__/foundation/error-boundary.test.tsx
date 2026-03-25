/**
 * Error Boundary Tests
 *
 * Tests that the ErrorBoundary component catches render errors and
 * displays fallback UI instead of crashing the whole app.
 */

import { render, screen } from '../utils/test-utils'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Component that intentionally throws
const ThrowingComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test render error')
  }
  return <div data-testid="healthy-content">Content rendered successfully</div>
}

describe('ErrorBoundary', () => {
  // Suppress React's error logging for these tests
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByTestId('healthy-content')).toBeInTheDocument()
  })

  it('displays fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })

  it('does not render child content when error is caught', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.queryByTestId('healthy-content')).not.toBeInTheDocument()
  })

  it('renders multiple healthy children', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </ErrorBoundary>
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })

  it('catches errors from nested components', () => {
    const Wrapper = () => (
      <div>
        <ThrowingComponent shouldThrow={true} />
      </div>
    )

    render(
      <ErrorBoundary>
        <Wrapper />
      </ErrorBoundary>
    )
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
  })
})
