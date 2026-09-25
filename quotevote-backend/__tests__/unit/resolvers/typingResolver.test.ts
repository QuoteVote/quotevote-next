import { GraphQLError } from 'graphql';
import { typingResolver } from '~/data/resolvers/typingResolver';
import { SUBSCRIPTION_EVENTS } from '~/types/graphql';
import type { GraphQLContext } from '~/types/graphql';

const actorId = '60d5ec49ad414d7a8d5464a0';
const messageRoomId = '60d5ec49ad414d7a8d5464b0';
const now = new Date('2024-01-15T12:00:00.000Z');

function mockContext(
  options: {
    user?: GraphQLContext['user'];
    typing?: Record<string, jest.Mock>;
    messageRoom?: Record<string, jest.Mock>;
  } = {}
): GraphQLContext {
  const user =
    options.user === undefined
      ? ({ _id: actorId } as NonNullable<GraphQLContext['user']>)
      : options.user;

  return {
    prisma: {
      typing: {
        upsert: jest.fn(),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
        ...options.typing,
      },
        messageRoom: {
        findUnique: jest.fn().mockResolvedValue({
          messageType: 'USER',
          userIds: [actorId],
        }),
        ...options.messageRoom,
      },
    } as unknown as GraphQLContext['prisma'],
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {
      publish: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      asyncIterableIterator: jest.fn(),
    },
    user,
    userId: user?._id?.toString() ?? null,
    requestId: 'test-request-id',
  };
}

describe('typingResolver', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Mutation.updateTyping', () => {
    it('requires authentication', async () => {
      await expect(
        typingResolver.Mutation.updateTyping(
          null,
          { typing: { messageRoomId, isTyping: true } },
          mockContext({ user: null })
        )
      ).rejects.toThrow(GraphQLError);
    });

     it('rejects an unknown room', async () => {
      const context = mockContext({
        messageRoom: { findUnique: jest.fn().mockResolvedValue(null) },
      });
      await expect(
        typingResolver.Mutation.updateTyping(
          null,
          { typing: { messageRoomId, isTyping: true } },
          context
        )
      ).rejects.toThrow('Room not found');
    });

    it('upserts typing state with a ten-second expiration and publishes it', async () => {
      const upsert = jest.fn().mockResolvedValue({});
      const context = mockContext({ typing: { upsert } });

      const result = await typingResolver.Mutation.updateTyping(
        null,
        { typing: { messageRoomId, isTyping: true } },
        context
      );

      const expiresAt = new Date(now.getTime() + 10_000);
      expect(upsert).toHaveBeenCalledWith({
        where: { messageRoomId_userId: { messageRoomId, userId: actorId } },
        create: {
          messageRoomId,
          userId: actorId,
          isTyping: true,
          timestamp: now,
          expiresAt,
        },
        update: { isTyping: true, timestamp: now, expiresAt },
      });
      expect(context.pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.TYPING_UPDATED, {
        typing: {
          messageRoomId,
          userId: actorId,
          isTyping: true,
          timestamp: now.getTime(),
        },
      });
      expect(result).toEqual({ success: true, messageRoomId, isTyping: true });
    });

    it('refreshes timestamp and expiration on repeated typing updates', async () => {
      const upsert = jest.fn().mockResolvedValue({});
      const context = mockContext({ typing: { upsert } });

      await typingResolver.Mutation.updateTyping(
        null,
        { typing: { messageRoomId, isTyping: true } },
        context
      );
      jest.setSystemTime(new Date(now.getTime() + 5_000));
      await typingResolver.Mutation.updateTyping(
        null,
        { typing: { messageRoomId, isTyping: true } },
        context
      );

      const firstUpdate = upsert.mock.calls[0][0].update;
      const secondUpdate = upsert.mock.calls[1][0].update;
      expect(secondUpdate.timestamp.getTime()).toBe(firstUpdate.timestamp.getTime() + 5_000);
      expect(secondUpdate.expiresAt.getTime()).toBe(firstUpdate.expiresAt.getTime() + 5_000);
      expect(secondUpdate.expiresAt.getTime() - secondUpdate.timestamp.getTime()).toBe(10_000);
    });

    it('deletes an existing indicator and publishes stopped typing', async () => {
      const deleteMany = jest.fn().mockResolvedValue({ count: 1 });
      const context = mockContext({ typing: { deleteMany } });

      const result = await typingResolver.Mutation.updateTyping(
        null,
        { typing: { messageRoomId, isTyping: false } },
        context
      );

      expect(deleteMany).toHaveBeenCalledWith({ where: { messageRoomId, userId: actorId } });
      expect(context.pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.TYPING_UPDATED, {
        typing: {
          messageRoomId,
          userId: actorId,
          isTyping: false,
          timestamp: now.getTime(),
        },
      });
      expect(result).toEqual({ success: true, messageRoomId, isTyping: false });
    });
  });

  describe('Query.getTypingUsers', () => {
    it('returns only unexpired typing indicators for the requested room', async () => {
      const records = [
        {
          messageRoomId,
          userId: actorId,
          isTyping: true,
          timestamp: now,
        },
      ];
      const findMany = jest.fn().mockResolvedValue(records);

      const result = await typingResolver.Query.getTypingUsers(
        null,
        { messageRoomId },
        mockContext({ typing: { findMany } })
      );

      expect(findMany).toHaveBeenCalledWith({
        where: {
          messageRoomId,
          isTyping: true,
          expiresAt: { gt: now },
        },
        select: {
          messageRoomId: true,
          userId: true,
          isTyping: true,
          timestamp: true,
        },
      });
      expect(result).toEqual(records);
    });

    it('rejects a non-member of a USER room', async () => {
      const context = mockContext({
        messageRoom: {
          findUnique: jest.fn().mockResolvedValue({ messageType: 'USER', userIds: ['other-user'] }),
        },
      });
      await expect(
        typingResolver.Mutation.updateTyping(
          null,
          { typing: { messageRoomId, isTyping: true } },
          context
        )
      ).rejects.toThrow('Not a member of this room');
    });
  });
});
