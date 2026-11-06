/**
 * Integration tests for the login check over WebSocket (#586)
 *
 * Only subscriptions are accepted over WebSocket, and a protected subscription needs a
 * signed-in connection. Uses the real createSubscriptionServer and createWsContext.
 */

import http from 'http';
import { createClient, type Client } from 'graphql-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import WebSocket from 'ws';
import { createSubscriptionServer, type SubscriptionServer } from '~/subscriptions';
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

interface OperationResult {
  data?: Record<string, unknown> | null;
  errors?: ReadonlyArray<{ message: string; extensions?: Record<string, unknown> }>;
}

const notificationsQuery = jest.fn(() => ['notification1']);
const createPost = jest.fn(() => 'created');
const notificationSubscribe = jest.fn(async function* () {
  yield { notification: 'new notification' };
});
const postsSubscribe = jest.fn(async function* () {
  yield { posts: 'new post' };
});

// `posts` is on the public list, `notification` isn't.
const schema = makeExecutableSchema({
  typeDefs: `
    type Query { notifications: [String] }
    type Mutation { createPost: String }
    type Subscription { notification: String posts: String }
  `,
  resolvers: {
    Query: { notifications: notificationsQuery },
    Mutation: { createPost },
    Subscription: {
      notification: { subscribe: notificationSubscribe },
      posts: { subscribe: postsSubscribe },
    },
  },
});

const runOnce = (client: Client, query: string): Promise<OperationResult> =>
  new Promise((resolve, reject) => {
    let result: OperationResult | undefined;
    const unsubscribe = client.subscribe<Record<string, unknown>>(
      { query },
      {
        next: (value) => {
          result = value as OperationResult;
          unsubscribe();
          resolve(result);
        },
        error: (error) => {
          if (Array.isArray(error)) resolve({ errors: error });
          else reject(error);
        },
        complete: () => resolve(result ?? {}),
      }
    );
  });

describe('Login check over WebSocket (#586)', () => {
  let httpServer: http.Server;
  let subscriptionServer: SubscriptionServer;
  let url: string;
  const clients: Client[] = [];

  const connect = (connectionParams?: Record<string, unknown>): Client => {
    const client = createClient({
      url,
      webSocketImpl: WebSocket,
      connectionParams,
      retryAttempts: 0,
    });
    clients.push(client);
    return client;
  };

  const signIn = () => {
    (auth.verifyToken as jest.Mock).mockResolvedValue({ userId: 'user-1' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      username: 'member',
      email: 'member@example.com',
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (auth.verifyToken as jest.Mock).mockRejectedValue(new Error('invalid token'));
    httpServer = http.createServer();
    subscriptionServer = createSubscriptionServer(httpServer, { schema });
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test HTTP server did not expose a port');
    }
    url = `ws://127.0.0.1:${address.port}/graphql`;
  });

  afterEach(async () => {
    await Promise.all(clients.splice(0).map((client) => client.dispose()));
    await subscriptionServer.dispose();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('refuses a query over WebSocket when signed out', async () => {
    const result = await runOnce(connect(), 'query { notifications }');

    expect(result.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect(notificationsQuery).not.toHaveBeenCalled();
  });

  it('refuses a query and a mutation over WebSocket when signed in', async () => {
    signIn();
    const client = connect({ authToken: 'valid-token' });

    const query = await runOnce(client, 'query { notifications }');
    const mutation = await runOnce(client, 'mutation { createPost }');

    expect(query.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect(mutation.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect(notificationsQuery).not.toHaveBeenCalled();
    expect(createPost).not.toHaveBeenCalled();
  });

  it('refuses a protected subscription without a token', async () => {
    const result = await runOnce(connect(), 'subscription { notification }');

    expect(result.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    expect(notificationSubscribe).not.toHaveBeenCalled();
  });

  it('refuses a protected subscription with an invalid token', async () => {
    const result = await runOnce(
      connect({ authToken: 'expired-token' }),
      'subscription { notification }'
    );

    expect(result.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    expect(notificationSubscribe).not.toHaveBeenCalled();
  });

  it('delivers a protected subscription when signed in', async () => {
    signIn();

    const result = await runOnce(
      connect({ authToken: 'valid-token' }),
      'subscription { notification }'
    );

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ notification: 'new notification' });
  });

  it('delivers a public subscription when signed out', async () => {
    const result = await runOnce(connect(), 'subscription { posts }');

    expect(result.errors).toBeUndefined();
    expect(result.data).toEqual({ posts: 'new post' });
  });

  it('keeps the connection open after refusing an operation', async () => {
    signIn();
    const client = connect({ authToken: 'valid-token' });

    const refused = await runOnce(client, 'query { notifications }');
    const delivered = await runOnce(client, 'subscription { notification }');

    expect(refused.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect(delivered.data).toEqual({ notification: 'new notification' });
  });

  it('returns errors for an invalid document instead of running it', async () => {
    const result = await runOnce(connect(), 'subscription { missingField }');

    expect(result.errors?.[0].message).toMatch(/missingField/);
  });
});
