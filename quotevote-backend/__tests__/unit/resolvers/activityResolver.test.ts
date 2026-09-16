import { GraphQLError } from 'graphql';
import { activityResolver, normalizeActivityEvents } from '~/data/resolvers/activityResolver';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const actorId = '60d5ec49ad414d7a8d5464a0';
const profileId = '60d5ec49ad414d7a8d5464a1';
const mockActivityCount = jest.fn();
const mockActivityFindMany = jest.fn();
const mockUserFindUnique = jest.fn();
const mockPrisma = {
  activity: {
    count: mockActivityCount,
    findMany: mockActivityFindMany,
  },
  user: {
    findUnique: mockUserFindUnique,
  },
} as unknown as GraphQLContext['prisma'];

function mockContext(overrides: Partial<NonNullable<GraphQLContext['user']>> = {}): GraphQLContext {
  const user = {
    _id: actorId,
    username: 'alice',
    email: 'alice@example.com',
    admin: false,
    ...overrides,
  } as NonNullable<GraphQLContext['user']>;
  return {
    prisma: mockPrisma,
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: String(user._id),
    requestId: 'test-request-id',
  };
}

describe('normalizeActivityEvents', () => {
  it('accepts ActivityEventType arrays', () => {
    expect(normalizeActivityEvents(['VOTED', 'POSTED'])).toEqual(['VOTED', 'POSTED']);
  });

  it('parses legacy JSON array strings', () => {
    expect(normalizeActivityEvents('["COMMENTED"]')).toEqual(['COMMENTED']);
  });

  it('drops unknown event strings', () => {
    expect(normalizeActivityEvents(['VOTED', 'NOT_A_REAL_EVENT'] as string[])).toEqual(['VOTED']);
  });
});

describe('activityResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.activities', () => {
    it('requires authentication', async () => {
      await expect(
        activityResolver.Query.activities(
          null,
          {
            user_id: profileId,
            limit: 10,
            offset: 0,
            searchKey: '',
            activityEvent: ['VOTED'],
          },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('returns paginated activities for a user', async () => {
      const activityId = '60d5ec49ad414d7a8d5464a3';
      mockActivityCount.mockResolvedValue(1);
      mockActivityFindMany.mockResolvedValue([
        {
          id: activityId,
          userId: profileId,
          postId: '60d5ec49ad414d7a8d5464a4',
          activityType: 'VOTED',
          content: 'voted',
          voteId: null,
          commentId: null,
          quoteId: null,
          created: new Date('2024-01-01T00:00:00Z'),
        },
      ]);

      const result = await activityResolver.Query.activities(
        null,
        {
          user_id: profileId,
          limit: 15,
          offset: 0,
          searchKey: '',
          activityEvent: ['VOTED'],
        },
        mockContext()
      );

      expect(mockActivityCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: profileId,
          activityType: { in: ['VOTED'] },
        }),
      });
      expect(mockActivityFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: profileId,
          activityType: { in: ['VOTED'] },
        }),
        orderBy: { created: 'desc' },
        skip: 0,
        take: 15,
      });
      expect(result.pagination).toEqual({ total_count: 1, limit: 15, offset: 0 });
      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].activityType).toBe('VOTED');
      expect(result.entities[0]._id).toBe(activityId.toString());
      expect(result.entities[0].userId).toBe(profileId);
    });

    it('rejects activities missing userId', async () => {
      mockActivityCount.mockResolvedValue(1);
      mockActivityFindMany.mockResolvedValue([
        {
          id: '60d5ec49ad414d7a8d5464a5',
          userId: null,
          postId: null,
          activityType: 'VOTED',
          content: null,
          voteId: null,
          commentId: null,
          quoteId: null,
          created: new Date(),
        },
      ]);

      await expect(
        activityResolver.Query.activities(
          null,
          {
            user_id: profileId,
            limit: 10,
            offset: 0,
            searchKey: '',
            activityEvent: ['VOTED'],
          },
          mockContext()
        )
      ).rejects.toThrow(/missing required userId/);
    });

    it('falls back to following feed when user_id is omitted', async () => {
      const followingId = '60d5ec49ad414d7a8d5464a2';
      mockUserFindUnique.mockResolvedValue({ followingIds: [followingId] });
      mockActivityCount.mockResolvedValue(0);
      mockActivityFindMany.mockResolvedValue([]);

      await activityResolver.Query.activities(
        null,
        {
          user_id: '',
          limit: 10,
          offset: 0,
          searchKey: '',
          activityEvent: [],
        },
        mockContext()
      );

      expect(mockActivityCount).toHaveBeenCalledWith({
        where: expect.objectContaining({ userId: { in: [followingId] } }),
      });
    });

    it('passes text and date filters to Prisma', async () => {
      mockActivityCount.mockResolvedValue(0);
      mockActivityFindMany.mockResolvedValue([]);

      await activityResolver.Query.activities(
        null,
        {
          user_id: profileId,
          limit: 10,
          offset: 5,
          searchKey: 'Voted',
          startDateRange: '2026-09-01T00:00:00.000Z',
          endDateRange: '2026-09-02T00:00:00.000Z',
          activityEvent: [],
        },
        mockContext()
      );

      expect(mockActivityFindMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: profileId,
          content: { contains: 'Voted', mode: 'insensitive' },
          created: {
            gte: new Date('2026-09-01T00:00:00.000Z'),
            lte: new Date('2026-09-02T00:00:00.000Z'),
          },
        }),
        orderBy: { created: 'desc' },
        skip: 5,
        take: 10,
      });
    });
  });
});
