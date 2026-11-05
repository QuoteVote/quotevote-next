jest.mock('~/data/utils/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));
jest.mock('~/data/resolvers/utils/notifications', () => ({
  addNotification: jest.fn().mockResolvedValue({}),
}));

import { voteResolver } from '~/data/resolvers/voteResolver';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import { addNotification } from '~/data/resolvers/utils/notifications';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const date = new Date('2026-01-01T00:00:00.000Z');
const userId = '60d5ec49ad414d7a8d5464a0';
const otherUserId = '60d5ec49ad414d7a8d5464a9';
const postOwnerId = '60d5ec49ad414d7a8d546499';
const postId = '60d5ec49ad414d7a8d5464c2';
const voteId = '60d5ec49ad414d7a8d5464b1';
const oldVoteId = '60d5ec49ad414d7a8d5464b2';
const postText = 'The quick brown fox jumps over the lazy dog';

function mockContext(user: GraphQLContext['user'] = null) {
  const prisma = {
    vote: {
      findRaw: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    post: {
      findUnique: jest.fn().mockResolvedValue({
        id: postId,
        userId: postOwnerId,
        title: 'A post',
        text: postText,
        deleted: false,
      }),
      update: jest.fn(),
    },
    activity: {
      create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  return {
    prisma,
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedUser(id = userId, admin = false): NonNullable<GraphQLContext['user']> {
  return { _id: id, username: 'alice', email: 'alice@example.com', admin } as NonNullable<
    GraphQLContext['user']
  >;
}

const voteInput = (overrides: Partial<Common.VoteInput> = {}): Common.VoteInput => ({
  postId,
  userId,
  type: 'up',
  tags: '#agree',
  startWordIndex: 4,
  endWordIndex: 15,
  content: 'quick brown',
  ...overrides,
});

const voteRecord = (id: string, type: Common.VoteType, content = 'quick brown') => ({
  id,
  userId,
  postId,
  type,
  startWordIndex: 4,
  endWordIndex: 15,
  deleted: false,
  created: date,
  content,
});

type Ctx = ReturnType<typeof mockContext>;
const addVote = (ctx: Ctx, vote: Common.VoteInput) =>
  voteResolver.Mutation.addVote(null, { vote }, ctx as unknown as GraphQLContext);
const deleteVote = (ctx: Ctx, id: string) =>
  voteResolver.Mutation.deleteVote(null, { voteId: id }, ctx as unknown as GraphQLContext);

describe('voteResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Mutation.addVote', () => {
    it('requires a signed-in member', async () => {
      const ctx = mockContext();
      await expect(addVote(ctx, voteInput())).rejects.toMatchObject({
        extensions: { code: 'UNAUTHENTICATED' },
      });
      expect(ctx.prisma.vote.create).not.toHaveBeenCalled();
    });

    it('refuses a vote for another member', async () => {
      const ctx = mockContext(authedUser());
      await expect(addVote(ctx, voteInput({ userId: otherUserId }))).rejects.toMatchObject({
        extensions: { code: 'FORBIDDEN' },
      });
      expect(ctx.prisma.vote.create).not.toHaveBeenCalled();
    });

    it.each([
      ['an unknown response', { tags: '#maybe' }],
      ['a type that does not match the response', { tags: '#disagree', type: 'up' as const }],
      ['an invalid postId', { postId: 'not-an-id' }],
      ['an empty passage', { startWordIndex: 5, endWordIndex: 5 }],
      ['a negative start', { startWordIndex: -1 }],
      ['a passage past the end of the post', { endWordIndex: postText.length + 1 }],
    ])('refuses %s', async (_label, overrides) => {
      const ctx = mockContext(authedUser());
      await expect(addVote(ctx, voteInput(overrides))).rejects.toMatchObject({
        extensions: { code: 'BAD_USER_INPUT' },
      });
      expect(ctx.prisma.vote.create).not.toHaveBeenCalled();
    });

    it('refuses a vote on a deleted post', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        userId: postOwnerId,
        title: 'A post',
        text: postText,
        deleted: true,
      });
      await expect(addVote(ctx, voteInput())).rejects.toMatchObject({
        extensions: { code: 'NOT_FOUND' },
      });
    });

    it('stores a new response with the passage text from the post, and notifies the author', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.create.mockResolvedValue(voteRecord(voteId, 'up'));

      const result = await addVote(ctx, voteInput({ content: 'something else entirely' }));

      expect(ctx.prisma.vote.findRaw).toHaveBeenCalledWith({
        filter: {
          postId: { $oid: postId },
          userId: { $oid: userId },
          startWordIndex: 4,
          endWordIndex: 15,
          deleted: { $ne: true },
        },
        options: { projection: { tags: 1 } },
      });
      expect(ctx.prisma.vote.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            postId,
            type: 'up',
            tags: ['#agree'],
            startWordIndex: 4,
            endWordIndex: 15,
            content: 'quick brown',
          }),
        })
      );
      expect(ctx.prisma.$transaction).not.toHaveBeenCalled();
      expect(ctx.prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ activityType: 'VOTED', voteId, postId, userId }),
        })
      );
      expect(addNotification).toHaveBeenCalledWith(ctx.prisma, {
        userId: postOwnerId,
        userIdBy: userId,
        notificationType: 'UPVOTED',
        label: 'quick brown',
        postId,
      });
      expect(result).toMatchObject({ _id: voteId, type: 'up', tags: ['#agree'] });
    });

    it("doesn't change the post's score", async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.create.mockResolvedValue(voteRecord(voteId, 'up'));

      await addVote(ctx, voteInput());

      expect(ctx.prisma.post.update).not.toHaveBeenCalled();
    });

    it('keeps responses in the other pairs on the same passage', async () => {
      const ctx = mockContext(authedUser());
      // Legacy stores the response as a string, new votes as a list.
      ctx.prisma.vote.findRaw.mockResolvedValue([
        { _id: { $oid: oldVoteId }, tags: '#true' },
        { _id: { $oid: '60d5ec49ad414d7a8d5464b3' }, tags: ['#dislike'] },
      ]);
      ctx.prisma.vote.create.mockResolvedValue(voteRecord(voteId, 'up'));

      await addVote(ctx, voteInput());

      expect(ctx.prisma.vote.updateMany).not.toHaveBeenCalled();
      expect(ctx.prisma.vote.create).toHaveBeenCalledTimes(1);
    });

    it('replaces the other side of the pair in one transaction', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findRaw.mockResolvedValue([
        { _id: { $oid: oldVoteId }, tags: '#agree' },
        { _id: { $oid: '60d5ec49ad414d7a8d5464b3' }, tags: '#like' },
      ]);
      ctx.prisma.vote.create.mockResolvedValue(voteRecord(voteId, 'down'));

      const result = await addVote(ctx, voteInput({ tags: '#disagree', type: 'down' }));

      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(ctx.prisma.vote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [oldVoteId] } },
        data: { deleted: true },
      });
      expect(addNotification).toHaveBeenCalledWith(
        ctx.prisma,
        expect.objectContaining({ notificationType: 'DOWNVOTED' })
      );
      expect(result).toMatchObject({ _id: voteId, type: 'down', tags: ['#disagree'] });
    });

    it('returns the response already held instead of adding it again', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findRaw.mockResolvedValue([{ _id: { $oid: oldVoteId }, tags: '#agree' }]);
      ctx.prisma.vote.findUnique.mockResolvedValue(voteRecord(oldVoteId, 'up'));

      const result = await addVote(ctx, voteInput());

      expect(result).toMatchObject({ _id: oldVoteId, tags: ['#agree'] });
      expect(ctx.prisma.vote.create).not.toHaveBeenCalled();
      expect(checkRateLimit).not.toHaveBeenCalled();
      expect(ctx.prisma.activity.create).not.toHaveBeenCalled();
      expect(addNotification).not.toHaveBeenCalled();
    });

    it('clears a leftover other side when the response is already held', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findRaw.mockResolvedValue([
        { _id: { $oid: oldVoteId }, tags: '#agree' },
        { _id: { $oid: '60d5ec49ad414d7a8d5464b3' }, tags: '#disagree' },
      ]);
      ctx.prisma.vote.findUnique.mockResolvedValue(voteRecord(oldVoteId, 'up'));

      await addVote(ctx, voteInput());

      expect(ctx.prisma.vote.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['60d5ec49ad414d7a8d5464b3'] } },
        data: { deleted: true },
      });
      expect(ctx.prisma.vote.create).not.toHaveBeenCalled();
    });

    it("doesn't notify members voting on their own post", async () => {
      const ctx = mockContext(authedUser(postOwnerId));
      ctx.prisma.vote.create.mockResolvedValue(voteRecord(voteId, 'up'));

      await addVote(ctx, voteInput({ userId: postOwnerId }));

      expect(addNotification).not.toHaveBeenCalled();
      expect(ctx.prisma.activity.create).toHaveBeenCalledTimes(1);
    });

    it('refuses new votes past the rate limit', async () => {
      const ctx = mockContext(authedUser());
      (checkRateLimit as jest.Mock).mockRejectedValueOnce(new Error('Rate limit exceeded'));

      await expect(addVote(ctx, voteInput())).rejects.toMatchObject({
        extensions: { code: 'TOO_MANY_REQUESTS' },
      });
      expect(checkRateLimit).toHaveBeenCalledWith(ctx.prisma, userId, 'addVote', 30, 60000);
      expect(ctx.prisma.vote.create).not.toHaveBeenCalled();
    });
  });

  describe('Vote.tags', () => {
    it.each([
      ['a new vote list', ['#agree'], '#agree'],
      ['a legacy string', '#true', '#true'],
      ['no tags', undefined, null],
    ])('returns %s as a string', (_label, tags, expected) => {
      expect(voteResolver.Vote.tags({ tags })).toBe(expected);
    });
  });

  describe('Mutation.deleteVote', () => {
    it('requires a signed-in member', async () => {
      const ctx = mockContext();
      await expect(deleteVote(ctx, voteId)).rejects.toMatchObject({
        extensions: { code: 'UNAUTHENTICATED' },
      });
    });

    it("soft-deletes the member's own vote", async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue({ id: voteId, userId, deleted: false });

      await expect(deleteVote(ctx, voteId)).resolves.toEqual({ _id: voteId });
      expect(ctx.prisma.vote.update).toHaveBeenCalledWith({
        where: { id: voteId },
        data: { deleted: true },
        select: { id: true },
      });
    });

    it("refuses to delete another member's vote", async () => {
      const ctx = mockContext(authedUser(otherUserId));
      ctx.prisma.vote.findUnique.mockResolvedValue({ id: voteId, userId, deleted: false });

      await expect(deleteVote(ctx, voteId)).rejects.toMatchObject({
        extensions: { code: 'FORBIDDEN' },
      });
      expect(ctx.prisma.vote.update).not.toHaveBeenCalled();
    });

    it("lets an admin delete another member's vote", async () => {
      const ctx = mockContext(authedUser(otherUserId, true));
      ctx.prisma.vote.findUnique.mockResolvedValue({ id: voteId, userId, deleted: false });

      await deleteVote(ctx, voteId);
      expect(ctx.prisma.vote.update).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['an unknown vote', null],
      ['an already deleted vote', { id: voteId, userId, deleted: true }],
    ])('returns the id without writing for %s', async (_label, row) => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue(row);

      await expect(deleteVote(ctx, voteId)).resolves.toEqual({ _id: voteId });
      expect(ctx.prisma.vote.update).not.toHaveBeenCalled();
    });

    it('returns the id without a lookup for an invalid id', async () => {
      const ctx = mockContext(authedUser());

      await expect(deleteVote(ctx, 'not-an-id')).resolves.toEqual({ _id: 'not-an-id' });
      expect(ctx.prisma.vote.findUnique).not.toHaveBeenCalled();
    });
  });
});
