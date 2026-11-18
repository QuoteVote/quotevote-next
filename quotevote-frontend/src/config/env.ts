/**
 * Environment variable validation with Zod.
 *
 * Validated eagerly at module load time so misconfiguration surfaces
 * immediately on server start (or build), not at runtime.
 */

import { z } from 'zod';
import { resolveApiAddress } from '@/config/apiAddress';

const envSchema = z.object({
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_SERVER_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NODE_ENV: process.env.NODE_ENV,
});

if (!parsed.success) {
  throw new Error(
    `Invalid environment variables:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`
  );
}

const _env = parsed.data;

// Throws when neither address is set, or when the one in use isn't an http(s) URL.
const api = resolveApiAddress({
  graphqlEndpoint: _env.NEXT_PUBLIC_GRAPHQL_ENDPOINT,
  serverUrl: _env.NEXT_PUBLIC_SERVER_URL,
});

export const env = {
  graphqlEndpoint: api.graphqlEndpoint,
  graphqlWsEndpoint: api.graphqlWsEndpoint,
  serverUrl: api.serverUrl,
  nodeEnv: _env.NODE_ENV,
  isDevelopment: _env.NODE_ENV === 'development',
  isProduction: _env.NODE_ENV === 'production',
} as const;
