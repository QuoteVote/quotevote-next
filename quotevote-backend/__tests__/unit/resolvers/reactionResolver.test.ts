import Reaction from '~/data/models/Reaction';
import { reactionResolver } from '~/data/resolvers/reactionResolver';
import type { GraphQLContext } from '~/types/graphql';
import mongoose from 'mongoose';

jest.mock('~/data/models/Reaction');

const userId = '60d5ec49ad414d7a8d5464a0';

function mockContext(user: GraphQLContext['user'] = null): GraphQLContext {
  return {
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
  };
}

describe('reactionResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.actionReactions', () => {
    it('returns reactions for a given actionId', async () => {
      const mockReactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          actionId: new mongoose.Types.ObjectId(),
          emoji: '👍',
        },
      ];

      (Reaction.find as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReactions),
      });

      const result = await reactionResolver.Query.actionReactions(
        null,
        { actionId: 'action-123' }
      );

      expect(Reaction.find).toHaveBeenCalledWith({ actionId: 'action-123' });
      expect(result).toHaveLength(1);
      expect(result[0].emoji).toBe('👍');
    });
  });

  describe('Mutation.addActionReaction', () => {
    it('requires authentication', async () => {
      await expect(
        reactionResolver.Mutation.addActionReaction(
          null,
          { reaction: { userId: 'user1', actionId: 'action1', emoji: '👍' } },
          mockContext(null)
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('creates and returns a new reaction', async () => {
      const mockRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId(userId),
        actionId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464c2'),
        emoji: '👍',
        created: new Date(),
      };

      (Reaction.create as jest.Mock).mockResolvedValue(mockRxn);

      const result = await reactionResolver.Mutation.addActionReaction(
        null,
        { reaction: { userId, actionId: '60d5ec49ad414d7a8d5464c2', emoji: '👍' } },
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(Reaction.create).toHaveBeenCalledWith({
        userId,
        actionId: '60d5ec49ad414d7a8d5464c2',
        emoji: '👍',
      });
      expect(result._id).toBe(mockRxn._id.toString());
      expect(result.emoji).toBe('👍');
    });
  });

  describe('Mutation.updateActionReaction', () => {
    it('requires authentication', async () => {
      await expect(
        reactionResolver.Mutation.updateActionReaction(
          null,
          { _id: 'rxn-123', emoji: '❤️' },
          mockContext(null)
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('updates and returns the reaction', async () => {
      const mockRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId(userId),
        actionId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464c2'),
        emoji: '❤️',
      };

      (Reaction.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRxn),
      });

      const result = await reactionResolver.Mutation.updateActionReaction(
        null,
        { _id: '60d5ec49ad414d7a8d5464b1', emoji: '❤️' },
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(Reaction.findByIdAndUpdate).toHaveBeenCalledWith(
        '60d5ec49ad414d7a8d5464b1',
        { $set: { emoji: '❤️' } },
        { new: true }
      );
      expect(result.emoji).toBe('❤️');
    });
  });
});
