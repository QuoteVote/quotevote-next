import { quoteResolver } from '~/data/resolvers/quoteResolver';
import { toQuote } from '~/data/resolvers/utils/commentsQuotes';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';
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
        findRaw: jest.fn(),
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
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
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
  const quoteRow = (id: string, author = userId) => ({
    id,
    userId: author,
    quoted: postOwnerId,
    postId,
    quote: 'A thoughtful line',
    startWordIndex: 1,
    endWordIndex: 3,
    deleted: false,
    created: date,
  });

  it('picks the newest quotes not marked deleted, keeping rows without the field', async () => {
    const context = mockContext();
    context.prisma.quote.findRaw.mockResolvedValue([{ _id: { $oid: quoteId } }]);
    context.prisma.quote.findMany.mockResolvedValue([quoteRow(quoteId)]);

    const result = await quoteResolver.Query.latestQuotes({}, { limit: 5 }, context as never);

    expect(context.prisma.quote.findRaw).toHaveBeenCalledWith({
      filter: { deleted: { $ne: true } },
      options: { sort: { created: -1 }, limit: 5, projection: { _id: 1 } },
    });
    expect(context.prisma.quote.findMany).toHaveBeenCalledWith({
      where: { id: { in: [quoteId] } },
      select: QUOTE_SELECT,
    });
    expect(result).toEqual([{ ...toQuote(quoteRow(quoteId)), user: expect.any(Object) }]);
  });

  it('keeps the newest-first order and loads every author in one query', async () => {
    const context = mockContext();
    const olderId = '60d5ec49ad414d7a8d5464b2';
    context.prisma.quote.findRaw.mockResolvedValue([
      { _id: { $oid: quoteId } },
      { _id: { $oid: olderId } },
    ]);
    context.prisma.quote.findMany.mockResolvedValue([
      quoteRow(olderId, postOwnerId),
      quoteRow(quoteId),
    ]);
    context.prisma.user.findMany.mockResolvedValue([
      { id: userId, username: 'alice', name: 'Alice' },
      { id: postOwnerId, username: 'bob', name: 'Bob' },
    ]);

    const result = await quoteResolver.Query.latestQuotes({}, { limit: 5 }, context as never);

    expect(result.map((q) => q._id)).toEqual([quoteId, olderId]);
    expect(result.map((q) => q.user?.username)).toEqual(['alice', 'bob']);
    expect(context.prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(context.prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [userId, postOwnerId] } },
      select: PUBLIC_USER_SELECT,
    });
  });

  it('skips the row and author reads when there are no quotes', async () => {
    const context = mockContext();
    context.prisma.quote.findRaw.mockResolvedValue([]);

    const result = await quoteResolver.Query.latestQuotes({}, { limit: 5 }, context as never);

    expect(result).toEqual([]);
    expect(context.prisma.quote.findMany).not.toHaveBeenCalled();
    expect(context.prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('caps latestQuotes at 100 and falls back for non-positive limits', async () => {
    const context = mockContext();
    context.prisma.quote.findRaw.mockResolvedValue([]);

    await quoteResolver.Query.latestQuotes({}, { limit: 500 }, context as never);
    expect(context.prisma.quote.findRaw).toHaveBeenCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ limit: 100 }) })
    );

    await quoteResolver.Query.latestQuotes({}, { limit: 0 }, context as never);
    expect(context.prisma.quote.findRaw).toHaveBeenLastCalledWith(
      expect.objectContaining({ options: expect.objectContaining({ limit: 100 }) })
    );
  });

  describe('Quote.user', () => {
    it('returns an author that was already loaded without a query', async () => {
      const context = mockContext();
      const user = { _id: userId, username: 'alice' };

      const result = await quoteResolver.Quote.user(
        { ...toQuote(quoteRow(quoteId)), user } as never,
        {},
        context as never
      );

      expect(result).toBe(user);
      expect(context.prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('loads the author with public fields when the parent has none', async () => {
      const context = mockContext();
      context.prisma.user.findUnique.mockResolvedValue({ id: userId, username: 'alice' });

      const result = await quoteResolver.Quote.user(
        toQuote(quoteRow(quoteId)) as never,
        {},
        context as never
      );

      expect(context.prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: PUBLIC_USER_SELECT,
      });
      expect(result).toMatchObject({ _id: userId, username: 'alice' });
    });
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
