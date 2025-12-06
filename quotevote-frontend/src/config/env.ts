/**
 * Environment variable configuration and validation
 * 
 * This module validates that all required environment variables are set
 * and provides type-safe access to them.
 */

/**
 * Get an environment variable with optional default value
 * Throws an error if the variable is required but not set
 * 
 * @param name - Environment variable name
 * @param defaultValue - Optional default value
 * @returns The environment variable value
 * @throws {Error} If the variable is required but not set
 */
function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  
  if (!value) {
    throw new Error(
      `Environment variable ${name} is required but not set.\n` +
      `Please create a .env.local file in the project root and add:\n` +
      `${name}=your_value_here\n\n` +
      `Example for development:\n` +
      `${name}=http://localhost:4000`
    );
  }
  
  return value;
}

/**
 * Get an optional environment variable
 * 
 * @param name - Environment variable name
 * @returns The environment variable value or undefined
 */
function getOptionalEnvVar(name: string): string | undefined {
  return process.env[name];
}

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
    // Check for explicit GraphQL endpoint first
    const explicitEndpoint = getOptionalEnvVar('NEXT_PUBLIC_GRAPHQL_ENDPOINT');
    if (explicitEndpoint) {
      return explicitEndpoint;
    }
    
    // Fallback: construct from base server URL
    const serverUrl = getEnvVar('NEXT_PUBLIC_SERVER_URL');
    
    return `${serverUrl}/graphql`;
  },
  
  /**
   * Base server URL
   * Derived from GraphQL endpoint or from NEXT_PUBLIC_SERVER_URL
   */
  get serverUrl(): string {
    // If GraphQL endpoint is set, derive server URL from it
    const graphqlEndpoint = getOptionalEnvVar('NEXT_PUBLIC_GRAPHQL_ENDPOINT');
    if (graphqlEndpoint) {
      // Remove /graphql suffix if present
      return graphqlEndpoint.replace(/\/graphql\/?$/, '');
    }
    
    // Fallback to explicit server URL
    return getEnvVar('NEXT_PUBLIC_SERVER_URL');
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


