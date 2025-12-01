import { render, screen, fireEvent } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

// Mock component that throws an error
const ThrowError = () => {
    throw new Error('Test Error')
}

describe('ErrorBoundary', () => {
    const originalConsoleError = console.error

    beforeAll(() => {
        // Suppress console.error for expected errors
        console.error = jest.fn()
    })

    afterAll(() => {
        console.error = originalConsoleError
    })

    it('renders children when no error occurs', () => {
        render(
            <ErrorBoundary>
                <div>Safe Content</div>
            </ErrorBoundary>
        )
        expect(screen.getByText('Safe Content')).toBeInTheDocument()
    })

    it('renders default error UI when error occurs', () => {
        render(
            <ErrorBoundary>
                <ThrowError />
            </ErrorBoundary>
        )
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('renders custom fallback when provided', () => {
        render(
            <ErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ThrowError />
            </ErrorBoundary>
        )
        expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
    })

    it('calls onError prop when error occurs', () => {
        const handleError = jest.fn()
        render(
            <ErrorBoundary onError={handleError}>
                <ThrowError />
            </ErrorBoundary>
        )
        expect(handleError).toHaveBeenCalled()
    })
})
