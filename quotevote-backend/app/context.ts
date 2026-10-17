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
import type { GraphQLContext, PubSub, WsGraphQLContext } from './types/graphql';
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

export interface WsContextFactoryOptions {
  prisma?: GraphQLContext['prisma'];
  pubsub?: PubSub;
}

async function loadUserFromToken(
  token: string,
  prisma: GraphQLContext['prisma']
): Promise<Common.User | null> {
  try {
    const decoded = await auth.verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !decoded.userId) return null;

    const prismaUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        bio: true,
        isAdmin: true,
        accountStatus: true,
        followingIds: true,
        followerIds: true,
        reputation: true,
      },
    });

    return prismaUser ? toPublicUser(prismaUser as PrismaUserRecord) : null;
  } catch {
    return null;
  }
}

export async function createWsContext(
  connectionParams: Record<string, unknown> | undefined,
  options?: WsContextFactoryOptions
): Promise<WsGraphQLContext> {
  const prisma = options?.prisma ?? defaultPrisma;
  const pubsub = options?.pubsub ?? defaultPubsub;
  const rawToken =
    connectionParams?.authToken ?? connectionParams?.authorization ?? connectionParams?.token;
  const token = typeof rawToken === 'string' ? rawToken.replace(/^Bearer\s+/i, '') : undefined;
  const user = token ? await loadUserFromToken(token, prisma) : null;

  return {
    prisma,
    user,
    userId: user?._id?.toString() ?? null,
    pubsub,
    requestId: crypto.randomUUID(),
    connectionParams,
  };
}

/**
 * Creates the canonical typed GraphQL context for HTTP operations.
 *
 * Behavior preserved from the original inline context in server.ts:
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies token and hydrates user from database
 * 3. Derives userId from authenticated user
 * 4. Generates requestId from x-request-id header or crypto.randomUUID()
 * 5. Enforces requireAuth for protected operations (introspection `__` fields are public)
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
  const user = token ? await loadUserFromToken(token, prisma) : null;

  // Generate requestId from header or crypto
  const requestId = (req.headers['x-request-id'] as string | undefined) ?? crypto.randomUUID();

  // Gate every query the request carries (Apollo runs the URL one on GET, the body one on POST)
  const queries = [
    (req.body as { query?: unknown } | undefined)?.query,
    req.query?.query,
  ].filter((q) => q !== undefined);
  if (!user && queries.some((q) => typeof q !== 'string' || requireAuth(q))) {
    throw new GraphQLError('Auth token not found in request', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
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
