'use client'

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * ErrorBoundary component catches React errors in its child component tree.
 * It displays a fallback UI instead of crashing the whole app.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-200 dark:border-red-900 shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                Something went wrong
              </CardTitle>
              <CardDescription>
                We encountered an unexpected error while rendering this component.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-2 rounded-md bg-slate-100 dark:bg-slate-900 p-3 text-xs overflow-auto max-h-48 border border-slate-200 dark:border-slate-800">
                  <p className="font-mono font-semibold text-red-500 mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  <pre className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
              <Button onClick={this.resetErrorBoundary} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                <RefreshCcw className="h-4 w-4" />
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
