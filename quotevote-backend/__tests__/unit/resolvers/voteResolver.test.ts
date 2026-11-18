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
    // Soft-deletes report each vote they changed, unless a test says otherwise.
    $runCommandRaw: jest.fn((command: Record<string, unknown>) =>
      Promise.resolve(command.update === 'votes' ? { ok: 1, n: 1, nModified: 1 } : { ok: 1 })
    ),
    // Interactive transactions run against the same mock client.
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((run: (tx: unknown) => Promise<unknown>) => run(prisma));
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

type RawCommand = Record<string, unknown>;
const rawCommands = (ctx: Ctx): RawCommand[] =>
  ctx.prisma.$runCommandRaw.mock.calls.map(([command]) => command as RawCommand);
const insertedVote = (ctx: Ctx) => {
  const insert = rawCommands(ctx).find((c) => c.insert === 'votes');
  return (insert?.documents as Record<string, unknown>[] | undefined)?.[0];
};
/** The soft-delete of votes, if the write made one. */
const softDelete = (ctx: Ctx) => {
  const update = rawCommands(ctx).find((c) => c.update === 'votes');
  return (update?.updates as { q: unknown; u: unknown }[] | undefined)?.[0];
};
const liveVotes = (...ids: string[]) => ({
  _id: { $in: ids.map((id) => ({ $oid: id })) },
  deleted: { $ne: true },
});
const noneModified = (ctx: Ctx) =>
  ctx.prisma.$runCommandRaw.mockImplementation((command: Record<string, unknown>) =>
    Promise.resolve(command.update === 'votes' ? { ok: 1, n: 0, nModified: 0 } : { ok: 1 })
  );
const writeConflict = () => Object.assign(new Error('write conflict'), { code: 'P2034' });

/** The `$set` stage of the post counts update. */
const postCountsSet = (ctx: Ctx) => {
  const update = rawCommands(ctx).find((c) => c.update === 'posts');
  const [{ q, u }] = update?.updates as { q: unknown; u: { $set: Record<string, unknown> }[] }[];
  return { q, set: u[0].$set };
};
const totalBy = (set: Record<string, unknown>, field: 'upvotes' | 'downvotes') =>
  (set[field] as { $max: [number, { $add: [unknown, number] }] }).$max[1].$add[1];
