/**
 * Integration tests for persisted queries being off (#586)
 *
 * A request that sends only a persisted-query hash carries no query text, so
 * createHttpContext can't apply the login check to it. The server refuses those requests
 * instead of running the stored operation.
 */

import http from 'http';
import request from 'supertest';
import express from 'express';
import { createHash } from 'crypto';
import type { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { GraphQLContext } from '~/types/graphql';
import { createApolloServer } from '~/apolloServer';
import { createHttpContext } from '~/context';
import { prisma } from '~/lib/prisma';
import * as auth from '~/data/utils/authentication';

jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('~/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('~/data/utils/authentication', () => ({
  verifyToken: jest.fn(),
}));

const PUBLIC_QUERY = 'query { posts }';
const PROTECTED_QUERY = 'query { notifications }';

const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');

const persistedQuery = (query: string) => ({
  persistedQuery: { version: 1, sha256Hash: sha256(query) },
});

describe('Persisted queries (#586)', () => {
  const notifications = jest.fn(() => ['notification1']);
  const posts = jest.fn(() => ['post1']);
  let app: express.Application;
  let httpServer: http.Server;
  let server: ApolloServer<GraphQLContext>;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    httpServer = http.createServer(app);

    const schema = makeExecutableSchema({
      typeDefs: 'type Query { posts: [String] notifications: [String] }',
      resolvers: { Query: { posts, notifications } },
    });
    server = createApolloServer(schema, httpServer);
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

  it('refuses a hash-only POST for a protected query when signed out', async () => {
    const res = await request(app)
      .post('/graphql')
      .send({ extensions: persistedQuery(PROTECTED_QUERY) });

    expect(res.body.data).toBeUndefined();
    expect(res.body.errors[0].extensions.code).toBe('PERSISTED_QUERY_NOT_SUPPORTED');
    expect(notifications).not.toHaveBeenCalled();
  });

  it('refuses a hash-only GET for a protected query when signed out', async () => {
    const res = await request(app)
      .get('/graphql')
      .set('apollo-require-preflight', 'true')
      .query({ extensions: JSON.stringify(persistedQuery(PROTECTED_QUERY)) });

    expect(res.body.data).toBeUndefined();
    expect(res.body.errors[0].extensions.code).toBe('PERSISTED_QUERY_NOT_SUPPORTED');
    expect(notifications).not.toHaveBeenCalled();
  });

  it('refuses a hash-only request when signed in too', async () => {
    (auth.verifyToken as jest.Mock).mockResolvedValue({ userId: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      username: 'member',
      email: 'member@example.com',
    });

    const res = await request(app)
      .post('/graphql')
      .set('Authorization', 'Bearer valid-token')
      .send({ extensions: persistedQuery(PROTECTED_QUERY) });

    expect(res.body.errors[0].extensions.code).toBe('PERSISTED_QUERY_NOT_SUPPORTED');
    expect(notifications).not.toHaveBeenCalled();
  });

  it('refuses to store a query sent with its hash, so a later hash-only request has nothing to run', async () => {
    const register = await request(app)
      .post('/graphql')
      .send({ query: PUBLIC_QUERY, extensions: persistedQuery(PUBLIC_QUERY) });

    expect(register.body.errors[0].extensions.code).toBe('PERSISTED_QUERY_NOT_SUPPORTED');
    expect(posts).not.toHaveBeenCalled();
  });

  it('still runs a public query sent as text when signed out', async () => {
    const res = await request(app).post('/graphql').send({ query: PUBLIC_QUERY });

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data).toEqual({ posts: ['post1'] });
  });

  it('still refuses a protected query sent as text when signed out', async () => {
    const res = await request(app).post('/graphql').send({ query: PROTECTED_QUERY });

    expect(res.body.data).toBeUndefined();
    expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    expect(notifications).not.toHaveBeenCalled();
  });
});
