import { reactionResolver } from '~/data/resolvers/reactionResolver';
import { toReaction } from '~/data/resolvers/utils/commentsQuotes';
import type { GraphQLContext } from '~/types/graphql';

const userId = '60d5ec49ad414d7a8d5464a0';
const otherUserId = '60d5ec49ad414d7a8d546499';
const reactionId = '60d5ec49ad414d7a8d5464b1';
const actionId = '60d5ec49ad414d7a8d5464c2';
const date = new Date('2026-01-01T00:00:00.000Z');

const REACTION_SELECT = {
  id: true,
  userId: true,
  actionId: true,
  messageId: true,
  emoji: true,
  created: true,
};

function mockContext(user: GraphQLContext['user'] = null) {
  return {
    prisma: {
      reaction: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedUser(): NonNullable<GraphQLContext['user']> {
  return {
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
  } as NonNullable<GraphQLContext['user']>;
}

describe('reactionResolver', () => {
  describe('Query.actionReactions', () => {
    it('returns reactions for an action, newest first', async () => {
      const context = mockContext();
      context.prisma.reaction.findMany.mockResolvedValue([
        {
          id: reactionId,
          userId,
          actionId,
          messageId: null,
          emoji: '👍',
          created: date,
        },
      ]);

      const result = await reactionResolver.Query.actionReactions(
        null,
        { actionId },
        context as never
      );

      expect(context.prisma.reaction.findMany).toHaveBeenCalledWith({
        where: { actionId },
        orderBy: { created: 'desc' },
        select: REACTION_SELECT,
      });
      expect(result).toEqual([
        {
          _id: reactionId,
          userId,
          actionId,
          messageId: undefined,
          emoji: '👍',
          created: date,
        },
      ]);
    });

    it('returns an empty list for a malformed actionId', async () => {
      const context = mockContext();

      const result = await reactionResolver.Query.actionReactions(
        null,
        { actionId: 'not-an-id' },
        context as never
      );

      expect(result).toEqual([]);
      expect(context.prisma.reaction.findMany).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.addActionReaction', () => {
    it('requires authentication', async () => {
      await expect(
        reactionResolver.Mutation.addActionReaction(
          null,
          { reaction: { userId: 'user1', actionId, emoji: '👍' } },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('rejects a malformed actionId', async () => {
      await expect(
        reactionResolver.Mutation.addActionReaction(
          null,
          { reaction: { userId: 'other-user-id', actionId: 'action1', emoji: '👍' } },
          mockContext(authedUser()) as never
        )
      ).rejects.toThrow(/Invalid actionId/);
    });

    it('creates a reaction owned by the authenticated user', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findFirst.mockResolvedValue(null);
      context.prisma.reaction.create.mockResolvedValue({
        id: reactionId,
        userId,
        actionId,
        messageId: null,
        emoji: '👍',
        created: date,
      });

      const result = await reactionResolver.Mutation.addActionReaction(
        null,
        { reaction: { userId: 'other-user-id', actionId, emoji: '👍' } },
        context as never
      );

      expect(context.prisma.reaction.create).toHaveBeenCalledWith({
        data: { userId, actionId, emoji: '👍' },
        select: REACTION_SELECT,
      });
      expect(result._id).toBe(reactionId);
      expect(result.userId).toBe(userId);
      expect(result.emoji).toBe('👍');
    });

    it('updates the existing reaction for the same user and action', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findFirst.mockResolvedValue({
        id: reactionId,
        userId,
        actionId,
        messageId: null,
        emoji: '👍',
        created: date,
      });
      context.prisma.reaction.update.mockResolvedValue({
        id: reactionId,
        userId,
        actionId,
        messageId: null,
        emoji: '❤️',
        created: date,
      });

      const result = await reactionResolver.Mutation.addActionReaction(
        null,
        { reaction: { userId: 'other-user-id', actionId, emoji: '❤️' } },
        context as never
      );

      expect(context.prisma.reaction.create).not.toHaveBeenCalled();
      expect(context.prisma.reaction.update).toHaveBeenCalledWith({
        where: { id: reactionId },
        data: { emoji: '❤️' },
        select: REACTION_SELECT,
      });
      expect(result.emoji).toBe('❤️');
    });
  });

  describe('Mutation.updateActionReaction', () => {
    it('requires authentication', async () => {
      await expect(
        reactionResolver.Mutation.updateActionReaction(
          null,
          { _id: reactionId, emoji: '❤️' },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('throws NOT_FOUND when the reaction does not exist', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findUnique.mockResolvedValue(null);

      await expect(
        reactionResolver.Mutation.updateActionReaction(
          null,
          { _id: reactionId, emoji: '❤️' },
          context as never
        )
      ).rejects.toThrow(/Reaction not found/);
    });

    it('throws FORBIDDEN when the user does not own the reaction', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findUnique.mockResolvedValue({
        id: reactionId,
        userId: otherUserId,
        actionId,
        messageId: null,
        emoji: '👍',
        created: date,
      });

      await expect(
        reactionResolver.Mutation.updateActionReaction(
          null,
          { _id: reactionId, emoji: '❤️' },
          context as never
        )
      ).rejects.toThrow(/Not authorized/);
      expect(context.prisma.reaction.update).not.toHaveBeenCalled();
    });

    it('updates and returns the reaction when owned by the user', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findUnique.mockResolvedValue({
        id: reactionId,
        userId,
        actionId,
        messageId: null,
        emoji: '👍',
        created: date,
      });
      context.prisma.reaction.update.mockResolvedValue({
        id: reactionId,
        userId,
        actionId,
        messageId: null,
        emoji: '❤️',
        created: date,
      });

      const result = await reactionResolver.Mutation.updateActionReaction(
        null,
        { _id: reactionId, emoji: '❤️' },
        context as never
      );

      expect(context.prisma.reaction.update).toHaveBeenCalledWith({
        where: { id: reactionId },
        data: { emoji: '❤️' },
        select: REACTION_SELECT,
      });
      expect(result.emoji).toBe('❤️');
    });
  });

  describe('Mutation.deleteActionReaction', () => {
    it('requires authentication', async () => {
      await expect(
        reactionResolver.Mutation.deleteActionReaction(
          null,
          { _id: reactionId },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('throws NOT_FOUND if the reaction does not exist', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findUnique.mockResolvedValue(null);

      await expect(
        reactionResolver.Mutation.deleteActionReaction(null, { _id: 'rxn-999' }, context as never)
      ).rejects.toThrow(/Reaction not found/);
      expect(context.prisma.reaction.findUnique).not.toHaveBeenCalled();
    });

    it('throws FORBIDDEN when the user does not own the reaction', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findUnique.mockResolvedValue({
        id: reactionId,
        userId: otherUserId,
        actionId,
        messageId: null,
        emoji: '👍',
        created: date,
      });

      await expect(
        reactionResolver.Mutation.deleteActionReaction(null, { _id: reactionId }, context as never)
      ).rejects.toThrow(/Not authorized/);
      expect(context.prisma.reaction.delete).not.toHaveBeenCalled();
    });

    it('deletes the reaction when the user is the owner', async () => {
      const context = mockContext(authedUser());
      context.prisma.reaction.findUnique.mockResolvedValue({
        id: reactionId,
        userId,
        actionId,
        messageId: null,
        emoji: '👍',
        created: date,
      });
      context.prisma.reaction.delete.mockResolvedValue({ id: reactionId });

      const result = await reactionResolver.Mutation.deleteActionReaction(
        null,
        { _id: reactionId },
        context as never
      );

      expect(context.prisma.reaction.delete).toHaveBeenCalledWith({ where: { id: reactionId } });
      expect(result).toBe(true);
    });
  });

  describe('legacy-shaped documents', () => {
    it('maps a reaction without timestamps through toReaction', () => {
      expect(
        toReaction({
          id: reactionId,
          userId,
          actionId,
          messageId: null,
          emoji: '👍',
          created: date,
        })
      ).toEqual({
        _id: reactionId,
        userId,
        actionId,
        messageId: undefined,
        emoji: '👍',
        created: date,
      });
    });
  });
});
