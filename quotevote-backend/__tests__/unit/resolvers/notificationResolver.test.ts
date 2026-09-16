import { notificationResolver } from '~/data/resolvers/notificationResolver';
import type { GraphQLContext } from '~/types/graphql';

const userId = '60d5ec49ad414d7a8d5464a0';
const mockFindMany = jest.fn();
const mockPrisma = {
  notification: { findMany: mockFindMany },
} as unknown as GraphQLContext['prisma'];

function mockContext(user: GraphQLContext['user'] = null): GraphQLContext {
  return {
    prisma: mockPrisma,
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

describe('notificationResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.notifications', () => {
    it('requires authentication', async () => {
      await expect(
        notificationResolver.Query.notifications(null, {}, mockContext(null))
      ).rejects.toThrow(/Authentication required/);
    });

    it('returns an empty list when the user has no notifications', async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await notificationResolver.Query.notifications(
        null,
        {},
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { userId, status: 'new' },
        orderBy: { created: 'desc' },
        take: 50,
      });
      expect(result).toEqual([]);
    });

    it('clamps limit to a maximum of 100', async () => {
      mockFindMany.mockResolvedValue([]);

      await notificationResolver.Query.notifications(
        null,
        { limit: 500 },
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(mockFindMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it('maps the Prisma id to the GraphQL _id field', async () => {
      const created = new Date('2026-09-16T12:00:00Z');
      mockFindMany.mockResolvedValue([
        {
          id: '60d5ec49ad414d7a8d5464a9',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a8',
          label: 'New vote',
          status: 'new',
          notificationType: 'UPVOTED',
          postId: null,
          created,
          createdAt: created,
          updatedAt: created,
        },
      ]);

      const result = await notificationResolver.Query.notifications(
        null,
        {},
        mockContext({
          _id: userId,
          username: 'alice',
          email: 'alice@example.com',
        } as NonNullable<GraphQLContext['user']>)
      );

      expect(result).toEqual([
        expect.objectContaining({
          _id: '60d5ec49ad414d7a8d5464a9',
          postId: undefined,
        }),
      ]);
    });
  });
});
