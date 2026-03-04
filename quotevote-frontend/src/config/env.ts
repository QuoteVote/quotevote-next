/**
 * Environment variable configuration and validation
 * 
 * This module validates that all required environment variables are set
 * and provides type-safe access to them.
 * 
 * IMPORTANT: Next.js requires static access to NEXT_PUBLIC_* env vars
 * (e.g., process.env.NEXT_PUBLIC_FOO as a literal expression).
 * Dynamic access like process.env[name] is NOT inlined by Turbopack/webpack
 * and will be undefined on the client side.
 */

/**
 * Validated environment configuration
 * Variables are validated lazily when accessed
 */
export const env = {
  /**
   * GraphQL endpoint URL
   * Can be set directly or constructed from server URL
   */
  get graphqlEndpoint(): string {
    // Static access required for Next.js NEXT_PUBLIC_* inlining
    const explicitEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    if (explicitEndpoint) {
      return explicitEndpoint;
    }
    
    // Fallback: construct from base server URL
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error(
        `Environment variable NEXT_PUBLIC_GRAPHQL_ENDPOINT (or NEXT_PUBLIC_SERVER_URL) is required but not set.\n` +
        `Please create a .env.local file in the project root and add:\n` +
        `NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql`
      );
    }
    
    return `${serverUrl}/graphql`;
  },
  
  /**
   * Base server URL
   * Derived from GraphQL endpoint or from NEXT_PUBLIC_SERVER_URL
   */
  get serverUrl(): string {
    // Static access required for Next.js NEXT_PUBLIC_* inlining
    const graphqlEndpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
    if (graphqlEndpoint) {
      // Remove /graphql suffix if present
      return graphqlEndpoint.replace(/\/graphql\/?$/, '');
    }
    
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    if (!serverUrl) {
      throw new Error(
        `Environment variable NEXT_PUBLIC_SERVER_URL is required but not set.\n` +
        `Alternatively, set NEXT_PUBLIC_GRAPHQL_ENDPOINT.\n` +
        `Please create a .env.local file in the project root and add:\n` +
        `NEXT_PUBLIC_SERVER_URL=http://localhost:4000`
      );
    }
    return serverUrl;
  },
  
  /**
   * Node environment
   */
  nodeEnv: process.env.NODE_ENV || 'development',
  
  /**
   * Whether we're in development mode
   */
  isDevelopment: process.env.NODE_ENV === 'development',
  
  /**
   * Whether we're in production mode
   */
  isProduction: process.env.NODE_ENV === 'production',
} as const;


