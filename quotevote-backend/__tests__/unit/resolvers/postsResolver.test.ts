import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { postsResolver } from '~/data/resolvers/postsResolver';
import Post from '~/data/models/Post';
import User from '~/data/models/User';
import type { GraphQLContext } from '~/types/graphql';

// Mock the models
jest.mock('~/data/models/Post');
jest.mock('~/data/models/User');

const validUserId = '60d5ec49ad414d7a8d5464a0';
const otherUserId = '60d5ec49ad414d7a8d5464a1';
const validPostId = '60d5ec49ad414d7a8d5464a2';

function mockContext(overrides: Partial<NonNullable<GraphQLContext['user']>> = {}): GraphQLContext {
  return {
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: {
      _id: validUserId,
      username: 'alice',
      email: 'alice@example.com',
      admin: false,
      ...overrides,
    } as NonNullable<GraphQLContext['user']>,
  } as GraphQLContext;
}

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

    it('throws BAD_USER_INPUT GraphQLError when invalid groupId is provided', async () => {
      await expect(
        postsResolver.Query.posts(null, { groupId: 'invalid-id' })
      ).rejects.toThrow(
        new GraphQLError('Invalid groupId format', {
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
        groupId: new mongoose.Types.ObjectId(),
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

  describe('Mutation.reportPost', () => {
    it('throws UNAUTHENTICATED GraphQLError when user is not authenticated', async () => {
      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Authentication required',
          extensions: expect.objectContaining({ code: 'UNAUTHENTICATED' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when postId or userId is missing', async () => {
      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: '', userId: validUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post ID and User ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: '' },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post ID and User ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when postId is invalid ObjectId', async () => {
      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: 'invalid-post-id', userId: validUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid ID format',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when userId is invalid ObjectId', async () => {
      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: 'invalid-user-id' },
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
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: otherUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Not authorized to report on behalf of another user',
          extensions: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('throws NOT_FOUND GraphQLError when post does not exist', async () => {
      (Post.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    it('throws NOT_FOUND GraphQLError when post is deleted', async () => {
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validPostId),
        userId: new mongoose.Types.ObjectId(otherUserId),
        deleted: true,
      });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when author attempts to report own post', async () => {
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validPostId),
        userId: new mongoose.Types.ObjectId(validUserId),
        deleted: false,
      });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Cannot report your own post',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when user has already reported the post', async () => {
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validPostId),
        userId: new mongoose.Types.ObjectId(otherUserId),
        reportedBy: [validUserId],
        deleted: false,
      });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          mockContext()
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'You have already reported this post',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('successfully reports post and returns updated post object', async () => {
      (Post.findById as jest.Mock).mockResolvedValue({
        _id: new mongoose.Types.ObjectId(validPostId),
        userId: new mongoose.Types.ObjectId(otherUserId),
        reportedBy: [],
        reported: 0,
        deleted: false,
      });

      const updatedDoc = {
        _id: new mongoose.Types.ObjectId(validPostId),
        userId: new mongoose.Types.ObjectId(otherUserId),
        groupId: new mongoose.Types.ObjectId(),
        title: 'Reported Post',
        text: 'Post content',
        reportedBy: [validUserId],
        reported: 1,
        votedBy: [],
      };

      (Post.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedDoc),
      });

      const result = await postsResolver.Mutation.reportPost(
        null,
        { postId: validPostId, userId: validUserId },
        mockContext()
      );

      expect(Post.findByIdAndUpdate).toHaveBeenCalledWith(
        validPostId,
        {
          $addToSet: { reportedBy: validUserId },
          $inc: { reported: 1 },
        },
        { new: true }
      );

      expect(result).toMatchObject({
        _id: validPostId,
        userId: otherUserId,
        reportedBy: [validUserId],
        reported: 1,
      });
    });
  });
});
