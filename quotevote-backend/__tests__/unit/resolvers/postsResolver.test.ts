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
        findMany: jest.fn().mockResolvedValue([]),
      },
      tag: {
        findUnique: jest.fn(),
      },
      vote: { findMany: jest.fn().mockResolvedValue([]) },
      comment: { findMany: jest.fn().mockResolvedValue([]) },
      quote: { findMany: jest.fn().mockResolvedValue([]) },
      activity: {
        create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      },
      messageRoom: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'room-1' }),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      post: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    } as unknown as GraphQLContext['prisma'],
    user,
    userId: user?._id?.toString() ?? null,
    requestId: 'test-request-id',
  } as GraphQLContext;
}

function stubReturnedPost(
  ctx: GraphQLContext,
  overrides: Record<string, unknown> = {}
): void {
  const record = {
    id: postId,
    userId,
    tagId,
    title: 'Hello World',
    text: 'Body',
    url: `/post/tag/hello-world/${postId}`,
    citationUrl: null,
    attribution: null,
    upvotes: 0,
    downvotes: 0,
    reported: 0,
    approved: null,
    votedBy: [],
    dayPoints: 0,
    pointTimestamp: new Date(),
    approvedBy: [],
    rejectedBy: [],
    reportedBy: [],
    bookmarkedBy: [],
    enableVoting: false,
    messageRoomId: null,
    urlId: null,
    featuredSlot: null,
    deleted: false,
    created: new Date(),
    ...overrides,
  };
  (ctx.prisma.post.findUniqueOrThrow as jest.Mock).mockResolvedValue(record);
  (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
    { id: userId, username: 'alice', name: 'Alice' },
  ]);
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

    describe('friendsOnly', () => {
      const followedId = '507f1f77bcf86cd799439099';

      it('restricts results to posts from followed users', async () => {
        const ctx = mockContext({ _id: userId, _followingId: [followedId] } as unknown as GraphQLContext['user']);
        (ctx.prisma.post.count as jest.Mock).mockResolvedValue(0);
        (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([]);

        await postsResolver.Query.posts(null, { friendsOnly: true }, ctx);

        const where = (ctx.prisma.post.findMany as jest.Mock).mock.calls[0][0].where;
        expect(where.AND).toContainEqual({ userId: { in: [followedId] } });
      });

      it('returns an empty page without querying when the viewer follows nobody', async () => {
        const ctx = mockContext({ _id: userId, _followingId: [] } as unknown as GraphQLContext['user']);

        const result = await postsResolver.Query.posts(null, { friendsOnly: true }, ctx);

        expect(result.entities).toEqual([]);
        expect(result.pagination.total_count).toBe(0);
        expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
      });

      it('returns an empty page without querying for a signed-out caller', async () => {
        const ctx = mockContext();

        const result = await postsResolver.Query.posts(null, { friendsOnly: true }, ctx);

        expect(result.entities).toEqual([]);
        expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
      });
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

  describe('Mutation.deletePost', () => {
    it('soft-deletes when the owner requests it', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: postId,
        userId,
        deleted: false,
      });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });

      const result = await postsResolver.Mutation.deletePost(null, { postId }, ctx);

      expect(ctx.prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { deleted: true },
        select: { id: true },
      });
      expect(result).toEqual({ _id: postId });
    });

    it('forbids deleting another users post', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: postId,
        userId: '60d5ec49ad414d7a8d546499',
        deleted: false,
      });

      await expect(postsResolver.Mutation.deletePost(null, { postId }, ctx)).rejects.toThrow(
        /Not authorized to delete/
      );
    });
  });

  describe('Mutation.toggleVoting', () => {
    it('flips enableVoting for the owner', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        userId,
        deleted: false,
        enableVoting: false,
      });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { enableVoting: true });

      const result = await postsResolver.Mutation.toggleVoting(null, { postId }, ctx);

      expect(ctx.prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { enableVoting: true },
        select: { id: true },
      });
      expect(result.enable_voting).toBe(true);
    });

    it('forbids non-owners from toggling voting', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        userId: '60d5ec49ad414d7a8d546499',
        deleted: false,
        enableVoting: false,
      });

      await expect(postsResolver.Mutation.toggleVoting(null, { postId }, ctx)).rejects.toThrow(
        /Not authorized to toggle voting/
      );
    });
  });

  describe('Mutation.updatePostBookmark', () => {
    it('adds a bookmark and updates trending', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          deleted: false,
          bookmarkedBy: [],
          dayPoints: 0,
        })
        .mockResolvedValueOnce({
          pointTimestamp: new Date(),
          dayPoints: 0,
        });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { bookmarkedBy: [userId], dayPoints: 1 });

      const result = await postsResolver.Mutation.updatePostBookmark(
        null,
        { postId, userId },
        ctx
      );

      expect(ctx.prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { bookmarkedBy: [userId] },
        })
      );
      expect(result.bookmarkedBy).toEqual([userId]);
    });

    it('removes a bookmark and decrements dayPoints', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        deleted: false,
        bookmarkedBy: [userId],
        dayPoints: 2,
      });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { bookmarkedBy: [], dayPoints: 1 });

      await postsResolver.Mutation.updatePostBookmark(null, { postId, userId }, ctx);

      expect(ctx.prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { bookmarkedBy: [], dayPoints: 1 },
        select: { id: true },
      });
    });
  });

  describe('Mutation.approvePost / rejectPost', () => {
    it('approves and clears the user from rejectedBy', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        deleted: false,
        approvedBy: [],
        rejectedBy: [userId],
      });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { approvedBy: [userId], rejectedBy: [] });

      const result = await postsResolver.Mutation.approvePost(
        null,
        { postId, userId, remove: false },
        ctx
      );

      expect(ctx.prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { approvedBy: [userId], rejectedBy: [] },
        select: { id: true },
      });
      expect(result.approvedBy).toEqual([userId]);
    });

    it('rejects and clears the user from approvedBy', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        deleted: false,
        approvedBy: [userId],
        rejectedBy: [],
      });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { approvedBy: [], rejectedBy: [userId] });

      await postsResolver.Mutation.rejectPost(null, { postId, userId, remove: false }, ctx);

      expect(ctx.prisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { rejectedBy: [userId], approvedBy: [] },
        select: { id: true },
      });
    });
  });

  describe('Mutation.updateFeaturedSlot', () => {
    it('requires admin', async () => {
      const ctx = mockContext({ _id: userId, admin: false } as NonNullable<GraphQLContext['user']>);

      await expect(
        postsResolver.Mutation.updateFeaturedSlot(null, { postId, featuredSlot: 1 }, ctx)
      ).rejects.toThrow(/Admin access required/);
    });

    it('clears the slot on other posts then assigns it', async () => {
      const ctx = mockContext({ _id: userId, admin: true } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({ deleted: false });
      (ctx.prisma.post.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { featuredSlot: 3 });

      const result = await postsResolver.Mutation.updateFeaturedSlot(
        null,
        { postId, featuredSlot: 3 },
        ctx
      );

      expect(ctx.prisma.post.updateMany).toHaveBeenCalledWith({
        where: { featuredSlot: 3 },
        data: { featuredSlot: null },
      });
      expect(result.featuredSlot).toBe(3);
    });
  });

  describe('Mutation.addPost', () => {
    it('creates a post with URL, room, and activity', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);
      (ctx.prisma.tag.findUnique as jest.Mock).mockResolvedValue({
        id: tagId,
        creatorId: userId,
        title: 'General',
        url: '/general',
        adminIds: [],
        allowedUserIds: [],
        privacy: 'public',
        created: new Date(),
      });
      (ctx.prisma.post.create as jest.Mock).mockResolvedValue({ id: postId });
      (ctx.prisma.post.update as jest.Mock).mockResolvedValue({ id: postId });
      stubReturnedPost(ctx, { url: `/post/general/hello-world/${postId}` });

      const result = await postsResolver.Mutation.addPost(
        null,
        {
          post: {
            userId,
            groupId: tagId,
            title: 'Hello World',
            text: 'Body text',
          },
        },
        ctx
      );

      expect(ctx.prisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            tagId,
            title: 'Hello World',
            text: 'Body text',
          }),
        })
      );
      expect(ctx.prisma.messageRoom.create).toHaveBeenCalled();
      expect(ctx.prisma.activity.create).toHaveBeenCalled();
      expect(ctx.prisma.post.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: `/post/general/hello-world/${postId}`,
            messageRoomId: 'room-1',
          }),
        })
      );
      expect(result._id).toBe(postId);
      expect(result.url).toBe(`/post/general/hello-world/${postId}`);
    });

    it('rejects creating a post as another user', async () => {
      const ctx = mockContext({ _id: userId } as NonNullable<GraphQLContext['user']>);

      await expect(
        postsResolver.Mutation.addPost(
          null,
          {
            post: {
              userId: '60d5ec49ad414d7a8d546499',
              groupId: tagId,
              title: 'Hello',
              text: 'Body',
            },
          },
          ctx
        )
      ).rejects.toThrow(/Not authorized to create a post as another user/);
    });
  });
});
