"use client";

import { useMemo, type ReactNode } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { getApolloClient } from "./apollo-client";

/**
 * ApolloProvider wrapper for Client Components
 *
 * This component must be a Client Component ('use client') because:
 * 1. ApolloProvider uses React Context which requires client-side rendering
 * 2. Apollo hooks (useQuery, useMutation, etc.) can only be used in Client Components
 *
 * Usage:
 * Wrap your Client Components with this provider in the root layout or a client boundary
 */
export function ApolloProviderWrapper({ children }: { children: ReactNode }): ReactNode {
  // Memoize the client to prevent unnecessary re-creation
  // getApolloClient() already handles singleton pattern, but this ensures
  // the same reference is used across re-renders
  const client = useMemo(() => getApolloClient(), []);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
