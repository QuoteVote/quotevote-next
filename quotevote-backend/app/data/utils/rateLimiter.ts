// TODO: This utility will be used in the createMessage resolver once it is migrated.
import type { AuthenticatedRequest } from '~/types/express';
import type { GraphQLContext } from '~/types/graphql';

// This is a helper type to handle different kinds of requests
type RateLimitRequest = AuthenticatedRequest | Pick<GraphQLContext, 'user'>;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Exported for testing purposes
export const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a user has exceeded the rate limit
 * @param {RateLimitRequest | string} reqOrUserId - The request object or user ID
 * @param {string} action - The action being rate limited (e.g., 'sendMessage')
 * @param {number} limit - Maximum number of actions allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if within limit, throws error if exceeded
 */
export const checkRateLimit = (
  reqOrUserId: RateLimitRequest | string,
  action: string,
  limit = 10,
  windowMs = 60000
): boolean => {
  if (!reqOrUserId) return true;
  const userId =
    typeof reqOrUserId === 'string'
      ? reqOrUserId
      : reqOrUserId.user?._id?.toString();

  if (!userId) {
    return true;
  }

  const key = `${userId}:${action}`;
  const now = Date.now();

  const userLimit = rateLimitMap.get(key);

  if (!userLimit || now >= userLimit.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    const remainingTime = Math.ceil((userLimit.resetAt - now) / 1000);
    throw new Error(
      `Rate limit exceeded for ${action}. Please try again in ${remainingTime} seconds.`
    );
  }

  userLimit.count += 1;
  return true;
};

/**
 * Reset rate limit for a user/action
 * @param {RateLimitRequest | string} reqOrUserId - The request object or user ID
 * @param {string} action - The action being rate limited
 */
export const resetRateLimit = (
  reqOrUserId: RateLimitRequest | string,
  action: string
): void => {
  if (!reqOrUserId) return;
  const userId =
    typeof reqOrUserId === 'string'
      ? reqOrUserId
      : reqOrUserId.user?._id?.toString();
  if (userId) {
    const key = `${userId}:${action}`;
    rateLimitMap.delete(key);
  }
};

/**
 * Clean up expired rate limit entries
 */
export const cleanupRateLimitMap = (): void => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now >= value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
};

// Auto-start cleanup interval in non-test environments
/* istanbul ignore next -- @preserve: intentionally skipped in test environment */
if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanupRateLimitMap, 300000);
}

export default { checkRateLimit, resetRateLimit, cleanupRateLimitMap };
