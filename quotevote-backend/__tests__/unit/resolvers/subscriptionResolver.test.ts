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

  it('rejects authenticated non-members from message subscriptions', async () => {
    const context = createContext({
      user: { _id: 'user-2', username: 'bob', email: 'bob@example.com' },
      userId: 'user-2',
    });

    await expect(
      subscriptionResolver.Subscription.message.subscribe(
        null,
        { messageRoomId: 'room-1' },
        context
      )
    ).rejects.toEqual(expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }));
  });

  it('rejects typing subscriptions without authentication', async () => {
    const context = createContext({ user: null, userId: null });

    await expect(
      subscriptionResolver.Subscription.typing.subscribe(null, { messageRoomId: 'room-1' }, context)
    ).rejects.toEqual(expect.any(GraphQLError));
  });

  it('rejects authenticated non-members from typing subscriptions', async () => {
    const context = createContext({
      user: { _id: 'user-2', username: 'bob', email: 'bob@example.com' },
      userId: 'user-2',
    });

    await expect(
      subscriptionResolver.Subscription.typing.subscribe(null, { messageRoomId: 'room-1' }, context)
    ).rejects.toEqual(expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }));
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

  describe('presence events (#749)', () => {
    const presenceSource = (...events: object[]) => {
      const next = jest.fn();
      for (const value of events) next.mockResolvedValueOnce({ done: false, value });
      next.mockResolvedValue({ done: true, value: undefined });
      return { next, return: jest.fn() };
    };
    const withBlocks = (blocks: { blockerId: string }[]) =>
      createContext({
        prisma: {
          userBlock: { findMany: jest.fn().mockResolvedValue(blocks) },
        } as unknown as GraphQLContext['prisma'],
      });

    it.each([
      ['the subscriber blocked them', 'user-1'],
      ['they blocked the subscriber', 'user-2'],
    ])('skips a member whose presence is hidden because %s', async (_label, blockerId) => {
      const context = withBlocks([{ blockerId }]);
      (context.pubsub.asyncIterableIterator as jest.Mock).mockReturnValue(
        presenceSource({ presence: { userId: 'user-2', status: 'online' } })
      );

      const iterator = subscriptionResolver.Subscription.presence.subscribe(
        null,
        { userId: 'user-2' },
        context
      );

      await expect(iterator.next()).resolves.toMatchObject({ done: true });
    });

    it('passes a member with no block between them', async () => {
      const context = withBlocks([]);
      const event = { presence: { userId: 'user-2', status: 'online' } };
      (context.pubsub.asyncIterableIterator as jest.Mock).mockReturnValue(presenceSource(event));

      const iterator = subscriptionResolver.Subscription.presence.subscribe(null, {}, context);

      await expect(iterator.next()).resolves.toEqual({ done: false, value: event });
    });

    it('shows an invisible member as offline with no status message to others', () => {
      const context = createContext();
      const resolve = subscriptionResolver.Subscription.presence.resolve;
      const presence = { userId: 'user-2', status: 'invisible' as const, statusMessage: 'away' };

      expect(resolve({ presence }, {}, context)).toEqual({
        userId: 'user-2',
        status: 'offline',
        statusMessage: '',
      });
    });

    it('shows a member their own invisible status', () => {
      const context = createContext();
      const presence = { userId: 'user-1', status: 'invisible' as const, statusMessage: 'busy' };

      expect(subscriptionResolver.Subscription.presence.resolve({ presence }, {}, context)).toEqual(
        presence
      );
    });
  });

  it('rejects notification subscriptions for another user', () => {
    const context = createContext();

    expect(() =>
      subscriptionResolver.Subscription.notification.subscribe(null, { userId: 'user-2' }, context)
    ).toThrow(expect.objectContaining({ extensions: { code: 'FORBIDDEN' } }));
  });
});
