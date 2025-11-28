/**
 * Error types for different error scenarios
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  GRAPHQL = 'GRAPHQL',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error information
 */
export interface ErrorInfo {
  type: ErrorType;
  message: string;
  code?: string;
  originalError?: unknown;
}

/**
 * Type guard to check if error has Apollo Client error structure
 */
interface ApolloErrorLike {
  graphQLErrors?: Array<{ message: string; extensions?: { code?: string } }>;
  networkError?: Error & { statusCode?: number };
  message?: string;
}

function isApolloErrorLike(error: unknown): error is ApolloErrorLike {
  return (
    error !== null &&
    typeof error === 'object' &&
    ('graphQLErrors' in error || 'networkError' in error)
  );
}

/**
 * Extract error code from GraphQL error extensions
 */
function getErrorCode(error: ApolloErrorLike): string | undefined {
  if (error.graphQLErrors && error.graphQLErrors.length > 0) {
    const firstError = error.graphQLErrors[0];
    return firstError.extensions?.code;
  }
  return undefined;
}

/**
 * Handle Apollo Client errors and extract structured error information
 * 
 * @param error - The error to handle (can be Apollo error, Error, or unknown)
 * @returns Structured error information
 */
export function handleApolloError(error: unknown): ErrorInfo {
  // Handle Apollo Client errors (v4 structure)
  if (isApolloErrorLike(error)) {
    
    // Check for network errors
    if (error.networkError) {
      const networkError = error.networkError;
      
      // Check for authentication errors (401)
      if (networkError.statusCode === 401) {
        return {
          type: ErrorType.AUTHENTICATION,
          message: 'Authentication required. Please log in.',
          code: 'UNAUTHORIZED',
          originalError: networkError,
        };
      }
      
      // Check for authorization errors (403)
      if (networkError.statusCode === 403) {
        return {
          type: ErrorType.AUTHORIZATION,
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          originalError: networkError,
        };
      }
      
      // Generic network error
      return {
        type: ErrorType.NETWORK,
        message: networkError.message || 'Network error occurred. Please check your connection.',
        originalError: networkError,
      };
    }
    
    // Check for GraphQL errors
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      const firstError = error.graphQLErrors[0];
      const code = getErrorCode(error);
      
      // Check error code
      if (code === 'UNAUTHORIZED') {
        return {
          type: ErrorType.AUTHENTICATION,
          message: firstError.message || 'Authentication required.',
          code,
          originalError: error,
        };
      }
      
      if (code === 'FORBIDDEN') {
        return {
          type: ErrorType.AUTHORIZATION,
          message: firstError.message || 'Access denied.',
          code,
          originalError: error,
        };
      }
      
      if (code === 'VALIDATION_ERROR') {
        return {
          type: ErrorType.VALIDATION,
          message: firstError.message || 'Validation error occurred.',
          code,
          originalError: error,
        };
      }
      
      // Generic GraphQL error
      return {
        type: ErrorType.GRAPHQL,
        message: firstError.message || 'GraphQL error occurred.',
        code,
        originalError: error,
      };
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'An error occurred.',
      originalError: error,
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      type: ErrorType.UNKNOWN,
      message: error || 'An unknown error occurred.',
      originalError: error,
    };
  }
  
  // Fallback for unknown error types
  return {
    type: ErrorType.UNKNOWN,
    message: 'An unknown error occurred.',
    originalError: error,
  };
}

/**
 * Get user-friendly error message from any error
 * 
 * @param error - The error to extract message from
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const errorInfo = handleApolloError(error);
  return errorInfo.message;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const errorInfo = handleApolloError(error);
  return errorInfo.type === ErrorType.NETWORK;
}

/**
 * Check if error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  const errorInfo = handleApolloError(error);
  return errorInfo.type === ErrorType.AUTHENTICATION;
}

/**
 * Check if error is an authorization error
 */
export function isAuthorizationError(error: unknown): boolean {
  const errorInfo = handleApolloError(error);
  return errorInfo.type === ErrorType.AUTHORIZATION;
}

