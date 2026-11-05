import {
  MAX_TAG_DESCRIPTION_LENGTH,
  MAX_TAG_TITLE_LENGTH,
  tagResolver,
} from '~/data/resolvers/tagResolver';
import { TAG_RECORD_SELECT } from '~/data/utils/tagPrismaMapper';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/utils/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(undefined),
}));

const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>;

const tagId = '507f1f77bcf86cd799439011';
const creatorId = '507f1f77bcf86cd799439012';
const adminId = '507f1f77bcf86cd799439013';

function mockContext(userId: string | null = null): GraphQLContext {
  return {
    prisma: {
      tag: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    } as unknown as GraphQLContext['prisma'],
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: userId ? ({ _id: userId } as GraphQLContext['user']) : null,
    userId,
    requestId: 'test-request-id',
  };
}

const validTagInput = {
  creatorId,
  title: 'Technology',
  description: 'Tech discussion',
  privacy: 'public' as const,
};

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
        updatedAt: undefined,
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

  describe('Mutation.createTag', () => {
    it('requires authentication', async () => {
      const ctx = mockContext();

      await expect(
        tagResolver.Mutation.createTag(null, { tag: validTagInput }, ctx)
      ).rejects.toThrow(/Authentication required/);
      expect(ctx.prisma.tag.create).not.toHaveBeenCalled();
    });

    it('rejects empty title and description', async () => {
      const ctx = mockContext(creatorId);

      await expect(
        tagResolver.Mutation.createTag(null, { tag: { ...validTagInput, title: '   ' } }, ctx)
      ).rejects.toThrow(/Tag title is required/);
      await expect(
        tagResolver.Mutation.createTag(null, { tag: { ...validTagInput, description: '' } }, ctx)
      ).rejects.toThrow(/Tag description is required/);
    });

    it('rejects invalid privacy', async () => {
      const ctx = mockContext(creatorId);

      await expect(
        tagResolver.Mutation.createTag(
          null,
          { tag: { ...validTagInput, privacy: 'secret' as 'public' } },
          ctx
        )
      ).rejects.toThrow(/Invalid tag privacy/);
    });

    it('rejects creating a tag as another user', async () => {
      const ctx = mockContext(creatorId);

      await expect(
        tagResolver.Mutation.createTag(null, { tag: { ...validTagInput, creatorId: adminId } }, ctx)
      ).rejects.toThrow(/Not authorized to create a tag as another user/);
      expect(ctx.prisma.tag.create).not.toHaveBeenCalled();
    });

    it('rejects titles and descriptions that exceed the length caps', async () => {
      const ctx = mockContext(creatorId);

      await expect(
        tagResolver.Mutation.createTag(
          null,
          { tag: { ...validTagInput, title: 'a'.repeat(MAX_TAG_TITLE_LENGTH + 1) } },
          ctx
        )
      ).rejects.toThrow(new RegExp(`at most ${MAX_TAG_TITLE_LENGTH}`));
      await expect(
        tagResolver.Mutation.createTag(
          null,
          {
            tag: {
              ...validTagInput,
              description: 'a'.repeat(MAX_TAG_DESCRIPTION_LENGTH + 1),
            },
          },
          ctx
        )
      ).rejects.toThrow(new RegExp(`at most ${MAX_TAG_DESCRIPTION_LENGTH}`));
      expect(ctx.prisma.tag.create).not.toHaveBeenCalled();
    });

    it('rejects duplicate titles', async () => {
      const ctx = mockContext(creatorId);
      (ctx.prisma.tag.findFirst as jest.Mock).mockResolvedValue({ id: tagId });

      await expect(
        tagResolver.Mutation.createTag(null, { tag: validTagInput }, ctx)
      ).rejects.toThrow(/Tag name already exist/);
      expect(ctx.prisma.tag.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ title: 'Technology' }, { url: '/technology' }] },
        select: { id: true },
      });
      expect(mockCheckRateLimit).not.toHaveBeenCalled();
      expect(ctx.prisma.tag.create).not.toHaveBeenCalled();
    });

    it('refuses when the rate limit is exceeded without creating', async () => {
      const ctx = mockContext(creatorId);
      (ctx.prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);
      mockCheckRateLimit.mockRejectedValueOnce(new Error('rate limited'));

      await expect(
        tagResolver.Mutation.createTag(null, { tag: validTagInput }, ctx)
      ).rejects.toThrow(/Too many tags/);
      expect(mockCheckRateLimit).toHaveBeenCalled();
      expect(ctx.prisma.tag.create).not.toHaveBeenCalled();
    });

    it('rejects titles that collide on the derived URL (case/spacing)', async () => {
      const ctx = mockContext(creatorId);
      (ctx.prisma.tag.findFirst as jest.Mock).mockResolvedValue({ id: tagId });

      await expect(
        tagResolver.Mutation.createTag(
          null,
          { tag: { ...validTagInput, title: 'Review 666 Tag' } },
          ctx
        )
      ).rejects.toThrow(/Tag name already exist/);
      expect(ctx.prisma.tag.findFirst).toHaveBeenCalledWith({
        where: { OR: [{ title: 'Review 666 Tag' }, { url: '/review-666-tag' }] },
        select: { id: true },
      });
      expect(ctx.prisma.tag.create).not.toHaveBeenCalled();
    });

    it('creates a tag with creator as admin/member and a title-derived url', async () => {
      const ctx = mockContext(creatorId);
      const createdAt = new Date('2026-02-01T00:00:00Z');
      (ctx.prisma.tag.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.tag.create as jest.Mock).mockResolvedValue({
        id: tagId,
        creatorId,
        adminIds: [creatorId],
        allowedUserIds: [creatorId],
        privacy: 'public',
        title: 'Technology',
        url: '/technology',
        description: 'Tech discussion',
        created: createdAt,
      });

      const result = await tagResolver.Mutation.createTag(null, { tag: validTagInput }, ctx);

      expect(ctx.prisma.tag.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          creatorId,
          title: 'Technology',
          description: 'Tech discussion',
          privacy: 'public',
          adminIds: [creatorId],
          allowedUserIds: [creatorId],
          url: '/technology',
        }),
        select: TAG_RECORD_SELECT,
      });
      expect(result).toEqual({
        _id: tagId,
        creatorId,
        adminIds: [creatorId],
        allowedUserIds: [creatorId],
        privacy: 'public',
        title: 'Technology',
        url: '/technology',
        description: 'Tech discussion',
        created: createdAt,
        updatedAt: undefined,
      });
    });
  });
});
