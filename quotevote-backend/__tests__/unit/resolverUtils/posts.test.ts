/**
 * Test suite for post resolver utilities.
 */

import { attachPostRelations, updateTrending } from '~/data/resolvers/utils/posts';
import type { PrismaPostRecord } from '~/data/utils/postPrismaMapper';
import type { PrismaClient } from '@prisma/client';

function mockPrisma() {
  return {
    post: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    vote: { findMany: jest.fn().mockResolvedValue([]) },
    comment: { findMany: jest.fn().mockResolvedValue([]) },
    quote: { findMany: jest.fn().mockResolvedValue([]) },
    messageRoom: { findMany: jest.fn().mockResolvedValue([]) },
  } as unknown as Pick<
    PrismaClient,
    'post' | 'user' | 'vote' | 'comment' | 'quote' | 'messageRoom'
  >;
}

const post = (id: string, userId = 'u1'): PrismaPostRecord => ({
  id,
  userId,
  tagId: 't1',
  title: `Post ${id}`,
  text: 'Body',
  created: new Date('2026-01-01T00:00:00Z'),
});

describe('posts resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTrending', () => {
    it('should do nothing if post is not found', async () => {
      const prisma = mockPrisma();
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await updateTrending(prisma, 'nonexistent');

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
        select: { pointTimestamp: true, dayPoints: true },
      });
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it('should increment dayPoints if pointTimestamp is within 24 hours', async () => {
      const prisma = mockPrisma();
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1);

      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: recentDate,
        dayPoints: 5,
      });

      await updateTrending(prisma, 'post1');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 6,
        },
        select: { id: true },
      });
    });

    it('should reset dayPoints to 1 if pointTimestamp is older than 24 hours', async () => {
      const prisma = mockPrisma();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2);

      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: oldDate,
        dayPoints: 100,
      });

      await updateTrending(prisma, 'post2');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post2' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 1,
        },
        select: { id: true },
      });
    });

    it('should reset dayPoints when pointTimestamp is not a Date', async () => {
      const prisma = mockPrisma();
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: 'not-a-date',
        dayPoints: 10,
      });

      await updateTrending(prisma, 'post3');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post3' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 1,
        },
        select: { id: true },
      });
    });

    it('should handle post with no existing dayPoints (null/undefined)', async () => {
      const prisma = mockPrisma();
      const recentDate = new Date();

      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: recentDate,
        dayPoints: undefined,
      });

      await updateTrending(prisma, 'post4');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post4' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 1,
        },
        select: { id: true },
      });
    });
  });

  describe('attachPostRelations', () => {
    it('returns an empty array without querying', async () => {
      const prisma = mockPrisma();
      const result = await attachPostRelations(prisma, []);
      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
      expect(prisma.vote.findMany).not.toHaveBeenCalled();
    });

    it('loads authors, votes, comment and quote ids, and the room for a page in one query each', async () => {
      const prisma = mockPrisma();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u1', name: 'Alice', username: 'alice', avatar: null, contributorBadge: true },
      ]);
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'v1',
          userId: 'u2',
          postId: 'p1',
          type: 'up',
          startWordIndex: 0,
          endWordIndex: 3,
          created: new Date(),
        },
        {
          id: 'v2',
          userId: 'u3',
          postId: 'p1',
          type: 'down',
          startWordIndex: null,
          endWordIndex: null,
          created: new Date(),
        },
      ]);
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([{ id: 'c1', postId: 'p2' }]);
      (prisma.quote.findMany as jest.Mock).mockResolvedValue([{ id: 'q1', postId: 'p1' }]);
      (prisma.messageRoom.findMany as jest.Mock).mockResolvedValue([
        { id: 'r1', postId: 'p1' },
        { id: 'r2', postId: 'p1' },
      ]);

      const [first, second] = await attachPostRelations(prisma, [post('p1'), post('p2')]);

      expect(prisma.vote.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.vote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { postId: { in: ['p1', 'p2'] } } })
      );
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: { in: ['u1'] } } })
      );
      expect(first.creator).toEqual(
        expect.objectContaining({ _id: 'u1', username: 'alice', contributorBadge: true })
      );
      expect(first.votes).toEqual([
        expect.objectContaining({ _id: 'v1', type: 'up', startWordIndex: 0, endWordIndex: 3 }),
        expect.objectContaining({ _id: 'v2', type: 'down', startWordIndex: undefined }),
      ]);
      expect(first.comments).toEqual([]);
      expect(first.quotes).toEqual([{ _id: 'q1' }]);
      expect(first.messageRoom).toEqual({ _id: 'r1', postId: 'p1' });
      expect(second.comments).toEqual([{ _id: 'c1' }]);
      expect(second.votes).toEqual([]);
      expect(second.messageRoom).toBeNull();
    });

    it('leaves out deleted votes, comments and quotes, including legacy rows without the flag', async () => {
      const prisma = mockPrisma();
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([
        { id: 'v1', userId: 'u2', postId: 'p1', type: 'up', deleted: true, created: new Date() },
        { id: 'v2', userId: 'u3', postId: 'p1', type: 'up', created: new Date() },
      ]);
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([
        { id: 'c1', postId: 'p1', deleted: true },
        { id: 'c2', postId: 'p1', deleted: false },
      ]);
      (prisma.quote.findMany as jest.Mock).mockResolvedValue([
        { id: 'q1', postId: 'p1', deleted: true },
      ]);

      const [result] = await attachPostRelations(prisma, [post('p1')]);

      expect(result.votes?.map((v) => v._id)).toEqual(['v2']);
      expect(result.comments).toEqual([{ _id: 'c2' }]);
      expect(result.quotes).toEqual([]);
    });

    it('does not read vote tags, which legacy stores as a string', async () => {
      const prisma = mockPrisma();
      await attachPostRelations(prisma, [post('p1')]);
      const { select } = (prisma.vote.findMany as jest.Mock).mock.calls[0][0];
      expect(select.tags).toBeUndefined();
    });

    it('reads authors with card fields only', async () => {
      const prisma = mockPrisma();
      await attachPostRelations(prisma, [post('p1')]);
      const { select } = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(Object.keys(select).sort()).toEqual(
        ['avatar', 'contributorBadge', 'id', 'name', 'username'].sort()
      );
    });
  });
});
