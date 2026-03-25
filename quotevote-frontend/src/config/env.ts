/**
 * Environment variable validation with Zod.
 *
 * Validated eagerly at module load time so misconfiguration surfaces
 * immediately on server start (or build), not at runtime.
 */

import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: z.string().url().optional(),
  NEXT_PUBLIC_SERVER_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`
  );
}

const _env = parsed.data;

// Ensure at least one URL source is available
if (!_env.NEXT_PUBLIC_GRAPHQL_ENDPOINT && !_env.NEXT_PUBLIC_SERVER_URL) {
  throw new Error(
    'NEXT_PUBLIC_SERVER_URL is required.\n' +
    'Please set NEXT_PUBLIC_SERVER_URL or NEXT_PUBLIC_GRAPHQL_ENDPOINT in your .env.local file.\n\n' +
    'Example:\nNEXT_PUBLIC_SERVER_URL=http://localhost:4000'
  );
}

function getGraphqlEndpoint(): string {
  if (_env.NEXT_PUBLIC_GRAPHQL_ENDPOINT) return _env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
  return `${_env.NEXT_PUBLIC_SERVER_URL}/graphql`;
}

function getServerUrl(): string {
  if (_env.NEXT_PUBLIC_GRAPHQL_ENDPOINT) {
    return _env.NEXT_PUBLIC_GRAPHQL_ENDPOINT.replace(/\/graphql\/?$/, '');
  }
  return _env.NEXT_PUBLIC_SERVER_URL!;
}

export const env = {
  graphqlEndpoint: getGraphqlEndpoint(),
  serverUrl: getServerUrl(),
  nodeEnv: _env.NODE_ENV,
  isDevelopment: _env.NODE_ENV === 'development',
  isProduction: _env.NODE_ENV === 'production',
} as const;
