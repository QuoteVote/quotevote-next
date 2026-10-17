/**
 * requireAuth Middleware
 * Determines if a GraphQL query requires authentication based on public query list
 */

import type { Request, Response } from 'express';
import type { GraphQLContext } from '~/types/graphql';
import type { AuthenticatedRequest, NextFunction } from '~/types/express';
import { parse, Kind, type SelectionNode, type FragmentDefinitionNode } from 'graphql';
import { logger } from './logger';

/**
 * List of public GraphQL queries/mutations that don't require authentication
 */
const PUBLIC_QUERIES: readonly string[] = [
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
  'tag',
  'tags',
  'searchUser',
] as const;

/**
 * Extracts root field names from a parsed GraphQL document.
 * Handles aliases, named fragment spreads (with cycle guard), inline fragments,
 * and multiple operations.
 */
function extractRootFieldNames(doc: ReturnType<typeof parse>): string[] {
  const fragments = new Map<string, FragmentDefinitionNode>();
  for (const def of doc.definitions) {
    if (def.kind === Kind.FRAGMENT_DEFINITION) fragments.set(def.name.value, def);
  }

  const fieldNames: string[] = [];
  for (const def of doc.definitions) {
    if (def.kind === Kind.OPERATION_DEFINITION) {
      collectFieldNames(def.selectionSet.selections, fragments, new Set(), fieldNames);
    }
  }

  return fieldNames;
}

function collectFieldNames(
  selections: readonly SelectionNode[],
  fragments: Map<string, FragmentDefinitionNode>,
  seen: Set<string>,
  fieldNames: string[]
): void {
  for (const selection of selections) {
    if (selection.kind === Kind.FIELD) {
      fieldNames.push(selection.name.value);
    } else if (selection.kind === Kind.INLINE_FRAGMENT) {
      collectFieldNames(selection.selectionSet.selections, fragments, seen, fieldNames);
    } else {
      const name = selection.name.value;
      const fragment = fragments.get(name);
      if (!fragment || seen.has(name)) continue;
      seen.add(name);
      collectFieldNames(fragment.selectionSet.selections, fragments, seen, fieldNames);
    }
  }
}

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
  let query: string | null | undefined;

  if (typeof input === 'string' || input === null || input === undefined) {
    query = input as string | null | undefined;
  } else if ('req' in input && 'res' in input) {
    const context = input as GraphQLContext;
    query = (context.req?.body as { query?: string } | undefined)?.query;
  } else {
    const req = input as Request;
    query = (req.body as { query?: string } | undefined)?.query;
  }

  if (!query) {
    logger.debug('requireAuth check', { requireAuth: true, query: null });
    return true;
  }

  const rootFieldNames: string[] = [];
  let requiresAuth = true;

  try {
    const doc = parse(query);
    rootFieldNames.push(...extractRootFieldNames(doc));

    requiresAuth =
      rootFieldNames.length === 0 ||
      rootFieldNames.some(
        fieldName =>
          !fieldName.startsWith('__') &&
          !(PUBLIC_QUERIES as readonly string[]).includes(fieldName)
      );
  } catch {
    requiresAuth = true;
  }

  logger.debug('requireAuth check', { requireAuth: requiresAuth, rootFieldNames });
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
