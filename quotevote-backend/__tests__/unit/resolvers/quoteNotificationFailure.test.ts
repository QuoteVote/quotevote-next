// #732: once a quote is saved, a failed author notification must not fail addQuote.
// Uses the real addNotification so both stages (saving, then publishing) are exercised.
jest.mock('~/data/utils/pubsub', () => ({
  pubsub: { publish: jest.fn().mockResolvedValue(undefined) },
}));

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import { quoteResolver } from '~/data/resolvers/quoteResolver';
import { pubsub } from '~/data/utils/pubsub';
import { logger } from '~/data/utils/logger';
import type { GraphQLContext } from '~/types/graphql';

const date = new Date('2026-01-01T00:00:00.000Z');
const userId = '60d5ec49ad414d7a8d5464a0';
const postOwnerId = '60d5ec49ad414d7a8d546499';
const postId = '60d5ec49ad414d7a8d5464c2';
const quoteId = '60d5ec49ad414d7a8d5464b1';
const QUOTE_TEXT = 'A private line from the post';

const publish = pubsub.publish as jest.Mock;
const warn = logger.warn as jest.Mock;

function mockContext(owner = postOwnerId) {
  return {
    prisma: {
      quote: {
        create: jest.fn().mockResolvedValue({
          id: quoteId,
          userId,
          quoted: owner,
          postId,
          quote: QUOTE_TEXT,
          startWordIndex: 0,
          endWordIndex: 4,
          deleted: false,
          created: date,
        }),
      },
      post: {
        findUnique: jest.fn().mockResolvedValue({
          id: postId,
          title: 'Hello',
          userId: owner,
          deleted: false,
          pointTimestamp: date,
          dayPoints: 1,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      activity: { create: jest.fn().mockResolvedValue({ id: 'activity-1' }) },
      notification: {
        create: jest.fn().mockResolvedValue({
          id: 'notification-1',
          userId: owner,
          userIdBy: userId,
          postId,
          notificationType: 'QUOTED',
          label: QUOTE_TEXT,
          status: 'new',
          created: date,
        }),
      },
    },
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user: { _id: userId, username: 'alice', admin: false } as NonNullable<GraphQLContext['user']>,
    userId,
    requestId: 'test-request-id',
  };
}

const addQuote = (context: ReturnType<typeof mockContext>) =>
  quoteResolver.Mutation.addQuote(
    null,
    { quote: { postId, quote: QUOTE_TEXT, startWordIndex: 0, endWordIndex: 4 } } as never,
    context as never
  );

describe('addQuote when the author notification fails (#732)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('still returns the saved quote when saving the notification fails', async () => {
    const context = mockContext();
    context.prisma.notification.create.mockRejectedValue(new Error('write conflict'));

    const result = await addQuote(context);

    expect(result._id).toBe(quoteId);
    expect(context.prisma.quote.create).toHaveBeenCalledTimes(1);
    expect(publish).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith('addQuote: failed to notify the post author', {
      postId,
      quoteId,
      userId,
      error: 'write conflict',
    });
  });

  it('still returns the saved quote when publishing the notification fails', async () => {
    const context = mockContext();
    publish.mockRejectedValueOnce(new Error('pubsub down'));

    const result = await addQuote(context);

    expect(result._id).toBe(quoteId);
    expect(context.prisma.notification.create).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      'addQuote: failed to notify the post author',
      expect.objectContaining({ quoteId, error: 'pubsub down' })
    );
  });

  it('keeps the quote text and other content out of the warning', async () => {
    const context = mockContext();
    context.prisma.notification.create.mockRejectedValue(new Error('write conflict'));

    await addQuote(context);

    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).not.toContain(QUOTE_TEXT);
    expect(logged).not.toContain('Hello');
  });

  it('notifies the post author and logs nothing when all goes well', async () => {
    const context = mockContext();

    await addQuote(context);

    expect(context.prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: postOwnerId,
          userIdBy: userId,
          notificationType: 'QUOTED',
          postId,
        }),
      })
    );
    expect(publish).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not notify you about quoting your own post', async () => {
    const context = mockContext(userId);

    await addQuote(context);

    expect(context.prisma.notification.create).not.toHaveBeenCalled();
    expect(publish).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });
});
