import { quoteResolver } from '~/data/resolvers/quoteResolver';
import { toQuote } from '~/data/resolvers/utils/commentsQuotes';
import type { GraphQLContext } from '~/types/graphql';

const date = new Date('2026-01-01T00:00:00.000Z');
const userId = '60d5ec49ad414d7a8d5464a0';
const postOwnerId = '60d5ec49ad414d7a8d546499';
const postId = '60d5ec49ad414d7a8d5464c2';
const quoteId = '60d5ec49ad414d7a8d5464b1';

const QUOTE_SELECT = {
  id: true,
  userId: true,
  quoted: true,
  postId: true,
  quote: true,
  startWordIndex: true,
  endWordIndex: true,
  deleted: true,
  created: true,
};

function mockContext(user: GraphQLContext['user'] = null) {
  return {
    prisma: {
      quote: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      post: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      activity: {
        create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      },
    },
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedUser(admin = false): NonNullable<GraphQLContext['user']> {
  return {
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
    admin,
  } as NonNullable<GraphQLContext['user']>;
}

describe('quoteResolver', () => {
  it('returns the newest non-deleted quotes through Prisma', async () => {
    const context = mockContext();
    context.prisma.quote.findMany.mockResolvedValue([
      {
        id: quoteId,
        userId,
        quoted: postOwnerId,
        postId,
        quote: 'A thoughtful line',
        startWordIndex: 1,
        endWordIndex: 3,
        deleted: false,
        created: date,
      },
    ]);

    const result = await quoteResolver.Query.latestQuotes({}, { limit: 5 }, context as never);

    expect(context.prisma.quote.findMany).toHaveBeenCalledWith({
      where: { deleted: { not: true } },
      orderBy: { created: 'desc' },
      take: 5,
      select: QUOTE_SELECT,
    });
    expect(result).toEqual([
      {
        _id: quoteId,
        userId,
        quoted: postOwnerId,
        postId,
        quote: 'A thoughtful line',
        startWordIndex: 1,
        endWordIndex: 3,
        deleted: false,
        created: date,
      },
    ]);
  });

  it('caps latestQuotes at 100 and falls back for non-positive limits', async () => {
    const context = mockContext();
    context.prisma.quote.findMany.mockResolvedValue([]);

    await quoteResolver.Query.latestQuotes({}, { limit: 500 }, context as never);
    expect(context.prisma.quote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    );

    await quoteResolver.Query.latestQuotes({}, { limit: 0 }, context as never);
    expect(context.prisma.quote.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ take: 100 })
    );
  });

  describe('Mutation.addQuote', () => {
    it('requires authentication', async () => {
      await expect(
        quoteResolver.Mutation.addQuote(
          null,
          {
            quote: {
              postId,
              quoter: userId,
              quoted: postOwnerId,
              quote: 'line',
              startWordIndex: 0,
              endWordIndex: 1,
            },
          },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('creates a quote with quoted set to the post author', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        userId: postOwnerId,
        deleted: false,
        pointTimestamp: date,
        dayPoints: 1,
      });
      context.prisma.quote.create.mockResolvedValue({
        id: quoteId,
        userId,
        quoted: postOwnerId,
        postId,
        quote: 'line',
        startWordIndex: 0,
        endWordIndex: 1,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});

      const result = await quoteResolver.Mutation.addQuote(
        null,
        {
          quote: {
            postId,
            quoter: 'ignored-client-id',
            quoted: 'ignored-client-quoted',
            quote: 'line',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(context.prisma.quote.create).toHaveBeenCalledWith({
        data: {
          userId,
          quoted: postOwnerId,
          postId,
          quote: 'line',
          startWordIndex: 0,
          endWordIndex: 1,
          created: expect.any(Date),
        },
        select: QUOTE_SELECT,
      });
      expect(context.prisma.activity.create).toHaveBeenCalled();
      expect(result._id).toBe(quoteId);
      expect(result.userId).toBe(userId);
      expect(result.quoted).toBe(postOwnerId);
    });
  });

  describe('Mutation.deleteQuote', () => {
    it('soft-deletes when the owner requests it', async () => {
      const context = mockContext(authedUser());
      context.prisma.quote.findUnique.mockResolvedValue({
        id: quoteId,
        userId,
        deleted: false,
      });
      context.prisma.quote.update.mockResolvedValue({ id: quoteId });

      const result = await quoteResolver.Mutation.deleteQuote(null, { quoteId }, context as never);

      expect(context.prisma.quote.update).toHaveBeenCalledWith({
        where: { id: quoteId },
        data: { deleted: true },
        select: { id: true },
      });
      expect(result).toEqual({ _id: quoteId });
    });

    it('forbids deleting another users quote', async () => {
      const context = mockContext(authedUser());
      context.prisma.quote.findUnique.mockResolvedValue({
        id: quoteId,
        userId: postOwnerId,
        deleted: false,
      });

      await expect(
        quoteResolver.Mutation.deleteQuote(null, { quoteId }, context as never)
      ).rejects.toThrow(/Not authorized/);
    });
  });

  describe('legacy-shaped documents', () => {
    it('maps a quote whose author lived in quoter (Prisma userId) without quoted', () => {
      const mapped = toQuote({
        id: quoteId,
        userId,
        quoted: null,
        postId,
        quote: 'legacy excerpt',
        startWordIndex: null,
        endWordIndex: null,
        deleted: false,
        created: date,
      });

      expect(mapped).toEqual({
        _id: quoteId,
        userId,
        quoted: undefined,
        postId,
        quote: 'legacy excerpt',
        startWordIndex: undefined,
        endWordIndex: undefined,
        deleted: false,
        created: date,
      });
    });
  });
});
