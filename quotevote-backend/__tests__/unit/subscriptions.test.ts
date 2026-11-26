import http from 'http';
import { createClient } from 'graphql-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import WebSocket from 'ws';
import * as jwt from 'jsonwebtoken';
import { createSubscriptionServer } from '~/subscriptions';
import { pubsub } from '~/data/utils/pubsub';
import { subscriptionResolver } from '~/data/resolvers/subscriptionResolver';
import type { WsGraphQLContext } from '~/types/graphql';

const wait = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const createTestContext = (): WsGraphQLContext =>
  ({
    user: { _id: 'user-1' },
    userId: 'user-1',
    prisma: {
      messageRoom: {
        findUnique: jest.fn().mockResolvedValue({
          messageType: 'USER',
          userIds: ['user-1'],
        }),
      },
    },
    pubsub,
    requestId: 'subscription-test',
  }) as unknown as WsGraphQLContext;

const testSchema = makeExecutableSchema({
  typeDefs: `
    type Query { health: Boolean }
    type Subscription { message(messageRoomId: String!): Message }
    type Message { _id: String!, messageRoomId: String!, text: String }
  `,
  resolvers: {
    Query: { health: () => true },
    Subscription: { message: subscriptionResolver.Subscription.message },
  },
});

describe('createSubscriptionServer', () => {
  it('attaches a WebSocket server to the GraphQL HTTP server and disposes it', async () => {
    const httpServer = http.createServer();
    const subscriptionServer = createSubscriptionServer(httpServer, {
      schema: testSchema,
      contextFactory: async () => createTestContext(),
    });

    expect(subscriptionServer.wsServer.options.path).toBe('/graphql');

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    await subscriptionServer.dispose();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('delivers a room event to the matching client over two WebSocket connections', async () => {
    const httpServer = http.createServer();
    const subscriptionServer = createSubscriptionServer(httpServer, {
      schema: testSchema,
      contextFactory: async () => createTestContext(),
    });
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address();
    if (!address || typeof address === 'string') {
      throw new Error('Test HTTP server did not expose a port');
    }

    const createTestClient = () =>
      createClient({
        url: `ws://127.0.0.1:${address.port}/graphql`,
        webSocketImpl: WebSocket,
        connectionParams: { authToken: 'test-token' },
      });
    const matchingClient = createTestClient();
    const unrelatedClient = createTestClient();
    const query = `
      subscription MessageSubscription($messageRoomId: String!) {
        message(messageRoomId: $messageRoomId) {
          _id
          messageRoomId
          text
        }
      }
    `;

    const matchingMessage = new Promise<unknown>((resolve, reject) => {
      matchingClient.subscribe(
        { query, variables: { messageRoomId: 'room-1' } },
        { next: resolve, error: reject, complete: () => undefined }
      );
    });
    const unrelatedMessage = new Promise<unknown>((resolve, reject) => {
      unrelatedClient.subscribe(
        { query, variables: { messageRoomId: 'room-2' } },
        { next: resolve, error: reject, complete: () => undefined }
      );
    });

    await wait(100);
    await pubsub.publish('MESSAGE_CREATED', {
      message: { _id: 'message-1', messageRoomId: 'room-1', text: 'Hello' },
    });

    await expect(matchingMessage).resolves.toEqual({
      data: {
        message: {
          _id: 'message-1',
          messageRoomId: 'room-1',
          text: 'Hello',
        },
      },
    });
    await expect(Promise.race([unrelatedMessage, wait(150).then(() => 'no-event')])).resolves.toBe(
      'no-event'
    );

    matchingClient.dispose();
    unrelatedClient.dispose();
    await subscriptionServer.dispose();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  describe('live updates follow the session (#793)', () => {
    const messageQuery = `
      subscription MessageSubscription($messageRoomId: String!) {
        message(messageRoomId: $messageRoomId) {
          _id
        }
      }
    `;

    const startServer = async (context: () => WsGraphQLContext) => {
      const httpServer = http.createServer();
      const subscriptionServer = createSubscriptionServer(httpServer, {
        schema: testSchema,
        contextFactory: async () => context(),
      });
      await new Promise<void>((resolve) => httpServer.listen(0, resolve));
      const address = httpServer.address();
      if (!address || typeof address === 'string') throw new Error('no port');
      const stop = async () => {
        await subscriptionServer.dispose();
        await new Promise<void>((resolve) => httpServer.close(() => resolve()));
      };
      return { port: address.port, stop };
    };

    it('closes the connection with 4403 when its sign-in token expires', async () => {
      const server = await startServer(
        () =>
          ({
            ...createTestContext(),
            user: { _id: 'user-1', accountStatus: 'active' },
          }) as unknown as WsGraphQLContext
      );
      const closed = new Promise<{ code: number; reason: string }>((resolve) => {
        const client = createClient({
          url: `ws://127.0.0.1:${server.port}/graphql`,
          webSocketImpl: WebSocket,
          retryAttempts: 0,
          connectionParams: {
            authToken: jwt.sign({ userId: 'user-1' }, 'test-secret', { expiresIn: 1 }),
          },
          on: {
            closed: (event) => {
              const { code, reason } = event as { code: number; reason: string };
              resolve({ code, reason });
            },
          },
        });
        client.subscribe(
          { query: messageQuery, variables: { messageRoomId: 'room-1' } },
          { next: () => undefined, error: () => undefined, complete: () => undefined }
        );
      });

      await expect(closed).resolves.toEqual({ code: 4403, reason: 'Session expired' });
      await server.stop();
    });

    it('refuses a subscription from a disabled account', async () => {
      const server = await startServer(
        () =>
          ({
            ...createTestContext(),
            user: { _id: 'user-1', accountStatus: 'disabled' },
          }) as unknown as WsGraphQLContext
      );
      const client = createClient({
        url: `ws://127.0.0.1:${server.port}/graphql`,
        webSocketImpl: WebSocket,
        retryAttempts: 0,
        connectionParams: { authToken: 'test-token' },
      });

      const refused = new Promise<unknown>((resolve) => {
        client.subscribe(
          { query: messageQuery, variables: { messageRoomId: 'room-1' } },
          { next: () => undefined, error: resolve, complete: () => undefined }
        );
      });

      await expect(refused).resolves.toEqual([
        expect.objectContaining({
          message: 'This account is disabled',
          extensions: { code: 'FORBIDDEN' },
        }),
      ]);
      client.dispose();
      await server.stop();
    });
  });
});
