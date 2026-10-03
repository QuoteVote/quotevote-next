import { GraphQLError } from 'graphql';
import { POST_RECORD_SELECT } from '~/data/utils/postPrismaMapper';
import { postsResolver } from '~/data/resolvers/postsResolver';
import type { GraphQLContext } from '~/types/graphql';

const userId = '507f1f77bcf86cd799439011';
const tagId = '507f1f77bcf86cd799439012';
const postId = '507f1f77bcf86cd799439013';

function mockContext(user: GraphQLContext['user'] = null): GraphQLContext {
  return {
    prisma: {
      user: {
        findMany: jest.fn(),
      },
      post: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    } as unknown as GraphQLContext['prisma'],
    user,
    userId: user?._id?.toString() ?? null,
    requestId: 'test-request-id',
  } as GraphQLContext;
}

describe('postsResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.posts', () => {
    it('throws BAD_USER_INPUT GraphQLError when invalid userId is provided', async () => {
      const ctx = mockContext();

      await expect(postsResolver.Query.posts(null, { userId: 'invalid-id' }, ctx)).rejects.toThrow(
        new GraphQLError('Invalid userId format', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );

      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('throws BAD_USER_INPUT GraphQLError when invalid tagId is provided', async () => {
      const ctx = mockContext();

      await expect(postsResolver.Query.posts(null, { tagId: 'invalid-id' }, ctx)).rejects.toThrow(
        new GraphQLError('Invalid tagId format', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );

      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('returns empty result early if a username search matches no users', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await postsResolver.Query.posts(null, { searchKey: '@nonexistent' }, ctx);

      expect(result.entities).toEqual([]);
      expect(result.pagination.total_count).toBe(0);
      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('filters by matching user ID when a username is searched and found', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([{ id: userId }])
        .mockResolvedValueOnce([{ id: userId, username: 'alice', name: 'Alice' }]);
      (ctx.prisma.post.count as jest.Mock).mockResolvedValue(1);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([
        {
          id: postId,
          userId,
          tagId,
          title: 'Title',
          text: 'Text',
          votedBy: [],
          created: new Date(),
        },
      ]);

      const result = await postsResolver.Query.posts(null, { searchKey: '@alice' }, ctx);

      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            deleted: { not: true },
          }),
        })
      );
      expect(result.entities[0].userId).toBe(userId);
      expect(result.entities[0]._id).toBe(postId);
      expect(result.entities[0].tagId).toBe(tagId);
    });

    it('filters by tagId and approved, and sorts by dayPoints when interactions is true', async () => {
      const ctx = mockContext();
      (ctx.prisma.post.count as jest.Mock).mockResolvedValue(0);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      await postsResolver.Query.posts(null, { tagId, approved: true, interactions: true }, ctx);

      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith({
        where: {
          deleted: { not: true },
          tagId,
          approved: { gt: 0 },
        },
        orderBy: [{ dayPoints: 'desc' }, { created: 'desc' }],
        skip: 0,
        take: 15,
        select: POST_RECORD_SELECT,
      });
    });

    it('drops hashtag prefix matches that fail the word boundary', async () => {
      const ctx = mockContext();
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([
        {
          id: postId,
          userId,
          tagId,
          title: 'A #climate note',
          text: 'Body',
          votedBy: [],
          created: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          id: '507f1f77bcf86cd799439014',
          userId,
          tagId,
          title: 'A #climatechange note',
          text: 'Body',
          votedBy: [],
          created: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await postsResolver.Query.posts(
        null,
        { searchKey: '#climate', limit: 15 },
        ctx
      );

      expect(result.entities.map((post) => post._id)).toEqual([postId]);
      expect(result.pagination.total_count).toBe(1);
      expect(ctx.prisma.post.count).not.toHaveBeenCalled();
      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: POST_RECORD_SELECT })
      );
    });

    it('uses contains search for plain text and hashtags', async () => {
      const ctx = mockContext();
      (ctx.prisma.post.count as jest.Mock).mockResolvedValue(0);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      await postsResolver.Query.posts(null, { searchKey: '#climate debate' }, ctx);

      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                OR: [
                  { title: { contains: '#climate', mode: 'insensitive' } },
                  { text: { contains: '#climate', mode: 'insensitive' } },
                ],
              },
              {
                OR: [
                  { title: { contains: 'debate', mode: 'insensitive' } },
                  { text: { contains: 'debate', mode: 'insensitive' } },
                ],
              },
            ],
          }),
        })
      );
    });
  });

  describe('Mutation.reportPost', () => {
    const validUserId = '60d5ec49ad414d7a8d5464a0';
    const otherUserId = '60d5ec49ad414d7a8d5464a1';
    const validPostId = '60d5ec49ad414d7a8d5464a2';

    const authContext = mockContext({
      _id: validUserId,
      admin: false,
    } as NonNullable<GraphQLContext['user']>);

    it('throws UNAUTHENTICATED GraphQLError when user is not authenticated', async () => {
      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          mockContext(null)
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
        postsResolver.Mutation.reportPost(null, { postId: '', userId: validUserId }, authContext)
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post ID and User ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );

      await expect(
        postsResolver.Mutation.reportPost(null, { postId: validPostId, userId: '' }, authContext)
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
          authContext
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
          authContext
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
          authContext
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Not authorized to report on behalf of another user',
          extensions: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('throws NOT_FOUND GraphQLError when post does not exist', async () => {
      (authContext.prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          authContext
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );

      expect(authContext.prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: validPostId },
        select: { userId: true, deleted: true },
      });
    });

    it('throws NOT_FOUND GraphQLError when post is deleted', async () => {
      (authContext.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        userId: otherUserId,
        deleted: true,
      });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          authContext
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when author attempts to report own post', async () => {
      (authContext.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        userId: validUserId,
        deleted: false,
      });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          authContext
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Cannot report your own post',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError on concurrency race if already reported', async () => {
      (authContext.prisma.post.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          userId: otherUserId,
          deleted: false,
        })
        .mockResolvedValueOnce({
          reportedBy: [validUserId],
        });

      (authContext.prisma.post.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          authContext
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'You have already reported this post',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );

      expect(authContext.prisma.post.updateMany).toHaveBeenCalledWith({
        where: { id: validPostId, NOT: { reportedBy: { has: validUserId } } },
        data: {
          reportedBy: { push: validUserId },
          reported: { increment: 1 },
        },
      });
    });

    it('throws NOT_FOUND GraphQLError when update matches nothing and post was deleted or missing on re-read', async () => {
      (authContext.prisma.post.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          userId: otherUserId,
          deleted: false,
        })
        .mockResolvedValueOnce(null);

      (authContext.prisma.post.updateMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        postsResolver.Mutation.reportPost(
          null,
          { postId: validPostId, userId: validUserId },
          authContext
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Post not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );
    });

    it('successfully reports post and returns updated post object with tagId', async () => {
      (authContext.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        userId: otherUserId,
        deleted: false,
      });

      (authContext.prisma.post.updateMany as jest.Mock).mockResolvedValue({ count: 1 });

      (authContext.prisma.post.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: validPostId,
        userId: otherUserId,
        tagId,
        title: 'Reported Post',
        text: 'Post content',
        reportedBy: [validUserId],
        reported: 1,
        votedBy: [],
        created: new Date(),
      });

      (authContext.prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: otherUserId, username: 'bob', name: 'Bob' },
      ]);

      const result = await postsResolver.Mutation.reportPost(
        null,
        { postId: validPostId, userId: validUserId },
        authContext
      );

      expect(authContext.prisma.post.updateMany).toHaveBeenCalledWith({
        where: { id: validPostId, NOT: { reportedBy: { has: validUserId } } },
        data: {
          reportedBy: { push: validUserId },
          reported: { increment: 1 },
        },
      });

      expect(result).toMatchObject({
        _id: validPostId,
        userId: otherUserId,
        tagId,
        reportedBy: [validUserId],
        reported: 1,
      });
    });
  });
});
