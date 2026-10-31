import { hydrateActivities } from '~/data/resolvers/utils/hydrateActivities';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';
import type * as Common from '~/types/common';

const actorId = '60d5ec49ad414d7a8d5464a0';
const authorId = '60d5ec49ad414d7a8d5464a1';
const postId = '60d5ec49ad414d7a8d5464b1';
const deletedPostId = '60d5ec49ad414d7a8d5464b2';
const voteId = '60d5ec49ad414d7a8d5464c1';
const commentId = '60d5ec49ad414d7a8d5464d1';
const created = new Date('2024-01-01T00:00:00Z');

const post = (id: string, deleted?: boolean) => ({
  id,
  userId: authorId,
  title: 'A post',
  text: 'Some text',
  url: `/post/${id}`,
  upvotes: 2,
  downvotes: 1,
  bookmarkedBy: [],
  created,
  ...(deleted === undefined ? {} : { deleted }),
});

function mockPrisma() {
  return {
    post: { findMany: jest.fn().mockResolvedValue([post(postId), post(deletedPostId, true)]) },
    user: {
      findMany: jest.fn().mockResolvedValue([
        { id: actorId, username: 'bob', name: 'Bob' },
        { id: authorId, username: 'alice', name: 'Alice' },
      ]),
    },
    vote: {
      findMany: jest.fn().mockImplementation(({ where }: { where: { id?: unknown } }) =>
        Promise.resolve(
          where.id
            ? [{ id: voteId, userId: actorId, postId, type: 'up', startWordIndex: 0, endWordIndex: 4, created }]
            : [
                { id: voteId, postId },
                { id: '60d5ec49ad414d7a8d5464c2', postId, deleted: true },
              ]
        )
      ),
    },
    comment: {
      findMany: jest.fn().mockImplementation(({ where }: { where: { id?: unknown } }) =>
        Promise.resolve(
          where.id
            ? [
                {
                  id: commentId,
                  userId: actorId,
                  postId,
                  content: 'Nice',
                  startWordIndex: 0,
                  endWordIndex: 4,
                  url: null,
                  reaction: null,
                  deleted: false,
                  created,
                },
              ]
            : [{ id: commentId, postId, deleted: false }]
        )
      ),
    },
    quote: { findMany: jest.fn().mockResolvedValue([]) },
    messageRoom: {
      findMany: jest.fn().mockResolvedValue([
        { id: '60d5ec49ad414d7a8d5464f1', postId },
        { id: '60d5ec49ad414d7a8d5464f2', postId },
      ]),
    },
  };
}

const activity = (overrides: Partial<Common.Activity>): Common.Activity => ({
  _id: '60d5ec49ad414d7a8d5464e0',
  userId: actorId,
  postId,
  activityType: 'POSTED',
  created,
  ...overrides,
});

type Prisma = Parameters<typeof hydrateActivities>[0];

describe('hydrateActivities', () => {
  it('returns an empty list without querying', async () => {
    const prisma = mockPrisma();
    await expect(hydrateActivities(prisma as unknown as Prisma, [])).resolves.toEqual([]);
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it('attaches the actor, the post with its author and counts, and the vote or comment', async () => {
    const prisma = mockPrisma();
    const [voted, commented] = await hydrateActivities(prisma as unknown as Prisma, [
      activity({ activityType: 'VOTED', voteId }),
      activity({ _id: '60d5ec49ad414d7a8d5464e1', activityType: 'COMMENTED', commentId }),
    ]);

    expect(voted.user).toMatchObject({ _id: actorId, username: 'bob' });
    expect(voted.post).toMatchObject({
      _id: postId,
      title: 'A post',
      creator: { _id: authorId, username: 'alice' },
      // The deleted vote is not counted.
      votes: [{ _id: voteId }],
      comments: [{ _id: commentId }],
      quotes: [],
      // A post has one room; legacy reads it with findOne, so the first wins.
      messageRoom: { _id: '60d5ec49ad414d7a8d5464f1' },
    });
    expect(voted.vote).toMatchObject({ _id: voteId, type: 'up', startWordIndex: 0, endWordIndex: 4 });
    expect(commented.comment).toMatchObject({ _id: commentId, content: 'Nice' });
    expect(commented.vote).toBeNull();
  });

  it('loads a page in one batch per record type', async () => {
    const prisma = mockPrisma();
    await hydrateActivities(
      prisma as unknown as Prisma,
      Array.from({ length: 15 }, (_, i) => activity({ _id: `60d5ec49ad414d7a8d5465${String(i).padStart(2, '0')}` }))
    );
    expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.messageRoom.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.messageRoom.findMany).toHaveBeenCalledWith({
      where: { postId: { in: [postId] } },
      select: { id: true, postId: true },
    });
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [postId] } } })
    );
  });

  it('reads users with public fields only, so no email goes out on a public list', async () => {
    const prisma = mockPrisma();
    const [entry] = await hydrateActivities(prisma as unknown as Prisma, [activity({})]);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ select: PUBLIC_USER_SELECT })
    );
    expect(PUBLIC_USER_SELECT).not.toHaveProperty('email');
    expect(entry.user?.email ?? '').toBe('');
    expect(entry.post?.creator?.email ?? '').toBe('');
  });

  it('skips vote tags, which legacy stores as a single string', async () => {
    const prisma = mockPrisma();
    await hydrateActivities(prisma as unknown as Prisma, [activity({ activityType: 'VOTED', voteId })]);
    const voteSelect = prisma.vote.findMany.mock.calls.find(
      ([args]: [{ where: { id?: unknown } }]) => args.where.id
    )[0].select;
    expect(voteSelect).not.toHaveProperty('tags');
  });

  it('returns a null room for a post without one', async () => {
    const prisma = mockPrisma();
    prisma.messageRoom.findMany.mockResolvedValue([]);
    const [entry] = await hydrateActivities(prisma as unknown as Prisma, [activity({})]);
    expect(entry.post?.messageRoom).toBeNull();
  });

  it('returns null for a deleted post or a vote that no longer exists', async () => {
    const prisma = mockPrisma();
    prisma.vote.findMany.mockResolvedValue([]);
    const [onDeletedPost, missingVote] = await hydrateActivities(prisma as unknown as Prisma, [
      activity({ postId: deletedPostId }),
      activity({ _id: '60d5ec49ad414d7a8d5464e2', activityType: 'VOTED', voteId }),
    ]);
    expect(onDeletedPost.post).toBeNull();
    // Only live posts are looked up for a room.
    expect(prisma.messageRoom.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { postId: { in: [postId] } } })
    );
    expect(missingVote.vote).toBeNull();
    expect(missingVote.post).not.toBeNull();
  });
});
