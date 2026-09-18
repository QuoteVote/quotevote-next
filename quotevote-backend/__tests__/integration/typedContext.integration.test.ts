/**
 * Integration tests for Apollo Server with Canonical Typed Context (Issue #153)
 *
 * Verifies end-to-end integration:
 * 1. Apollo Server passes typed GraphQLContext to resolvers
 * 2. context.prisma is available and stable across requests
 * 3. context.userId is populated for authenticated requests and null for unauthenticated
 * 4. Context factory dependency injection works within expressMiddleware
 */

import request from 'supertest';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import type { GraphQLContext } from '../../app/types/graphql';
import { createHttpContext } from '../../app/context';
import { prisma as singletonPrisma } from '../../app/lib/prisma';
import * as auth from '../../app/data/utils/authentication';
import type { PrismaClient } from '@prisma/client';

// Mock logger
jest.mock('../../app/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Prisma client
jest.mock('../../app/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock authentication
jest.mock('../../app/data/utils/authentication', () => ({
  verifyToken: jest.fn(),
}));

describe('Typed GraphQL Context Integration Tests', () => {
  let app: express.Application;
  let server: ApolloServer<GraphQLContext>;
  let capturedPrismaInstances: unknown[] = [];

  const createServer = () => {
    return new ApolloServer<GraphQLContext>({
      typeDefs: `
        type ContextCheck {
          hasPrisma: Boolean!
          hasReq: Boolean!
          hasRes: Boolean!
          userId: String
          requestId: String!
        }

        type Query {
          posts: [String]
          contextCheck: ContextCheck!
        }
      `,
      resolvers: {
        Query: {
          posts: () => ['post1', 'post2'],
          contextCheck: (_parent, _args, context) => {
            capturedPrismaInstances.push(context.prisma);
            return {
              hasPrisma: Boolean(context.prisma),
              hasReq: Boolean(context.req),
              hasRes: Boolean(context.res),
              userId: context.userId ?? null,
              requestId: context.requestId ?? '',
            };
          },
        },
      },
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    capturedPrismaInstances = [];
    app = express();
    app.use(express.json());
    server = createServer();
    await server.start();

    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req, res }) => createHttpContext({ req, res }),
      })
    );
  });

  afterEach(async () => {
    await server.stop();
  });

  it('provides the singleton Prisma Client and context metadata to resolvers', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({
        query: `
          query {
            contextCheck {
              hasPrisma
              hasReq
              hasRes
              userId
              requestId
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.contextCheck).toEqual({
      hasPrisma: true,
      hasReq: true,
      hasRes: true,
      userId: null,
      requestId: expect.any(String),
    });
    expect(capturedPrismaInstances[0]).toBe(singletonPrisma);
  });

  it('maintains the same Prisma Client instance across multiple requests', async () => {
    await request(app)
      .post('/graphql')
      .send({ query: 'query { posts contextCheck { hasPrisma } }' });

    await request(app)
      .post('/graphql')
      .send({ query: 'query { posts contextCheck { hasPrisma } }' });

    expect(capturedPrismaInstances.length).toBe(2);
    expect(capturedPrismaInstances[0]).toBe(capturedPrismaInstances[1]);
    expect(capturedPrismaInstances[0]).toBe(singletonPrisma);
  });

  it('populates userId and hydrates user on authenticated requests', async () => {
    const mockUser = {
      id: 'user-abc-123',
      username: 'test_apollo_user',
      isAdmin: false,
      followingIds: [],
      followerIds: [],
    };

    (auth.verifyToken as jest.Mock).mockResolvedValue({ userId: 'user-abc-123' });
    (singletonPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', 'Bearer valid-jwt-token')
      .send({
        query: `
          query {
            contextCheck {
              hasPrisma
              userId
              requestId
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.contextCheck.userId).toBe('user-abc-123');
    expect(res.body.data.contextCheck.hasPrisma).toBe(true);
  });

  it('supports dependency injection with custom Prisma Client in Apollo Server', async () => {
    const mockCustomPrisma = {
      $connect: jest.fn(),
      isMockClient: true,
    } as unknown as PrismaClient;

    const customApp = express();
    customApp.use(express.json());
    const customServer = createServer();
    await customServer.start();

    customApp.use(
      '/graphql',
      expressMiddleware(customServer, {
        context: async ({ req, res }) =>
          createHttpContext({ req, res }, { prisma: mockCustomPrisma }),
      })
    );

    const res = await request(customApp)
      .post('/graphql')
      .send({
        query: `
          query {
            posts
            contextCheck {
              hasPrisma
            }
          }
        `,
      });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(capturedPrismaInstances[capturedPrismaInstances.length - 1]).toBe(mockCustomPrisma);

    await customServer.stop();
  });
});
