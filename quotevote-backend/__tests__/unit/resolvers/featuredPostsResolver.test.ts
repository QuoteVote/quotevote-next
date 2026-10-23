import { POST_RECORD_SELECT } from '~/data/utils/postPrismaMapper';
import { featuredPostsResolver } from '~/data/resolvers/featuredPostsResolver';
import type { GraphQLContext } from '~/types/graphql';

const userId = '507f1f77bcf86cd799439011';
const tagId = '507f1f77bcf86cd799439012';
const postId = '507f1f77bcf86cd799439013';

function mockContext(): GraphQLContext {
  return {
    prisma: {
      user: {
        findMany: jest.fn(),
      },
      vote: { findMany: jest.fn().mockResolvedValue([]) },
      comment: { findMany: jest.fn().mockResolvedValue([]) },
      quote: { findMany: jest.fn().mockResolvedValue([]) },
      messageRoom: { findMany: jest.fn().mockResolvedValue([]) },
      post: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as GraphQLContext['prisma'],
    user: null,
    userId: null,
    requestId: 'test-request-id',
  } as GraphQLContext;
}

describe('featuredPostsResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty entities when no featured posts exist', async () => {
    const ctx = mockContext();
    (ctx.prisma.post.count as jest.Mock).mockResolvedValue(0);
    (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([]);

    const result = await featuredPostsResolver.Query.featuredPosts(null, {}, ctx);

    expect(result.entities).toEqual([]);
    expect(result.pagination).toEqual({ total_count: 0, limit: 10, offset: 0 });
    expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('loads featured posts ordered by featuredSlot and hydrates creators', async () => {
    const ctx = mockContext();
    (ctx.prisma.post.count as jest.Mock).mockResolvedValue(1);
    (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([
      {
        id: postId,
        userId,
        tagId,
        title: 'Featured',
        text: 'Body',
        featuredSlot: 1,
        votedBy: ['voter-1'],
        created: new Date(),
      },
    ]);
    (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
      { id: userId, username: 'alice', name: 'Alice' },
    ]);

    const result = await featuredPostsResolver.Query.featuredPosts(
      null,
      { limit: 5, offset: 0 },
      ctx
    );

    expect(ctx.prisma.post.findMany).toHaveBeenCalledWith({
      where: { featuredSlot: { not: null }, deleted: { not: true } },
      orderBy: { featuredSlot: 'asc' },
      skip: 0,
      take: 5,
      select: POST_RECORD_SELECT,
    });
    expect(result.entities[0]).toMatchObject({
      _id: postId,
      userId,
      tagId,
      votedBy: ['voter-1'],
      creator: { _id: userId, username: 'alice' },
    });
  });
});
