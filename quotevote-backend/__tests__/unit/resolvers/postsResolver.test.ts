import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { postsResolver } from '~/data/resolvers/postsResolver';
import Post from '~/data/models/Post';
import User from '~/data/models/User';

// Mock the models
jest.mock('~/data/models/Post');
jest.mock('~/data/models/User');

describe('postsResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.posts', () => {
    it('throws BAD_USER_INPUT GraphQLError when invalid userId is provided', async () => {
      await expect(
        postsResolver.Query.posts(null, { userId: 'invalid-id' })
      ).rejects.toThrow(
        new GraphQLError('Invalid userId format', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );

      expect(Post.find).not.toHaveBeenCalled();
    });

    it('throws BAD_USER_INPUT GraphQLError when invalid tagId is provided', async () => {
      await expect(
        postsResolver.Query.posts(null, { tagId: 'invalid-id' })
      ).rejects.toThrow(
        new GraphQLError('Invalid tagId format', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );

      expect(Post.find).not.toHaveBeenCalled();
    });

    it('returns empty result early if a username search matches no users', async () => {
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await postsResolver.Query.posts(null, { searchKey: '@nonexistent' });

      expect(result.entities).toEqual([]);
      expect(result.pagination.total_count).toBe(0);
      expect(Post.find).not.toHaveBeenCalled();
    });

    it('filters by matching user ID when a username is searched and found', async () => {
      const mockUserId = new mongoose.Types.ObjectId();
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ _id: mockUserId }]),
        }),
      });

      // Mocks for Post
      (Post.countDocuments as jest.Mock).mockResolvedValue(1);
      const mockPost = {
        _id: new mongoose.Types.ObjectId(),
        userId: mockUserId,
        tagId: new mongoose.Types.ObjectId(),
        title: 'Title',
        text: 'Text',
        votedBy: [],
      };

      (Post.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([mockPost]),
            }),
          }),
        }),
      });

      // User lookup for post creators hydrate
      (User.find as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: mockUserId }]),
          }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([{ _id: mockUserId, username: 'alice' }]),
          }),
        });

      const result = await postsResolver.Query.posts(null, { searchKey: '@alice' });

      expect(Post.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
        })
      );
      expect(result.entities[0].userId).toBe(mockUserId.toString());
    });
  });
});
