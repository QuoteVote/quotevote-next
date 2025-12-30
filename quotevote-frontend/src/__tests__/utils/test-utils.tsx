/**
 * Test utilities for React Testing Library
 * 
 * Provides wrapper functions and helpers for testing Next.js App Router components
 */

import React, { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client'
import { ApolloProvider } from '@apollo/client/react'
import { setContext } from '@apollo/client/link/context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

/**
 * Create a test Apollo Client instance
 * This is a minimal client for testing purposes
 */
function createTestApolloClient() {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql',
    credentials: 'include',
  })

  const authLink = setContext((_, { headers }) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }
  })

  return new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  })
}

/**
 * All providers wrapper for testing
 * Includes: ErrorBoundary, ApolloProvider
 * Note: Zustand doesn't need a provider
 */
interface AllTheProvidersProps {
  children: React.ReactNode
  apolloClient?: ApolloClient
}

function AllTheProviders({ children, apolloClient }: AllTheProvidersProps) {
  const client = apolloClient || createTestApolloClient()

  return (
    <ErrorBoundary>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </ErrorBoundary>
  )
}

/**
 * Custom render function that includes all providers
 * 
 * @param ui - The component to render
 * @param options - Render options including custom providers
 * @returns Render result with all queries
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    apolloClient?: ApolloClient
  }
) {
  const { apolloClient, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AllTheProviders apolloClient={apolloClient}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { customRender as render }

// Explicitly export commonly used testing utilities
export {
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react'

// Export test utilities
export { createTestApolloClient, AllTheProviders }

