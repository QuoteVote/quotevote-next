/**
 * Passage votes keep the post's totals in step (#693).
 *
 * Runs addVote and deleteVote against a real MongoDB replica set, so the vote insert and the
 * post update really share a transaction, and checks the documents the current API reads:
 * `tags` as a string, `upvotes` / `downvotes`, and `votedBy` as `{ type, userId }` entries.
 *
 * Requires a MongoDB replica set in DATABASE_URL. Use a throwaway database: the test drops
 * the documents it creates and nothing else.
 *
 * Run: npm run test:prisma
 */

jest.mock('~/data/utils/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));
jest.mock('~/data/resolvers/utils/notifications', () => ({
  addNotification: jest.fn().mockResolvedValue({}),
}));
jest.mock('~/data/resolvers/utils/activities', () => ({
  logActivity: jest.fn().mockResolvedValue(undefined),
}));

import { PrismaClient } from '@prisma/client';
import { voteResolver } from '~/data/resolvers/voteResolver';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const prisma = new PrismaClient();

const hex = (n: number) => n.toString(16).padStart(24, '0');
const postId = hex(0x693000001);
const authorId = hex(0x693000002);
const voterId = hex(0x693000003);
const keptPlainId = hex(0x693000004);
const keptEntryId = hex(0x693000005);
const crowdIds = [6, 7, 8, 9, 10].map((n) => hex(0x693000000 + n));
const postText = 'The quick brown fox jumps over the lazy dog';

interface StoredPost {
  upvotes?: number;
  downvotes?: number;
  votedBy?: unknown[];
}

const contextFor = (id: string) =>
  ({
    prisma,
    user: { _id: id, username: `voter-${id.slice(-2)}`, admin: false },
    userId: id,
  }) as unknown as GraphQLContext;

const vote = (id: string, overrides: Partial<Common.VoteInput>) =>
  voteResolver.Mutation.addVote(
    null,
    {
      vote: {
        postId,
        userId: id,
        type: 'up',
        tags: '#agree',
        startWordIndex: 4,
        endWordIndex: 15,
        ...overrides,
      },
    },
    contextFor(id)
  );

const unvote = (id: string, voteId: string) =>
  voteResolver.Mutation.deleteVote(null, { voteId }, contextFor(id));

const readPost = async (): Promise<StoredPost> => {
  const [post] = (await prisma.post.findRaw({
    filter: { _id: { $oid: postId } },
    options: { projection: { upvotes: 1, downvotes: 1, votedBy: 1 } },
  })) as unknown as StoredPost[];
  return post;
};

const readVoteTags = async (voteId: string): Promise<unknown> => {
  const [row] = (await prisma.vote.findRaw({
    filter: { _id: { $oid: voteId } },
    options: { projection: { tags: 1 } },
  })) as unknown as { tags?: unknown }[];
  return row?.tags;
};

/** `votedBy` as `userId -> type`, with plain legacy ids read as having no type. */
const votedByMap = (post: StoredPost): Record<string, string | null> =>
  Object.fromEntries(
    (post.votedBy ?? []).map((entry) => {
      if (entry && typeof entry === 'object' && 'userId' in entry) {
        const { userId, type } = entry as { userId: { $oid: string } | string; type: string };
        return [typeof userId === 'string' ? userId : userId.$oid, type];
      }
      return [typeof entry === 'string' ? entry : (entry as { $oid: string }).$oid, null];
    })
  );

const cleanUp = () =>
  Promise.all([
    prisma.$runCommandRaw({
      delete: 'votes',
      deletes: [{ q: { postId: { $oid: postId } }, limit: 0 }],
    }),
    prisma.$runCommandRaw({
      delete: 'posts',
      deletes: [{ q: { _id: { $oid: postId } }, limit: 0 }],
    }),
  ]);

describe('passage votes keep the post totals in step (#693)', () => {
  beforeAll(async () => {
    await cleanUp();
    // A post written the way the current API writes it: totals already counted, `votedBy`
    // holding a plain id from older posts and a `{ type, userId }` entry.
    await prisma.$runCommandRaw({
      insert: 'posts',
      documents: [
        {
          _id: { $oid: postId },
          userId: { $oid: authorId },
          title: 'Vote counts',
          text: postText,
          upvotes: 3,
          downvotes: 1,
          votedBy: [keptPlainId, { type: 'down', userId: { $oid: keptEntryId } }],
          deleted: false,
          created: { $date: new Date().toISOString() },
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanUp();
    await prisma.$disconnect();
  });

  let agreeId = '';
  let disagreeId = '';
  let trueId = '';

  it('adds a vote to the totals and stores its response as a string', async () => {
    agreeId = (await vote(voterId, { tags: '#agree', type: 'up' }))._id;

    const post = await readPost();
    expect(post).toMatchObject({ upvotes: 4, downvotes: 1 });
    expect(votedByMap(post)).toEqual({
      [keptPlainId]: null,
      [keptEntryId]: 'down',
      [voterId]: 'up',
    });
    expect(await readVoteTags(agreeId)).toBe('#agree');
  });

  it('moves the vote across when the member picks the other side of the pair', async () => {
    disagreeId = (await vote(voterId, { tags: '#disagree', type: 'down' }))._id;

    const post = await readPost();
    expect(post).toMatchObject({ upvotes: 3, downvotes: 2 });
    expect(votedByMap(post)[voterId]).toBe('down');
    expect(post.votedBy).toHaveLength(3);
    expect(await readVoteTags(disagreeId)).toBe('#disagree');
  });

  it("doesn't count a response the member already holds twice", async () => {
    await vote(voterId, { tags: '#disagree', type: 'down' });

    expect(await readPost()).toMatchObject({ upvotes: 3, downvotes: 2 });
  });

  it('counts votes on another passage on their own', async () => {
    trueId = (
      await vote(voterId, { tags: '#true', type: 'up', startWordIndex: 16, endWordIndex: 25 })
    )._id;

    const post = await readPost();
    expect(post).toMatchObject({ upvotes: 4, downvotes: 2 });
    expect(votedByMap(post)[voterId]).toBe('up');
  });

  it('takes a removed vote off, keeping the member while another vote is live', async () => {
    await unvote(voterId, trueId);

    const post = await readPost();
    expect(post).toMatchObject({ upvotes: 3, downvotes: 2 });
    expect(votedByMap(post)[voterId]).toBe('down');
  });

  it("drops the member once their last vote is removed, and doesn't remove it twice", async () => {
    await unvote(voterId, disagreeId);
    await unvote(voterId, disagreeId);

    const post = await readPost();
    expect(post).toMatchObject({ upvotes: 3, downvotes: 1 });
    expect(votedByMap(post)).toEqual({ [keptPlainId]: null, [keptEntryId]: 'down' });
  });

  it('takes a vote off once when it is removed twice at the same time', async () => {
    const id = (await vote(voterId, { tags: '#dislike', type: 'down' }))._id;
    expect(await readPost()).toMatchObject({ upvotes: 3, downvotes: 2 });

    await Promise.all([unvote(voterId, id), unvote(voterId, id)]);

    expect(await readPost()).toMatchObject({ upvotes: 3, downvotes: 1 });
    expect(votedByMap(await readPost())[voterId]).toBeUndefined();
  });

  it("doesn't lose votes cast at the same time", async () => {
    await Promise.all(crowdIds.map((id) => vote(id, { tags: '#like', type: 'up' })));

    const post = await readPost();
    expect(post).toMatchObject({ upvotes: 8, downvotes: 1 });
    expect(post.votedBy).toHaveLength(2 + crowdIds.length);
  });
});

/**
 * The vote integrity review (#747): a vote sent twice at the same time is counted once, and
 * a member's duplicate response corrects the side it was counted on.
 */
describe('a vote is counted once (#747)', () => {
  const racePostId = hex(0x747000001);
  const raceAuthorId = hex(0x747000002);
  const memberId = hex(0x747000003);
  const duplicateMemberId = hex(0x747000004);
  const crowd = Array.from({ length: 10 }, (_, i) => hex(0x747000100 + i));

  const votesOn = (id: string, overrides: Partial<Common.VoteInput>) =>
    vote(id, { postId: racePostId, ...overrides });

  const readRacePost = async (): Promise<StoredPost> => {
    const [post] = (await prisma.post.findRaw({
      filter: { _id: { $oid: racePostId } },
      options: { projection: { upvotes: 1, downvotes: 1, votedBy: 1 } },
    })) as unknown as StoredPost[];
    return post;
  };

  const liveVotes = async (id: string): Promise<{ tags?: unknown }[]> =>
    (await prisma.vote.findRaw({
      filter: { postId: { $oid: racePostId }, userId: { $oid: id }, deleted: { $ne: true } },
      options: { projection: { tags: 1 } },
    })) as unknown as { tags?: unknown }[];

  const insertVote = (id: string, tags: string, type: 'up' | 'down') =>
    prisma.$runCommandRaw({
      insert: 'votes',
      documents: [
        {
          userId: { $oid: id },
          postId: { $oid: racePostId },
          type,
          tags,
          startWordIndex: 4,
          endWordIndex: 15,
          content: postText.slice(4, 15),
          deleted: false,
          created: { $date: new Date().toISOString() },
        },
      ],
    });

  const cleanRace = () =>
    Promise.all([
      prisma.$runCommandRaw({
        delete: 'votes',
        deletes: [{ q: { postId: { $oid: racePostId } }, limit: 0 }],
      }),
      prisma.$runCommandRaw({
        delete: 'posts',
        deletes: [{ q: { _id: { $oid: racePostId } }, limit: 0 }],
      }),
    ]);

  beforeEach(async () => {
    await cleanRace();
    await prisma.$runCommandRaw({
      insert: 'posts',
      documents: [
        {
          _id: { $oid: racePostId },
          userId: { $oid: raceAuthorId },
          title: 'Vote integrity',
          text: postText,
          upvotes: 0,
          downvotes: 0,
          votedBy: [],
          deleted: false,
          created: { $date: new Date().toISOString() },
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanRace();
  });

  it("keeps the member's newest other vote in votedBy, even one without created", async () => {
    // Ids grow with time. The newest remaining vote is an older-shape one with no `created`,
    // which a sort on `created` put last (#747).
    const olderId = hex(0x747000200);
    const newerLegacyId = hex(0x747000201);
    const removedId = hex(0x747000202);
    const row = (id: string, type: 'up' | 'down', tags: string, start: number) => ({
      _id: { $oid: id },
      userId: { $oid: memberId },
      postId: { $oid: racePostId },
      type,
      tags,
      startWordIndex: start,
      endWordIndex: start + 5,
      content: postText.slice(start, start + 5),
      deleted: false,
    });
    const now = { $date: new Date().toISOString() };
    await prisma.$runCommandRaw({
      insert: 'votes',
      documents: [
        { ...row(olderId, 'up', '#agree', 0), created: now },
        row(newerLegacyId, 'down', '#disagree', 10),
        { ...row(removedId, 'up', '#like', 20), created: now },
      ],
    });
    await prisma.$runCommandRaw({
      update: 'posts',
      updates: [
        {
          q: { _id: { $oid: racePostId } },
          u: {
            $set: {
              upvotes: 2,
              downvotes: 1,
              votedBy: [{ type: 'up', userId: { $oid: memberId } }],
            },
          },
        },
      ],
    });

    await unvote(memberId, removedId);

    const post = await readRacePost();
    expect(post).toMatchObject({ upvotes: 1, downvotes: 1 });
    expect(votedByMap(post)).toEqual({ [memberId]: 'down' });
  });

  it('saves a vote sent twice at the same time once', async () => {
    const [first, second] = await Promise.all([
      votesOn(memberId, { tags: '#agree', type: 'up' }),
      votesOn(memberId, { tags: '#agree', type: 'up' }),
    ]);

    expect(first._id).toBe(second._id);
    expect(await liveVotes(memberId)).toHaveLength(1);
    expect(await readRacePost()).toMatchObject({ upvotes: 1, downvotes: 0 });
  });

  it('keeps one vote per member when a crowd votes twice each at the same time', async () => {
    await Promise.all(
      crowd.flatMap((id) => [
        votesOn(id, { tags: '#like', type: 'up' }),
        votesOn(id, { tags: '#like', type: 'up' }),
      ])
    );

    const post = await readRacePost();
    expect(post).toMatchObject({ upvotes: crowd.length, downvotes: 0 });
    expect(post.votedBy).toHaveLength(crowd.length);
    for (const id of crowd) expect(await liveVotes(id)).toHaveLength(1);
  });

  it('takes a duplicate of the same response off its own side', async () => {
    // The state the race above used to leave: two live #agree votes, both counted.
    await insertVote(duplicateMemberId, '#agree', 'up');
    await insertVote(duplicateMemberId, '#agree', 'up');
    await prisma.$runCommandRaw({
      update: 'posts',
      updates: [{ q: { _id: { $oid: racePostId } }, u: { $set: { upvotes: 2, downvotes: 0 } } }],
    });

    await votesOn(duplicateMemberId, { tags: '#agree', type: 'up' });

    expect(await liveVotes(duplicateMemberId)).toHaveLength(1);
    expect(await readRacePost()).toMatchObject({ upvotes: 1, downvotes: 0 });
  });

  it('takes the other side and a duplicate off their own sides in one vote', async () => {
    await insertVote(duplicateMemberId, '#agree', 'up');
    await insertVote(duplicateMemberId, '#agree', 'up');
    await insertVote(duplicateMemberId, '#disagree', 'down');
    await prisma.$runCommandRaw({
      update: 'posts',
      updates: [{ q: { _id: { $oid: racePostId } }, u: { $set: { upvotes: 2, downvotes: 1 } } }],
    });

    await votesOn(duplicateMemberId, { tags: '#agree', type: 'up' });

    const live = await liveVotes(duplicateMemberId);
    expect(live.map((row) => row.tags)).toEqual(['#agree']);
    expect(await readRacePost()).toMatchObject({ upvotes: 1, downvotes: 0 });
  });
});