const votedByEntry = (set: Record<string, unknown>) => {
  const votedBy = set.votedBy as { $concatArrays?: [unknown, unknown[]] };
  return votedBy.$concatArrays ? votedBy.$concatArrays[1][0] : null;
};

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
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
    });

    it('refuses a vote for another member', async () => {
      const ctx = mockContext(authedUser());
      await expect(addVote(ctx, voteInput({ userId: otherUserId }))).rejects.toMatchObject({
        extensions: { code: 'FORBIDDEN' },
      });
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
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
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
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
      const doc = insertedVote(ctx);
      expect(doc).toMatchObject({
        userId: { $oid: userId },
        postId: { $oid: postId },
        type: 'up',
        tags: '#agree',
        startWordIndex: 4,
        endWordIndex: 15,
        content: 'quick brown',
        deleted: false,
      });
      const newId = (doc?._id as { $oid: string }).$oid;
      expect(newId).toMatch(/^[a-f0-9]{24}$/);
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(ctx.prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ activityType: 'VOTED', voteId: newId, postId, userId }),
        })
      );
      expect(addNotification).toHaveBeenCalledWith(ctx.prisma, {
        userId: postOwnerId,
        userIdBy: userId,
        notificationType: 'UPVOTED',
        label: 'quick brown',
        postId,
      });
      expect(result).toMatchObject({
        _id: newId,
        type: 'up',
        tags: ['#agree'],
        content: 'quick brown',
        deleted: false,
      });
    });

    it('stores the response as the string the current API reads', async () => {
      const ctx = mockContext(authedUser());

      await addVote(ctx, voteInput({ tags: '#false', type: 'down' }));

      expect(insertedVote(ctx)?.tags).toBe('#false');
    });

    it("adds the vote to the post's totals and votedBy in the same transaction", async () => {
      const ctx = mockContext(authedUser());

      await addVote(ctx, voteInput());

      const { q, set } = postCountsSet(ctx);
      expect(q).toEqual({ _id: { $oid: postId } });
      expect(totalBy(set, 'upvotes')).toBe(1);
      expect(totalBy(set, 'downvotes')).toBe(0);
      expect(votedByEntry(set)).toEqual({ type: 'up', userId: { $oid: userId } });
      expect(softDelete(ctx)).toBeUndefined();
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it("doesn't change the post's score", async () => {
      const ctx = mockContext(authedUser());

      await addVote(ctx, voteInput());

      expect(ctx.prisma.post.update).not.toHaveBeenCalled();
      const { set } = postCountsSet(ctx);
      expect(Object.keys(set).sort()).toEqual(['downvotes', 'upvotes', 'votedBy']);
    });

    it('keeps responses in the other pairs on the same passage', async () => {
      const ctx = mockContext(authedUser());
      // Legacy stores the response as a string, new votes as a list.
      ctx.prisma.vote.findRaw.mockResolvedValue([
        { _id: { $oid: oldVoteId }, tags: '#true' },
        { _id: { $oid: '60d5ec49ad414d7a8d5464b3' }, tags: ['#dislike'] },
      ]);

      await addVote(ctx, voteInput());

      expect(softDelete(ctx)).toBeUndefined();
      expect(insertedVote(ctx)).toBeDefined();
      const { set } = postCountsSet(ctx);
      expect(totalBy(set, 'upvotes')).toBe(1);
      expect(totalBy(set, 'downvotes')).toBe(0);
    });

    it('replaces the other side of the pair in one transaction', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findRaw.mockResolvedValue([
        { _id: { $oid: oldVoteId }, tags: '#agree' },
        { _id: { $oid: '60d5ec49ad414d7a8d5464b3' }, tags: '#like' },
      ]);

      const result = await addVote(ctx, voteInput({ tags: '#disagree', type: 'down' }));

      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(softDelete(ctx)).toEqual({
        q: liveVotes(oldVoteId),
        u: { $set: { deleted: true }, $currentDate: { updatedAt: true } },
        multi: true,
      });
      expect(addNotification).toHaveBeenCalledWith(
        ctx.prisma,
        expect.objectContaining({ notificationType: 'DOWNVOTED' })
      );
      const { set } = postCountsSet(ctx);
      expect(totalBy(set, 'upvotes')).toBe(-1);
      expect(totalBy(set, 'downvotes')).toBe(1);
      expect(votedByEntry(set)).toEqual({ type: 'down', userId: { $oid: userId } });
      expect(result).toMatchObject({ type: 'down', tags: ['#disagree'] });
    });

    it('only takes a replaced vote off the totals if it was still live', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findRaw.mockResolvedValue([{ _id: { $oid: oldVoteId }, tags: '#agree' }]);
      // A concurrent request already replaced it.
      noneModified(ctx);

      await addVote(ctx, voteInput({ tags: '#disagree', type: 'down' }));

      const { set } = postCountsSet(ctx);
      expect(totalBy(set, 'upvotes')).toBe(0);
      expect(totalBy(set, 'downvotes')).toBe(1);
    });

    it('returns the response already held instead of adding it again', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findRaw.mockResolvedValue([{ _id: { $oid: oldVoteId }, tags: '#agree' }]);
      ctx.prisma.vote.findUnique.mockResolvedValue(voteRecord(oldVoteId, 'up'));

      const result = await addVote(ctx, voteInput());

      expect(result).toMatchObject({ _id: oldVoteId, tags: ['#agree'] });
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
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

      expect(softDelete(ctx)?.q).toEqual(liveVotes('60d5ec49ad414d7a8d5464b3'));
      expect(insertedVote(ctx)).toBeUndefined();
      const { set } = postCountsSet(ctx);
      expect(totalBy(set, 'upvotes')).toBe(0);
      expect(totalBy(set, 'downvotes')).toBe(-1);
      expect(votedByEntry(set)).toEqual({ type: 'up', userId: { $oid: userId } });
    });

    it('runs the vote again when a concurrent vote on the post wins a write conflict', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.$transaction.mockRejectedValueOnce(writeConflict());

      await addVote(ctx, voteInput());

      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(ctx.prisma.activity.create).toHaveBeenCalledTimes(1);
    });

    it("doesn't retry other failures", async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.$transaction.mockRejectedValueOnce(new Error('connection lost'));

      await expect(addVote(ctx, voteInput())).rejects.toThrow('connection lost');
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(ctx.prisma.activity.create).not.toHaveBeenCalled();
    });

    it("doesn't notify members voting on their own post", async () => {
      const ctx = mockContext(authedUser(postOwnerId));

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
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
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
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });

      await expect(deleteVote(ctx, voteId)).resolves.toEqual({ _id: voteId });
      expect(softDelete(ctx)).toEqual({
        q: liveVotes(voteId),
        u: { $set: { deleted: true }, $currentDate: { updatedAt: true } },
        multi: true,
      });
    });

    it("takes the vote off the post's totals and drops the member from votedBy", async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });

      await deleteVote(ctx, voteId);

      expect(ctx.prisma.vote.findRaw).toHaveBeenCalledWith({
        filter: {
          postId: { $oid: postId },
          userId: { $oid: userId },
          deleted: { $ne: true },
        },
        options: { projection: { type: 1 }, sort: { created: -1 }, limit: 1 },
      });
      const { q, set } = postCountsSet(ctx);
      expect(q).toEqual({ _id: { $oid: postId } });
      expect(totalBy(set, 'upvotes')).toBe(-1);
      expect(totalBy(set, 'downvotes')).toBe(0);
      expect(votedByEntry(set)).toBeNull();
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('keeps the member in votedBy with their latest other vote on the post', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });
      ctx.prisma.vote.findRaw.mockResolvedValue([{ type: 'down' }]);

      await deleteVote(ctx, voteId);

      const { set } = postCountsSet(ctx);
      expect(totalBy(set, 'upvotes')).toBe(-1);
      expect(votedByEntry(set)).toEqual({ type: 'down', userId: { $oid: userId } });
    });

    it("doesn't take the vote off twice when another request deleted it first", async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });
      noneModified(ctx);

      await expect(deleteVote(ctx, voteId)).resolves.toEqual({ _id: voteId });
      expect(softDelete(ctx)).toBeDefined();
      expect(rawCommands(ctx).some((c) => c.update === 'posts')).toBe(false);
    });

    it('runs the delete again after a write conflict', async () => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });
      ctx.prisma.$transaction.mockRejectedValueOnce(writeConflict());

      await expect(deleteVote(ctx, voteId)).resolves.toEqual({ _id: voteId });
      expect(ctx.prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(rawCommands(ctx).filter((c) => c.update === 'posts')).toHaveLength(1);
    });

    it("refuses to delete another member's vote", async () => {
      const ctx = mockContext(authedUser(otherUserId));
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });

      await expect(deleteVote(ctx, voteId)).rejects.toMatchObject({
        extensions: { code: 'FORBIDDEN' },
      });
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
    });

    it("lets an admin delete another member's vote", async () => {
      const ctx = mockContext(authedUser(otherUserId, true));
      ctx.prisma.vote.findUnique.mockResolvedValue({
        id: voteId,
        userId,
        postId,
        type: 'up',
        deleted: false,
      });

      await deleteVote(ctx, voteId);
      expect(softDelete(ctx)?.q).toEqual(liveVotes(voteId));
    });

    it.each([
      ['an unknown vote', null],
      ['an already deleted vote', { id: voteId, userId, postId, type: 'up', deleted: true }],
    ])('returns the id without writing for %s', async (_label, row) => {
      const ctx = mockContext(authedUser());
      ctx.prisma.vote.findUnique.mockResolvedValue(row);

      await expect(deleteVote(ctx, voteId)).resolves.toEqual({ _id: voteId });
      expect(ctx.prisma.$runCommandRaw).not.toHaveBeenCalled();
    });

    it('returns the id without a lookup for an invalid id', async () => {
      const ctx = mockContext(authedUser());

      await expect(deleteVote(ctx, 'not-an-id')).resolves.toEqual({ _id: 'not-an-id' });
      expect(ctx.prisma.vote.findUnique).not.toHaveBeenCalled();
    });
  });
});
