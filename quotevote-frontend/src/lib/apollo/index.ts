/**
 * Apollo Client configuration and utilities
 *
 * This module exports all Apollo-related functionality including:
 * - Apollo Client instance creation
 * - Apollo Provider wrapper
 * - Error handling utilities
 */

export { getApolloClient, createApolloClient } from "./apollo-client";
export { ApolloProviderWrapper } from "./apollo-provider";
export {
  handleApolloError,
  getErrorMessage,
  isNetworkError,
  isAuthenticationError,
  isAuthorizationError,
  ErrorType,
  type ErrorInfo,
} from "./error-handler";
