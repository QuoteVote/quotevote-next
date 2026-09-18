/**
 * GraphQL Context Factory
 *
 * Creates the canonical typed GraphQL context for Apollo Server.
 * Extracts context creation logic from server.ts into a reusable,
 * testable factory function.
 *
 * @see app/types/graphql.ts  — GraphQLContext interface
 * @see app/lib/prisma.ts     — Prisma Client singleton
 */

import type { Request, Response } from 'express';
import { GraphQLError } from 'graphql';
import type { GraphQLContext, PubSub } from './types/graphql';
import { prisma as defaultPrisma } from './lib/prisma';
import { pubsub as defaultPubsub } from './data/utils/pubsub';
import { requireAuth } from './data/utils/requireAuth';
import * as auth from './data/utils/authentication';
import { toPublicUser, type PrismaUserRecord } from './data/utils/userPrismaMapper';
import type * as Common from './types/common';

/**
 * Options for dependency injection in context creation.
 * Allows tests to override default singletons without touching globalThis.
 */
export interface ContextFactoryOptions {
  /** Override the default Prisma Client singleton */
  prisma?: GraphQLContext['prisma'];
  /** Override the default PubSub instance */
  pubsub?: PubSub;
}

/**
 * Creates the canonical typed GraphQL context for HTTP operations.
 *
 * Behavior preserved from the original inline context in server.ts:
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies token and hydrates user from database
 * 3. Derives userId from authenticated user
 * 4. Generates requestId from x-request-id header or crypto.randomUUID()
 * 5. Enforces requireAuth for protected operations (skips IntrospectionQuery)
 * 6. Returns full GraphQLContext with singleton Prisma Client
 *
 * @param params - Express request and response objects
 * @param options - Optional dependency injection overrides
 * @returns Fully populated GraphQLContext
 */
export async function createHttpContext(
  { req, res }: { req: Request; res: Response },
  options?: ContextFactoryOptions
): Promise<GraphQLContext> {
  const prisma = options?.prisma ?? defaultPrisma;
  const pubsub = options?.pubsub ?? defaultPubsub;

  const token = req.headers.authorization?.split(' ')[1];
  let user: Common.User | null = null;

  // Generate requestId from header or crypto
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();

  // Check if this is an introspection query (GraphQL Playground/IDE)
  const isIntrospection = req.body?.operationName === 'IntrospectionQuery';

  if (token) {
    try {
      const decoded = await auth.verifyToken(token);
      if (decoded && typeof decoded === 'object' && decoded.userId) {
        const prismaUser = await prisma.user.findUnique({
          where: { id: decoded.userId }
        });
        if (prismaUser) {
          user = toPublicUser(prismaUser as PrismaUserRecord);
        }
      }
    } catch {
      // Token invalid or expired, proceed as unauthenticated
    }
  }

  // Check if query requires authentication (skip for introspection)
  if (!isIntrospection) {
    const query = req.body?.query;
    if (query && requireAuth(query) && !user) {
      throw new GraphQLError('Auth token not found in request', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
  }

  return {
    prisma,
    req,
    res,
    user,
    userId: user?._id?.toString() ?? null,
    pubsub,
    requestId,
  };
}
