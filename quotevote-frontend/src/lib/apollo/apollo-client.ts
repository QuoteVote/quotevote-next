import { ApolloClient, InMemoryCache, HttpLink, from, split, ApolloLink, type ApolloClient as ApolloClientType } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getMainDefinition } from '@apollo/client/utilities';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { map } from 'rxjs';
import { env } from '@/config/env';
import { getGraphqlWsServerUrl } from '@/lib/utils/getServerUrl';
import { serializeObjectIds } from '@/lib/utils/objectIdSerializer';

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
 * Create a WebSocket link for GraphQL subscriptions
 * Only available on the client side (browser)
 * Includes enhanced error handling and logging for disconnects/reconnects
 * 
 * @returns Configured WebSocket link or null if on server
 */
function createWsLink(): GraphQLWsLink | null {
  // WebSocket links only work in the browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Track retry attempts to prevent infinite loops
  let retryCount = 0;
  let retryResetTimeout: NodeJS.Timeout | null = null;
  const MAX_RETRY_ATTEMPTS = 10; // Maximum retry attempts before giving up
  const RETRY_RESET_DELAY = 60000; // Reset retry count after 60 seconds

  // Logging utility (only in development)
  const log = (message: string, ...args: unknown[]): void => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebSocket] ${message}`, ...args);
    }
  };

  const logError = (message: string, error?: unknown): void => {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[WebSocket Error] ${message}`, error);
    }
  };

  return new GraphQLWsLink(
    createClient({
      url: getGraphqlWsServerUrl(),
      connectionParams: () => {
        const token = localStorage.getItem('token');
        const authToken = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : undefined;
        log('Connecting with auth token', authToken ? 'present' : 'missing');
        return {
          authToken,
        };
      },
      retryAttempts: MAX_RETRY_ATTEMPTS,
      shouldRetry: (errOrCloseEvent) => {
        // Don't retry if we've exceeded max attempts
        if (retryCount >= MAX_RETRY_ATTEMPTS) {
          logError(`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Scheduling reset.`);
          // Schedule a reset of retry count after RETRY_RESET_DELAY
          if (retryResetTimeout) {
            clearTimeout(retryResetTimeout);
          }
          retryResetTimeout = setTimeout(() => {
            log('Resetting retry count after delay');
            retryCount = 0;
          }, RETRY_RESET_DELAY);
          return false;
        }

        // Clear any existing reset timeout since we're retrying
        if (retryResetTimeout) {
          clearTimeout(retryResetTimeout);
          retryResetTimeout = null;
        }

        // Check for specific error codes that shouldn't be retried
        if (errOrCloseEvent && typeof errOrCloseEvent === 'object' && 'code' in errOrCloseEvent) {
          const code = errOrCloseEvent.code as number;
          if (code === 1001 || code === 1002) {
            // 1001: Going Away, 1002: Protocol Error - don't retry
            logError(`Connection error code ${code} - not retrying`);
            return false;
          }

          // Check if connection was cleanly closed (code 1000)
          if (code === 1000 && 'wasClean' in errOrCloseEvent && errOrCloseEvent.wasClean) {
            log('Connection cleanly closed - not retrying');
            return false;
          }
        }

        retryCount++;
        log(`Retrying connection (attempt ${retryCount}/${MAX_RETRY_ATTEMPTS})`);
        return true;
      },
      on: {
        opened: () => {
          log('WebSocket connection opened');
          // Reset retry count on successful connection
          retryCount = 0;
          if (retryResetTimeout) {
            clearTimeout(retryResetTimeout);
            retryResetTimeout = null;
          }
        },
        closed: (event?: unknown) => {
          if (event && typeof event === 'object' && 'code' in event) {
            const closeEvent = event as { code?: number; reason?: string; wasClean?: boolean };
            log(`WebSocket connection closed: code=${closeEvent.code}, reason=${closeEvent.reason || 'none'}, wasClean=${closeEvent.wasClean}`);
          } else {
            log('WebSocket connection closed');
          }
        },
        error: (error?: unknown) => {
          logError('WebSocket connection error', error);
        },
      },
    })
  );
}

/**
 * Create an error link to handle network and GraphQL errors
 * 
 * @returns Configured error link
 */
function createErrorLink() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return onError((error: any) => {
    // Errors are handled silently to prevent console spam
    // You can add logging here if needed for debugging
    if (error?.graphQLErrors) {
      // GraphQL errors handled silently
    }

    if (error?.networkError) {
      // Network errors handled silently
    }
  });
}

/**
 * Create a link to handle ObjectID serialization
 * 
 * @returns Configured ObjectID serialization link
 */
function createObjectIdSerializationLink() {
  return new ApolloLink((operation, forward) => {
    return forward(operation).pipe(
      map((response) => {
        if (response.data) {
          // Recursively serialize ObjectIDs in the response
          const serialized = serializeObjectIds(response.data);
          // Ensure we return the correct type
          if (typeof serialized === 'object' && serialized !== null && !Array.isArray(serialized)) {
            response.data = serialized as Record<string, unknown>;
          }
        }
        return response;
      })
    );
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
  const errorLink = createErrorLink();
  const objectIdSerializationLink = createObjectIdSerializationLink();
  const wsLink = createWsLink();

  // Create HTTP link chain with error handling, auth, and ObjectID serialization
  // Note: Type assertion needed due to pnpm dependency resolution creating
  // separate instances of ApolloLink types from different packages
  const httpLinkChain = from([
    errorLink as unknown as ApolloLink,
    authLink,
    objectIdSerializationLink,
    httpLink,
  ]);

  // Split link: subscriptions go to WebSocket, queries/mutations go to HTTP
  // On server, only use HTTP link (no WebSocket support)
  // Note: Type assertion needed due to pnpm dependency resolution creating
  // separate instances of ApolloLink types from different packages
  const link = typeof window !== 'undefined' && wsLink
    ? (split(
        ({ query }) => {
          const definition = getMainDefinition(query);
          return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
          );
        },
        wsLink as unknown as ApolloLink,
        httpLinkChain
      ) as ApolloLink)
    : httpLinkChain;

  return new ApolloClient({
    link,
    cache: new InMemoryCache({
      // Configure cache policies as needed
      typePolicies: {
        Query: {
          fields: {
            searchKey: {
              read() {
                return '';
              },
            },
            startDateRange: {
              read() {
                return '';
              },
            },
          },
        },
      },
    }),
    // Enable SSR mode for Next.js
    ssrMode: typeof window === 'undefined',
    // Default options for queries
    defaultOptions: {
      watchQuery: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network',
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

