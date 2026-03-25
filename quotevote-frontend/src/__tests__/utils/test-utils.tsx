/**
 * Test utilities for React Testing Library
 *
 * Provides wrapper functions and helpers for testing Next.js App Router components.
 * Uses MockLink from Apollo (Apollo 4 removed MockedProvider) so tests never hit the network.
 */

import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { MockLink, type MockedResponse } from '@apollo/client/testing';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthModalProvider } from '@/context/AuthModalContext';
import { useAppStore } from '@/store/useAppStore';

export type { MockedResponse };

/**
 * Reset Zustand store to initial state.
 * Call this in `beforeEach` when testing components that read from the store.
 */
export function resetStore() {
  useAppStore.getState().resetStore();
}

/**
 * Create an Apollo client backed by MockLink so tests never hit the network.
 */
export function createMockApolloClient(mocks: MockedResponse[] = []) {
  return new ApolloClient({
    link: new MockLink(mocks),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { errorPolicy: 'all' },
      query: { errorPolicy: 'all' },
    },
  });
}

interface AllTheProvidersProps {
  children: React.ReactNode;
  mocks?: MockedResponse[];
}

function AllTheProviders({ children, mocks = [] }: AllTheProvidersProps) {
  const client = createMockApolloClient(mocks);
  return (
    <ApolloProvider client={client}>
      <AuthModalProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        {typeof Toaster === 'function' && <Toaster />}
      </AuthModalProvider>
    </ApolloProvider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  mocks?: MockedResponse[];
}

/**
 * Custom render function that wraps the component with all providers.
 *
 * @example
 * render(<MyComponent />, { mocks: [myGraphQLMock] })
 */
function customRender(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { mocks, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <AllTheProviders mocks={mocks}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };

// Explicitly export commonly used testing utilities
export { screen, fireEvent, waitFor, act } from '@testing-library/react';

// Export providers and helpers
export { AllTheProviders, AllTheProviders as TestWrapper };

// Backward-compatible alias — was `createTestApolloClient` in the original test-utils
export { createMockApolloClient as createTestApolloClient };
