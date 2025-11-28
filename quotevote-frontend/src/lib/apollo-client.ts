import { ApolloClient, InMemoryCache, HttpLink, from, type ApolloClient as ApolloClientType } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { env } from '@/config/env';

/**
 * Get the GraphQL endpoint URL from validated environment configuration
 * 
 * @returns The GraphQL endpoint URL
 * @throws {Error} If required environment variables are not set
 */
function getGraphqlEndpoint(): string {
  return env.graphqlEndpoint;
}

/**
 * Create an HTTP link for GraphQL requests
 * This is SSR-safe as it doesn't reference window or other browser-only APIs
 * 
 * @returns Configured HttpLink instance
 */
function createHttpLink(): HttpLink {
  return new HttpLink({
    uri: getGraphqlEndpoint(),
    credentials: 'include', // Include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Create an auth link that adds authorization headers from localStorage
 * This only runs on the client side (browser)
 * 
 * @returns Configured auth link
 */
function createAuthLink() {
  return setContext((_, { headers }) => {
    // Only access localStorage on the client side
    if (typeof window === 'undefined') {
      return { headers };
    }

    const token = localStorage.getItem('token');
    const authHeaders: Record<string, string> = { ...headers };

    if (token) {
      // Remove 'Bearer ' prefix if already present to avoid duplication
      const cleanToken = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      authHeaders.authorization = cleanToken;
    }

    return {
      headers: authHeaders,
    };
  });
}

/**
 * Create and configure Apollo Client instance
 * This is SSR-aware and safe to use in both server and client components
 * 
 * @returns Configured Apollo Client instance
 */
function createApolloClient(): ApolloClientType {
  const httpLink = createHttpLink();
  const authLink = createAuthLink();

  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache({
      // Configure cache policies as needed
      typePolicies: {
        // Add type policies here for custom cache behavior
      },
    }),
    // Enable SSR mode for Next.js
    ssrMode: typeof window === 'undefined',
    // Default options for queries
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
      },
      query: {
        errorPolicy: 'all',
      },
    },
  });
}

// Create a singleton instance
// In Next.js App Router, we need to create a new client for each request in SSR
// but we can reuse the same client on the client side
let apolloClient: ApolloClientType | null = null;

/**
 * Get or create Apollo Client instance
 * For SSR, creates a new instance per request
 * For client-side, reuses the same instance
 * 
 * @returns Apollo Client instance
 */
export function getApolloClient(): ApolloClientType {
  // On the server, create a new client for each request
  if (typeof window === 'undefined') {
    return createApolloClient();
  }

  // On the client, reuse the same instance
  if (!apolloClient) {
    apolloClient = createApolloClient();
  }

  return apolloClient;
}

// Export the client creation function for testing or advanced use cases
export { createApolloClient };

