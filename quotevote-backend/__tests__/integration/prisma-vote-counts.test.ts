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
