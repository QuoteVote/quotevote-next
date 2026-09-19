import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { userResolver } from '~/data/resolvers/userResolver';
import User from '~/data/models/User';
import BotReport from '~/data/models/BotReport';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/models/User');
jest.mock('~/data/models/BotReport');

const actorId = '60d5ec49ad414d7a8d5464a0';
const otherId = '60d5ec49ad414d7a8d5464a1';

function mockContext(overrides: Partial<NonNullable<GraphQLContext['user']>> = {}): GraphQLContext {
  return {
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: {
      _id: actorId,
      username: 'alice',
      email: 'alice@example.com',
      admin: false,
      ...overrides,
    } as NonNullable<GraphQLContext['user']>,
  };
}

describe('userResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.searchUser', () => {
    it('returns an empty array early if queryName is empty or whitespace only', async () => {
      const resultEmpty = await userResolver.Query.searchUser(null, { queryName: '' });
      const resultWhitespace = await userResolver.Query.searchUser(null, { queryName: '   ' });

      expect(resultEmpty).toEqual([]);
      expect(resultWhitespace).toEqual([]);
      expect(User.find).not.toHaveBeenCalled();
    });

    it('escapes special regex characters to prevent injection', async () => {
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([
              {
                _id: new mongoose.Types.ObjectId('60d5ec49ad414d7a8d5464a0'),
                name: 'Alice Cooper',
                username: 'alice',
                accountStatus: 'active',
              },
            ]),
          }),
        }),
      });

      const result = await userResolver.Query.searchUser(null, { queryName: '@.*' });

      expect(User.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { name: expect.any(RegExp) },
            { username: expect.any(RegExp) },
          ],
          accountStatus: 'active',
        })
      );

      // Verify that the regex matches the escaped pattern
      const callArg = (User.find as jest.Mock).mock.calls[0][0];
      const nameRegex = callArg.$or[0].name;
      expect(nameRegex.source).toBe('@\\.\\*');
      expect(nameRegex.flags).toBe('i');

      expect(result).toEqual([
        {
          _id: '60d5ec49ad414d7a8d5464a0',
          name: 'Alice Cooper',
          username: 'alice',
          accountStatus: 'active',
        },
      ]);
    });
  });

  describe('Mutation.updateUser', () => {
    it('requires authentication', async () => {
      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: actorId, bio: 'Hello' } },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('updates own bio as plain text', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(actorId),
          username: 'alice',
          bio: 'Thoughtful dialogue',
        }),
      });

      const result = await userResolver.Mutation.updateUser(
        null,
        { user: { _id: actorId, bio: '  Thoughtful dialogue  ' } },
        mockContext()
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        actorId,
        { $set: { bio: 'Thoughtful dialogue' } },
        { new: true }
      );
      expect(result.bio).toBe('Thoughtful dialogue');
    });

    it('rejects HTML in bio', async () => {
      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: actorId, bio: '<b>nope</b>' } },
          mockContext()
        )
      ).rejects.toThrow(/plain text/);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('forbids non-admin from updating another user', async () => {
      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: otherId, bio: 'Nope' } },
          mockContext({ admin: false })
        )
      ).rejects.toThrow(/Not authorized/);
    });

    it('allows admin to update contributorBadge on another user', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(otherId),
          username: 'bob',
          contributorBadge: true,
        }),
      });

      const result = await userResolver.Mutation.updateUser(
        null,
        { user: { _id: otherId, contributorBadge: true } },
        mockContext({ admin: true })
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        otherId,
        { $set: { contributorBadge: true } },
        { new: true }
      );
      expect(result.contributorBadge).toBe(true);
    });
  });

  describe('Mutation.updateUserAvatar', () => {
    const avatarQualities = {
      topType: 'LongHairStraight',
      hairColor: 'Brown',
      clotheType: 'Hoodie',
    };

    it('requires authentication', async () => {
      await expect(
        userResolver.Mutation.updateUserAvatar(
          null,
          { user_id: actorId, avatarQualities },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('updates own avatar qualities', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(actorId),
          username: 'alice',
          avatar: avatarQualities,
        }),
      });

      const result = await userResolver.Mutation.updateUserAvatar(
        null,
        { user_id: actorId, avatarQualities },
        mockContext()
      );

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        actorId,
        { $set: { avatar: avatarQualities } },
        { new: true }
      );
      expect(result.avatar).toEqual(avatarQualities);
    });

    it('forbids updating another user avatar', async () => {
      await expect(
        userResolver.Mutation.updateUserAvatar(
          null,
          { user_id: otherId, avatarQualities },
          mockContext({ admin: false })
        )
      ).rejects.toThrow(/Not authorized/);
      expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('rejects non-object avatarQualities', async () => {
      await expect(
        userResolver.Mutation.updateUserAvatar(
          null,
          { user_id: actorId, avatarQualities: null },
          mockContext()
        )
      ).rejects.toThrow(/avatarQualities/);
    });
  });

  describe('Mutation.reportBot', () => {
    it('throws UNAUTHENTICATED GraphQLError when user is not authenticated', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: actorId },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Authentication required',
          extensions: expect.objectContaining({ code: 'UNAUTHENTICATED' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when userId or reporterId is missing', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: '', reporterId: actorId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User ID and Reporter ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: '' },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User ID and Reporter ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when userId is invalid ObjectId', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: 'not-valid-id', reporterId: actorId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid ID format',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when reporterId is invalid ObjectId', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: 'not-valid-id' },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid ID format',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws FORBIDDEN GraphQLError when reporting on behalf of another user', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: otherId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Not authorized to report on behalf of another user',
          extensions: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when reporting yourself as a bot', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: actorId, reporterId: actorId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Cannot report yourself as a bot',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws NOT_FOUND GraphQLError when target user does not exist', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: actorId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when user has already reported this bot', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId(otherId) });
      (BotReport.findOne as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        reporterId: new mongoose.Types.ObjectId(actorId),
        userId: new mongoose.Types.ObjectId(otherId),
      });

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: actorId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'You have already reported this user as a bot',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('handles MongoDB duplicate key error (code 11000) as BAD_USER_INPUT', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId(otherId) });
      (BotReport.findOne as jest.Mock).mockResolvedValue(null);
      const duplicateError = new Error('Duplicate key error') as Error & { code?: number };
      duplicateError.code = 11000;
      (BotReport.create as jest.Mock).mockRejectedValue(duplicateError);

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: otherId, reporterId: actorId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'You have already reported this user as a bot',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('successfully reports bot, persists BotReport, increments User botReports, and returns true', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: new mongoose.Types.ObjectId(otherId) });
      (BotReport.findOne as jest.Mock).mockResolvedValue(null);
      (BotReport.create as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        reporterId: new mongoose.Types.ObjectId(actorId),
        userId: new mongoose.Types.ObjectId(otherId),
      });
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: otherId });

      const result = await userResolver.Mutation.reportBot(
        null,
        { userId: otherId, reporterId: actorId },
        mockContext()
      );

      expect(BotReport.create).toHaveBeenCalledWith({
        reporterId: new mongoose.Types.ObjectId(actorId),
        userId: new mongoose.Types.ObjectId(otherId),
      });

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        otherId,
        {
          $inc: { botReports: 1 },
          $set: { lastBotReportDate: expect.any(Date) },
        }
      );

      expect(result).toBe(true);
    });
  });
});
