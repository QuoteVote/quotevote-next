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
    it('returns reactions for a given actionId using findByActionId', async () => {
      const mockReactions = [
        {
          _id: new mongoose.Types.ObjectId(),
          userId: new mongoose.Types.ObjectId(),
          actionId: new mongoose.Types.ObjectId(),
          emoji: '👍',
        },
      ];

      (Reaction.findByActionId as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockReactions),
      });

      const result = await reactionResolver.Query.actionReactions(
        null,
        { actionId: 'action-123' }
      );

      expect(Reaction.findByActionId).toHaveBeenCalledWith('action-123');
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

    it('upserts and returns reaction using context.user._id', async () => {
      const mockRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId(userId),
        actionId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464c2'),
        emoji: '👍',
        created: new Date(),
      };

      (Reaction.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockRxn),
      });

      const result = await reactionResolver.Mutation.addActionReaction(
        null,
        { reaction: { userId: 'other-user-id', actionId: '60d5ec49ad414d7a8d5464c2', emoji: '👍' } },
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(Reaction.findOneAndUpdate).toHaveBeenCalledWith(
        { userId, actionId: '60d5ec49ad414d7a8d5464c2' },
        { $set: { emoji: '👍' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
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

    it('throws FORBIDDEN when user does not own reaction', async () => {
      const existingRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d546499'), // different user
        actionId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464c2'),
        emoji: '👍',
      };

      (Reaction.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingRxn),
      });

      await expect(
        reactionResolver.Mutation.updateActionReaction(
          null,
          { _id: '60d5ec49ad414d7a8d5464b1', emoji: '❤️' },
          mockContext({
            _id: userId,
            username: 'alice',
            email: 'alice@example.com',
          } as NonNullable<GraphQLContext['user']>)
        )
      ).rejects.toThrow(/Not authorized/);
    });

    it('updates and returns the reaction when owned by user', async () => {
      const existingRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId(userId),
        actionId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464c2'),
        emoji: '👍',
      };

      const mockRxn = {
        ...existingRxn,
        emoji: '❤️',
      };

      (Reaction.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingRxn),
      });

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

  describe('Mutation.deleteActionReaction', () => {
    it('requires authentication', async () => {
      await expect(
        reactionResolver.Mutation.deleteActionReaction(
          null,
          { _id: 'rxn-123' },
          mockContext(null)
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('throws NOT_FOUND if reaction does not exist', async () => {
      (Reaction.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(
        reactionResolver.Mutation.deleteActionReaction(
          null,
          { _id: 'rxn-999' },
          mockContext({
            _id: userId,
            username: 'alice',
            email: 'alice@example.com',
          } as NonNullable<GraphQLContext['user']>)
        )
      ).rejects.toThrow(/Reaction not found/);
    });

    it('throws FORBIDDEN when user does not own reaction', async () => {
      const existingRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d546499'), // different user
      };

      (Reaction.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingRxn),
      });

      await expect(
        reactionResolver.Mutation.deleteActionReaction(
          null,
          { _id: '60d5ec49ad414d7a8d5464b1' },
          mockContext({
            _id: userId,
            username: 'alice',
            email: 'alice@example.com',
          } as NonNullable<GraphQLContext['user']>)
        )
      ).rejects.toThrow(/Not authorized/);
    });

    it('deletes reaction successfully when user is owner', async () => {
      const existingRxn = {
        _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464b1'),
        userId: new mongoose.Types.ObjectId(userId),
      };

      (Reaction.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingRxn),
      });

      (Reaction.findByIdAndDelete as jest.Mock).mockResolvedValue(existingRxn);

      const result = await reactionResolver.Mutation.deleteActionReaction(
        null,
        { _id: '60d5ec49ad414d7a8d5464b1' },
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(Reaction.findByIdAndDelete).toHaveBeenCalledWith('60d5ec49ad414d7a8d5464b1');
      expect(result).toBe(true);
    });
  });
});

