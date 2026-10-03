import { GraphQLError } from 'graphql';
import { subscriptionResolver } from '~/data/resolvers/subscriptionResolver';
import { SUBSCRIPTION_EVENTS, type GraphQLContext } from '~/types/graphql';

const createContext = (overrides: Partial<GraphQLContext> = {}): GraphQLContext =>
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
    pubsub: {
      asyncIterableIterator: jest.fn().mockReturnValue({
        next: jest.fn(),
        return: jest.fn(),
      }),
    },
    ...overrides,
  }) as unknown as GraphQLContext;

describe('subscriptionResolver', () => {
  it('subscribes to messages on the requested room', async () => {
    const context = createContext();
    const subscribe = subscriptionResolver.Subscription.message.subscribe;

    await subscribe(null, { messageRoomId: 'room-1' }, context);

    expect(context.pubsub.asyncIterableIterator).toHaveBeenCalledWith(
      SUBSCRIPTION_EVENTS.MESSAGE_CREATED
    );
  });

  it('filters message events to the requested room', async () => {
    const context = createContext();
    const subscribe = subscriptionResolver.Subscription.message.subscribe;
    const source = {
      next: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: { message: { messageRoomId: 'room-2' } },
        })
        .mockResolvedValueOnce({
          done: false,
          value: { message: { messageRoomId: 'room-1' } },
        }),
    };
    (context.pubsub.asyncIterableIterator as jest.Mock).mockReturnValue(source);

    const iterator = await subscribe(null, { messageRoomId: 'room-1' }, context);

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: { message: { messageRoomId: 'room-1' } },
    });
  });

  it('rejects typing subscriptions without authentication', async () => {
    const context = createContext({ user: null, userId: null });

    await expect(
      subscriptionResolver.Subscription.typing.subscribe(null, { messageRoomId: 'room-1' }, context)
    ).rejects.toEqual(expect.any(GraphQLError));
  });

  it('filters presence events by user when a user ID is supplied', async () => {
    const context = createContext();
    const source = {
      next: jest
        .fn()
        .mockResolvedValueOnce({
          done: false,
          value: { presence: { userId: 'user-2' } },
        })
        .mockResolvedValueOnce({
          done: false,
          value: { presence: { userId: 'user-1' } },
        }),
    };
    (context.pubsub.asyncIterableIterator as jest.Mock).mockReturnValue(source);

    const iterator = subscriptionResolver.Subscription.presence.subscribe(
      null,
      { userId: 'user-1' },
      context
    );

    await expect(iterator.next()).resolves.toEqual({
      done: false,
      value: { presence: { userId: 'user-1' } },
    });
  });

  it('rejects notification subscriptions for another user', () => {
    const context = createContext();

    expect(() =>
      subscriptionResolver.Subscription.notification.subscribe(null, { userId: 'user-2' }, context)
    ).toThrow(expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }));
  });
});
