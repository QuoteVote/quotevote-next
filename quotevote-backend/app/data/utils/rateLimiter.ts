import type { PrismaClient } from '@prisma/client';
import { logger } from '~/data/utils/logger';
import type { AuthenticatedRequest } from '~/types/express';
import type { GraphQLContext } from '~/types/graphql';

// This is a helper type to handle different kinds of requests
type RateLimitRequest = AuthenticatedRequest | Pick<GraphQLContext, 'user'>;

export type RateLimitPrisma = Pick<PrismaClient, '$runCommandRaw'>;

/**
 * Counts live in MongoDB, so they hold across restarts and are shared by every
 * instance. One document per key and action; Mongo removes it once its window
 * has passed. The collection isn't in the Prisma schema, so `prisma db push`
 * leaves it alone.
 */
export const RATE_LIMIT_COLLECTION = 'ratelimits';

interface RateLimitDocument {
  count?: number;
  resetAt?: { $date: string } | string;
}

let expiryIndexReady: Promise<void> | null = null;

/** Create the expiry index once per process. A failure is logged and retried next time. */
function ensureExpiryIndex(prisma: RateLimitPrisma): Promise<void> {
  expiryIndexReady ??= prisma
    .$runCommandRaw({
      createIndexes: RATE_LIMIT_COLLECTION,
      indexes: [{ key: { resetAt: 1 }, name: 'resetAt_expiry', expireAfterSeconds: 0 }],
    })
    .then(() => undefined)
    .catch((err: unknown) => {
      expiryIndexReady = null;
      logger.warn('Rate limit expiry index was not created', {
        error: err instanceof Error ? err.message : String(err),
      });
    });
  return expiryIndexReady;
}

/** Exported for tests, so each one starts without a created index. */
export const resetExpiryIndexState = (): void => {
  expiryIndexReady = null;
};

const keyFor = (reqOrUserId: RateLimitRequest | string, action: string): string | null => {
  const userId = typeof reqOrUserId === 'string' ? reqOrUserId : reqOrUserId?.user?._id?.toString();
  return userId ? `${userId}:${action}` : null;
};

const resetAtOf = (doc: RateLimitDocument | null | undefined): number => {
  const raw = doc?.resetAt;
  const value = typeof raw === 'string' ? raw : raw?.$date;
  return value ? new Date(value).getTime() : 0;
};

/**
 * Check if a user has exceeded the rate limit
 * @param prisma - Prisma client, used for the shared counts
 * @param reqOrUserId - The request object or user ID
 * @param action - The action being rate limited (e.g., 'sendMessage')
 * @param limit - Maximum number of actions allowed
 * @param windowMs - Time window in milliseconds
 * @returns True if within limit, throws error if exceeded
 */
export const checkRateLimit = async (
  prisma: RateLimitPrisma,
  reqOrUserId: RateLimitRequest | string,
  action: string,
  limit = 10,
  windowMs = 60000
): Promise<boolean> => {
  if (!reqOrUserId) return true;
  const key = keyFor(reqOrUserId, action);
  if (!key) return true;

  await ensureExpiryIndex(prisma);

  const now = new Date();
  const windowOpen = { $gt: ['$resetAt', { $date: now.toISOString() }] };
  let doc: RateLimitDocument | null | undefined;
  try {
    // One atomic update: count up inside the window, or start a new one.
    const result = (await prisma.$runCommandRaw({
      findAndModify: RATE_LIMIT_COLLECTION,
      query: { _id: key },
      update: [
        {
          $set: {
            count: { $cond: [windowOpen, { $add: ['$count', 1] }, 1] },
            resetAt: {
              $cond: [
                windowOpen,
                '$resetAt',
                { $date: new Date(now.getTime() + windowMs).toISOString() },
              ],
            },
          },
        },
      ],
      upsert: true,
      new: true,
    })) as { value?: RateLimitDocument | null };
    doc = result.value;
  } catch (err: unknown) {
    // Without the database the request can't do anything else either, so let
    // it through rather than turn a database error into a rate limit error.
    logger.error('Rate limit check failed', {
      action,
      error: err instanceof Error ? err.message : String(err),
    });
    return true;
  }

  if ((doc?.count ?? 1) > limit) {
    const remainingTime = Math.max(1, Math.ceil((resetAtOf(doc) - now.getTime()) / 1000));
    throw new Error(
      `Rate limit exceeded for ${action}. Please try again in ${remainingTime} seconds.`
    );
  }

  return true;
};

/**
 * Reset rate limit for a user/action
 * @param prisma - Prisma client, used for the shared counts
 * @param reqOrUserId - The request object or user ID
 * @param action - The action being rate limited
 */
export const resetRateLimit = async (
  prisma: RateLimitPrisma,
  reqOrUserId: RateLimitRequest | string,
  action: string
): Promise<void> => {
  if (!reqOrUserId) return;
  const key = keyFor(reqOrUserId, action);
  if (!key) return;
  await prisma.$runCommandRaw({
    delete: RATE_LIMIT_COLLECTION,
    deletes: [{ q: { _id: key }, limit: 1 }],
  });
};

export default { checkRateLimit, resetRateLimit };
