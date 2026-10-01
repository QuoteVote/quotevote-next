import { tagResolver } from '~/data/resolvers/tagResolver';
import { TAG_RECORD_SELECT } from '~/data/utils/tagPrismaMapper';
import type { GraphQLContext } from '~/types/graphql';

const tagId = '507f1f77bcf86cd799439011';
const creatorId = '507f1f77bcf86cd799439012';
const adminId = '507f1f77bcf86cd799439013';

function mockContext(): GraphQLContext {
  return {
    prisma: {
      tag: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    } as unknown as GraphQLContext['prisma'],
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: null,
    userId: null,
    requestId: 'test-request-id',
  };
}

describe('tagResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.tag', () => {
    it('returns null when tagId is an invalid ObjectId without querying Prisma', async () => {
      const ctx = mockContext();

      const result = await tagResolver.Query.tag(null, { tagId: 'invalid-id' }, ctx);

      expect(result).toBeNull();
      expect(ctx.prisma.tag.findUnique).not.toHaveBeenCalled();
    });

    it('returns null when tagId is empty string', async () => {
      const ctx = mockContext();

      const result = await tagResolver.Query.tag(null, { tagId: '' }, ctx);

      expect(result).toBeNull();
      expect(ctx.prisma.tag.findUnique).not.toHaveBeenCalled();
    });

    it('queries tag by id via Prisma using TAG_RECORD_SELECT', async () => {
      const ctx = mockContext();
      const mockRecord = {
        id: tagId,
        creatorId,
        adminIds: [adminId],
        allowedUserIds: [],
        privacy: 'public' as const,
        title: 'Technology',
        url: 'https://example.com/tech',
        description: 'Tech discussion group',
        created: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-02T00:00:00Z'),
      };
      (ctx.prisma.tag.findUnique as jest.Mock).mockResolvedValue(mockRecord);

      const result = await tagResolver.Query.tag(null, { tagId }, ctx);

      expect(ctx.prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: tagId },
        select: TAG_RECORD_SELECT,
      });
      expect(result).toEqual({
        _id: tagId,
        creatorId,
        adminIds: [adminId],
        allowedUserIds: [],
        privacy: 'public',
        title: 'Technology',
        url: 'https://example.com/tech',
        description: 'Tech discussion group',
        created: mockRecord.created,
        updatedAt: mockRecord.updatedAt,
      });
    });

    it('returns null when tag is not found in database', async () => {
      const ctx = mockContext();
      (ctx.prisma.tag.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await tagResolver.Query.tag(null, { tagId }, ctx);

      expect(result).toBeNull();
      expect(ctx.prisma.tag.findUnique).toHaveBeenCalledWith({
        where: { id: tagId },
        select: TAG_RECORD_SELECT,
      });
    });
  });

  describe('Query.tags', () => {
    it('queries tags without filters when called with empty args', async () => {
      const ctx = mockContext();
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      const result = await tagResolver.Query.tags(null, {}, ctx);

      expect(ctx.prisma.tag.findMany).toHaveBeenCalledWith({
        select: TAG_RECORD_SELECT,
      });
      expect(result).toEqual([]);
    });

    it('applies take limit when positive limit argument is provided', async () => {
      const ctx = mockContext();
      const mockRecord = {
        id: tagId,
        creatorId,
        adminIds: [],
        allowedUserIds: [],
        privacy: 'public' as const,
        title: 'Science',
        url: null,
        description: null,
        created: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      };
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([mockRecord]);

      const result = await tagResolver.Query.tags(null, { limit: 10 }, ctx);

      expect(ctx.prisma.tag.findMany).toHaveBeenCalledWith({
        take: 10,
        select: TAG_RECORD_SELECT,
      });
      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe(tagId);
      expect(result[0].title).toBe('Science');
      expect(result[0].url).toBeUndefined();
      expect(result[0].description).toBeUndefined();
    });

    it('applies take: 0 when limit is 0', async () => {
      const ctx = mockContext();
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      const result = await tagResolver.Query.tags(null, { limit: 0 }, ctx);

      expect(ctx.prisma.tag.findMany).toHaveBeenCalledWith({
        take: 0,
        select: TAG_RECORD_SELECT,
      });
      expect(result).toEqual([]);
    });

    it('applies title filter when title argument is provided', async () => {
      const ctx = mockContext();
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      await tagResolver.Query.tags(null, { title: 'Politics', limit: 5 }, ctx);

      expect(ctx.prisma.tag.findMany).toHaveBeenCalledWith({
        where: { title: 'Politics' },
        take: 5,
        select: TAG_RECORD_SELECT,
      });
    });

    it('applies created date filter when valid date string is provided', async () => {
      const ctx = mockContext();
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      const dateStr = '2026-01-01T00:00:00.000Z';
      await tagResolver.Query.tags(null, { created: dateStr }, ctx);

      expect(ctx.prisma.tag.findMany).toHaveBeenCalledWith({
        where: { created: new Date(dateStr) },
        select: TAG_RECORD_SELECT,
      });
    });

    it('ignores created filter when invalid date string is provided', async () => {
      const ctx = mockContext();
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([]);

      await tagResolver.Query.tags(null, { created: 'not-a-valid-date' }, ctx);

      expect(ctx.prisma.tag.findMany).toHaveBeenCalledWith({
        select: TAG_RECORD_SELECT,
      });
    });

    it('accounts for legacy document shapes when mapping returned tags', async () => {
      const ctx = mockContext();
      const legacyRecord = {
        id: tagId,
        creatorId,
        adminIds: null,
        allowedUserIds: null,
        privacy: null,
        title: 'Legacy',
        url: null,
        description: null,
        created: new Date('2026-01-01T00:00:00Z'),
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: null,
      };
      (ctx.prisma.tag.findMany as jest.Mock).mockResolvedValue([legacyRecord]);

      const result = await tagResolver.Query.tags(null, { limit: 1 }, ctx);

      expect(result[0]).toEqual({
        _id: tagId,
        creatorId,
        adminIds: [],
        allowedUserIds: [],
        privacy: 'public',
        title: 'Legacy',
        url: undefined,
        description: undefined,
        created: legacyRecord.created,
        updatedAt: undefined,
      });
    });
  });
});
