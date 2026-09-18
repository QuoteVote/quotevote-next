/**
 * Unit tests for GraphQL Context Factory (app/context.ts)
 *
 * Verifies:
 * - Singleton Prisma Client lifecycle and injection
 * - User authentication and hydration via Prisma
 * - userId derivation from authenticated user
 * - Request ID generation and extraction
 * - Protected query enforcement via requireAuth
 * - Introspection query bypass
 * - Dependency injection overrides
 */

import type { Request, Response } from 'express';
import { GraphQLError } from 'graphql';
import { createHttpContext } from '~/context';
import { prisma as defaultPrisma } from '~/lib/prisma';
import { pubsub as defaultPubsub } from '~/data/utils/pubsub';
import * as auth from '~/data/utils/authentication';
import type { PrismaClient } from '@prisma/client';
import type { PubSub } from '~/types/graphql';

jest.mock('~/data/utils/authentication');
jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('GraphQL Context Factory (createHttpContext)', () => {
  const mockReq = (overrides: Partial<Request> = {}): Request =>
    ({
      headers: {},
      body: {},
      ...overrides,
    }) as unknown as Request;

  const mockRes = (overrides: Partial<Response> = {}): Response =>
    ({
      ...overrides,
    }) as unknown as Response;

  const mockPrismaUser = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    isAdmin: false,
    followingIds: [],
    followerIds: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock prisma.user.findUnique
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (defaultPrisma as any).user = {
      findUnique: jest.fn(),
    };
  });

  describe('Prisma Client Lifecycle', () => {
    it('provides the singleton Prisma Client instance by default', async () => {
      const req = mockReq();
      const res = mockRes();

      const context1 = await createHttpContext({ req, res });
      const context2 = await createHttpContext({ req, res });

      expect(context1.prisma).toBeDefined();
      expect(context1.prisma).toBe(defaultPrisma);
      expect(context1.prisma).toBe(context2.prisma);
    });

    it('allows injecting a custom Prisma Client instance via options', async () => {
      const customPrisma = { custom: 'prisma' } as unknown as PrismaClient;
      const req = mockReq();
      const res = mockRes();

      const context = await createHttpContext({ req, res }, { prisma: customPrisma });

      expect(context.prisma).toBe(customPrisma);
    });
  });

  describe('PubSub Lifecycle', () => {
    it('provides the default pubsub instance by default', async () => {
      const req = mockReq();
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(context.pubsub).toBe(defaultPubsub);
    });

    it('allows injecting a custom PubSub instance via options', async () => {
      const customPubsub = { publish: jest.fn() } as unknown as PubSub;
      const req = mockReq();
      const res = mockRes();

      const context = await createHttpContext({ req, res }, { pubsub: customPubsub });

      expect(context.pubsub).toBe(customPubsub);
    });
  });

  describe('Context Shape', () => {
    it('returns a complete context matching the GraphQLContext contract', async () => {
      const req = mockReq();
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(context).toHaveProperty('prisma');
      expect(context).toHaveProperty('req', req);
      expect(context).toHaveProperty('res', res);
      expect(context).toHaveProperty('user', null);
      expect(context).toHaveProperty('userId', null);
      expect(context).toHaveProperty('pubsub');
      expect(context).toHaveProperty('requestId');
      expect(typeof context.requestId).toBe('string');
    });

    it('uses x-request-id header when provided', async () => {
      const customRequestId = 'test-request-id-12345';
      const req = mockReq({
        headers: { 'x-request-id': customRequestId },
      });
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(context.requestId).toBe(customRequestId);
    });

    it('generates a random UUID when x-request-id is not provided', async () => {
      const req = mockReq();
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(context.requestId).toBeDefined();
      expect(typeof context.requestId).toBe('string');
      expect(context.requestId.length).toBeGreaterThan(0);
    });
  });

  describe('Authentication and User Hydration', () => {
    it('populates user and userId when a valid Bearer token is provided', async () => {
      (auth.verifyToken as jest.Mock).mockResolvedValue({ userId: 'user-123' });
      (defaultPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockPrismaUser);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-jwt-token' },
      });
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(auth.verifyToken).toHaveBeenCalledWith('valid-jwt-token');
      expect(defaultPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(context.user).toBeDefined();
      expect(context.user?._id).toBe('user-123');
      expect(context.user?.username).toBe('testuser');
      expect(context.userId).toBe('user-123');
    });

    it('sets user to null and userId to null when no token is provided', async () => {
      const req = mockReq();
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(auth.verifyToken).not.toHaveBeenCalled();
      expect(defaultPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(context.user).toBeNull();
      expect(context.userId).toBeNull();
    });

    it('handles invalid or expired tokens gracefully without throwing', async () => {
      (auth.verifyToken as jest.Mock).mockRejectedValue(new Error('jwt expired'));

      const req = mockReq({
        headers: { authorization: 'Bearer expired-token' },
      });
      const res = mockRes();

      const context = await createHttpContext({ req, res });

      expect(context.user).toBeNull();
      expect(context.userId).toBeNull();
    });
  });

  describe('requireAuth Integration', () => {
    it('allows public queries without authentication', async () => {
      const req = mockReq({
        body: { query: 'query { posts { id } }' },
      });
      const res = mockRes();

      const context = await createHttpContext({ req, res });
      expect(context.user).toBeNull();
    });

    it('throws UNAUTHENTICATED GraphQLError when protected query is called without auth', async () => {
      const req = mockReq({
        body: { query: 'mutation { createPost { id } }' },
      });
      const res = mockRes();

      await expect(createHttpContext({ req, res })).rejects.toThrow(GraphQLError);
      await expect(createHttpContext({ req, res })).rejects.toMatchObject({
        message: 'Auth token not found in request',
        extensions: { code: 'UNAUTHENTICATED' },
      });
    });

    it('bypasses requireAuth check for IntrospectionQuery', async () => {
      const req = mockReq({
        body: {
          operationName: 'IntrospectionQuery',
          query: 'query IntrospectionQuery { __schema { types { name } } }',
        },
      });
      const res = mockRes();

      const context = await createHttpContext({ req, res });
      expect(context).toBeDefined();
    });

    it('allows protected query when valid authentication is present', async () => {
      const authUser = {
        id: 'auth-user-id',
        username: 'authuser',
        email: 'auth@example.com',
        isAdmin: false,
        followingIds: [],
        followerIds: [],
      };

      (auth.verifyToken as jest.Mock).mockResolvedValue({ userId: 'auth-user-id' });
      (defaultPrisma.user.findUnique as jest.Mock).mockResolvedValue(authUser);

      const req = mockReq({
        headers: { authorization: 'Bearer valid-token' },
        body: { query: 'mutation { createPost { id } }' },
      });
      const res = mockRes();

      const context = await createHttpContext({ req, res });
      expect(context.user).toBeDefined();
      expect(context.user?._id).toBe('auth-user-id');
      expect(context.userId).toBe('auth-user-id');
    });
  });
});
