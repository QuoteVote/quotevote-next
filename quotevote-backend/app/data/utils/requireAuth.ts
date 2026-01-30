/**
 * requireAuth Middleware
 * Determines if a GraphQL query requires authentication based on public query list
 */

import type { Request, Response } from 'express';
import type { GraphQLContext } from '~/types/graphql';
import type { AuthenticatedRequest, NextFunction } from '~/types/express';
import { logger } from './logger';

/**
 * List of public GraphQL queries/mutations that don't require authentication
 */
const PUBLIC_QUERIES: readonly string[] = [
  'addStripeCustomer',
  'requestUserAccess',
  'checkDuplicateEmail',
  'sendInvestorMail',
  'sendPasswordResetEmail',
  'verifyUserPasswordResetToken',
  'updateUserPassword',
  'popPrediction',
  'posts',
  'featuredPosts',
  'post',
  'topPosts',
  'messages',
  'actionReactions',
  'messageReactions',
  'user',
  'getUserFollowInfo',
  'group',
  'groups',
  // add more public queries/mutations
] as const;

/**
 * Checks if a GraphQL query string requires authentication.
 * Returns true if authentication is required, false if the query is public.
 *
 * @param query - The GraphQL query string to check
 * @returns true if authentication is required, false if query is public
 */
export function requireAuth(query: string | null | undefined): boolean;
/**
 * Checks if a GraphQL query from an Express Request requires authentication.
 * Extracts the query from the request body and checks if it requires auth.
 *
 * @param req - Express Request object containing the GraphQL query
 * @returns true if authentication is required, false if query is public
 */
export function requireAuth(req: Request): boolean;
/**
 * Checks if a GraphQL query from GraphQLContext requires authentication.
 * Extracts the query from the context request body and checks if it requires auth.
 *
 * @param context - GraphQLContext containing the request
 * @returns true if authentication is required, false if query is public
 */
export function requireAuth(context: GraphQLContext): boolean;
export function requireAuth(
  input: string | null | undefined | Request | GraphQLContext
): boolean {
  // Extract query string from different input types
  let query: string | null | undefined;

  if (typeof input === 'string' || input === null || input === undefined) {
    query = input as string | null | undefined;
  } else if ('req' in input && 'res' in input) {
    // GraphQLContext
    const context = input as GraphQLContext;
    query = (context.req?.body as { query?: string } | undefined)?.query;
  } else {
    // Request object
    const req = input as Request;
    query = (req.body as { query?: string } | undefined)?.query;
  }

  // If query is null or undefined, require authentication for safety
  if (!query) {
    logger.debug('requireAuth check', { requireAuth: true, query: null });
    return true;
  }

  // Check if query contains any public query names
  let requiresAuth = true;
  for (const publicQuery of PUBLIC_QUERIES) {
    const isFound = query.includes(publicQuery);
    if (isFound) {
      requiresAuth = false;
      break;
    }
  }

  logger.debug('requireAuth check', { requireAuth: requiresAuth, query });
  return requiresAuth;
}

/**
 * Express middleware function that checks if a GraphQL query requires authentication.
 * Can be used as middleware for REST endpoints that handle GraphQL queries.
 *
 * @param req - Express Request (can be AuthenticatedRequest)
 * @param res - Express Response
 * @param next - Express NextFunction
 * @returns void or calls next()
 */
export function requireAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const body = req.body as { query?: string } | undefined;
  const query = body?.query;
  if (query && requireAuth(query) && !req.user) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Auth token not found in request',
        statusCode: 401,
      },
      timestamp: new Date().toISOString(),
    });
    return;
  }
  next();
}

export default requireAuth;
