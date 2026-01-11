// TODO: This utility will be used in the createMessage resolver once it is migrated.
import type { AuthenticatedRequest } from '~/types/express';
import type { GraphQLContext } from '~/types/graphql';

// This is a helper type to handle different kinds of requests
type RateLimitRequest = AuthenticatedRequest | Pick<GraphQLContext, 'user'>;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a user has exceeded the rate limit
 * @param {RateLimitRequest} req - The request object (from Express or GraphQL)
 * @param {string} action - The action being rate limited (e.g., 'sendMessage')
 * @param {number} limit - Maximum number of actions allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - True if within limit, throws error if exceeded
 */
export const checkRateLimit = (
  req: RateLimitRequest,
  action: string,
  limit = 10,
  windowMs = 60000
): boolean => {
  const userId = req.user?._id;

  if (!userId) {
    return true;
  }

  const key = `${userId}:${action}`;

    const now = Date.now();

  

    if (!rateLimitMap.has(key)) {

      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });

      return true;

    }

  

    const userLimit = rateLimitMap.get(key)!;

  

    if (now >= userLimit.resetAt) {
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
 */
export const resetRateLimit = (req: RateLimitRequest, action: string): void => {
  const userId = req.user?._id;
  if (userId) {
    const key = `${userId}:${action}`;
    rateLimitMap.delete(key);
  }
};

if (process.env.NODE_ENV !== 'test') {
  // Clean up old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
}

export default { checkRateLimit, resetRateLimit };
