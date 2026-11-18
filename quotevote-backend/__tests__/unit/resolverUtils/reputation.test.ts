/**
 * Test suite for reputation resolver utilities.
 */

import type { PrismaClient } from '@prisma/client';
import {
  calculateUserReputation,
  calculateInviteNetworkScore,
  calculateConductScore,
  calculateActivityScore,
  getDetailedMetrics,
  recalculateAllReputations,
  loadUserReputation,
  type ProfileReputationPrisma,
} from '~/data/resolvers/utils/reputation';

jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function mockPrisma() {
  return {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    post: {
      count: jest.fn().mockResolvedValue(0),
    },
    comment: {
      count: jest.fn().mockResolvedValue(0),
    },
    vote: {
      aggregateRaw: jest.fn().mockResolvedValue([]),
    },
  } as unknown as Pick<PrismaClient, 'user' | 'post' | 'comment' | 'vote'>;
}

/** Mock the live vote counts, grouped by type the way the aggregation returns them. */
function mockVoteCounts(
  prisma: Pick<PrismaClient, 'vote'>,
  upvoteCount: number,
  downvoteCount: number
): void {
  (prisma.vote.aggregateRaw as jest.Mock).mockResolvedValue([
    { _id: 'up', count: upvoteCount },
    { _id: 'down', count: downvoteCount },
  ]);
}

describe('reputation resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateInviteNetworkScore', () => {
    it('should return 0 (stub until UserInviteModel is migrated)', async () => {
      const result = await calculateInviteNetworkScore('user1');
      expect(result).toBe(0);
    });
  });

  describe('calculateConductScore', () => {
    it('should return baseline (300) with no votes, posts, or comments', async () => {
      const prisma = mockPrisma();

      const result = await calculateConductScore(prisma, 'user1');
      expect(result).toBe(300);
    });

    it('should increase score for more upvotes than downvotes', async () => {
      const prisma = mockPrisma();
      mockVoteCounts(prisma, 3, 1);

      const result = await calculateConductScore(prisma, 'user1');
      // 300 + min((3-1)*2, 100) = 300 + 4 = 304
      expect(result).toBe(304);
    });

    it('should add bonuses for posts and comments', async () => {
      const prisma = mockPrisma();
      (prisma.post.count as jest.Mock).mockResolvedValue(5);
      (prisma.comment.count as jest.Mock).mockResolvedValue(10);

      const result = await calculateConductScore(prisma, 'user1');
      // 300 + min(5*5, 50) + min(10*2, 50) = 300 + 25 + 20 = 345
      expect(result).toBe(345);
    });

    it('should cap posts and comments bonuses', async () => {
      const prisma = mockPrisma();
      (prisma.post.count as jest.Mock).mockResolvedValue(100);
      (prisma.comment.count as jest.Mock).mockResolvedValue(100);

      const result = await calculateConductScore(prisma, 'user1');
      // 300 + 50 + 50 = 400
      expect(result).toBe(400);
    });

    it('should cap total conduct score at 500', async () => {
      const prisma = mockPrisma();
      mockVoteCounts(prisma, 100, 0);
      (prisma.post.count as jest.Mock).mockResolvedValue(100);
      (prisma.comment.count as jest.Mock).mockResolvedValue(100);

      const result = await calculateConductScore(prisma, 'user1');
      expect(result).toBeLessThanOrEqual(500);
    });
  });

  describe('calculateActivityScore', () => {
    it('should return 0 if user is not found', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateActivityScore(prisma, 'user1');
      expect(result).toBe(0);
    });

    it('should calculate activity from posts, comments, and votes', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        joined: new Date(),
      });
      (prisma.post.count as jest.Mock).mockResolvedValue(3);
      (prisma.comment.count as jest.Mock).mockResolvedValue(4);
      mockVoteCounts(prisma, 5, 0);

      const result = await calculateActivityScore(prisma, 'user1');
      // min(3*10, 100) + min(4*5, 50) + min(5*2, 50) + age bonus
      // 30 + 20 + 10 + ~0 = 60 + age
      expect(result).toBeGreaterThanOrEqual(60);
    });

    it('should cap score at 200', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        joined: new Date('2020-01-01'),
      });
      (prisma.post.count as jest.Mock).mockResolvedValue(100);
      (prisma.comment.count as jest.Mock).mockResolvedValue(100);
      mockVoteCounts(prisma, 100, 0);

      const result = await calculateActivityScore(prisma, 'user1');
      expect(result).toBe(200);
    });

    it('should include age bonus from joined', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        joined: new Date('2024-01-01'),
      });

      const result = await calculateActivityScore(prisma, 'user1');
      expect(result).toBeGreaterThan(0);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: { id: true, joined: true },
      });
    });
  });

  describe('getDetailedMetrics', () => {
    it('should return all metric fields', async () => {
      const prisma = mockPrisma();
      (prisma.post.count as jest.Mock).mockResolvedValue(2);
      (prisma.comment.count as jest.Mock).mockResolvedValue(1);
      mockVoteCounts(prisma, 2, 1);

      const result = await getDetailedMetrics(prisma, 'user1');

      expect(result).toEqual({
        totalInvitesSent: 0,
        totalInvitesAccepted: 0,
        totalInvitesDeclined: 0,
        averageInviteeReputation: 0,
        totalReportsReceived: 0,
        totalReportsResolved: 0,
        totalUpvotes: 2,
        totalDownvotes: 1,
        totalPosts: 2,
        totalComments: 1,
      });
    });

    it('counts only live votes, so switching a passage response does not add up', async () => {
      const prisma = mockPrisma();
      mockVoteCounts(prisma, 1, 0);

      await getDetailedMetrics(prisma, '60d5ec49ad414d7a8d5464a0');

      expect(prisma.vote.aggregateRaw).toHaveBeenCalledWith({
        pipeline: [
          {
            $match: {
              userId: { $oid: '60d5ec49ad414d7a8d5464a0' },
              deleted: { $ne: true },
            },
          },
          { $group: { _id: '$type', count: { $sum: 1 } } },
        ],
      });
    });

    it('reads a member with no votes as zero', async () => {
      const prisma = mockPrisma();

      const result = await getDetailedMetrics(prisma, 'user1');

      expect(result).toMatchObject({ totalUpvotes: 0, totalDownvotes: 0 });
    });
  });

  describe('calculateUserReputation', () => {
    it('should throw if user is not found', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(calculateUserReputation(prisma, 'nonexistent')).rejects.toThrow(
        'User not found'
      );
    });

    it('should calculate overall reputation for a valid user', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        joined: new Date(),
      });

      const result = await calculateUserReputation(prisma, 'user1');

      expect(result).toEqual({
        _userId: 'user1',
        overallScore: expect.any(Number),
        inviteNetworkScore: 0,
        conductScore: expect.any(Number),
        activityScore: expect.any(Number),
        metrics: expect.objectContaining({
          totalUpvotes: expect.any(Number),
          totalDownvotes: expect.any(Number),
          totalPosts: expect.any(Number),
          totalComments: expect.any(Number),
        }),
        lastCalculated: expect.any(Date),
      });
    });

    it('should handle non-Error throw (e.g. string thrown)', async () => {
      const prisma = mockPrisma();
      (prisma.user.findUnique as jest.Mock).mockRejectedValue('some string error');

      await expect(calculateUserReputation(prisma, 'user1')).rejects.toThrow('some string error');
    });
  });

  describe('recalculateAllReputations', () => {
    it('should return results for all users', async () => {
      const prisma = mockPrisma();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);

      // For each calculateUserReputation call:
      // First user succeeds, second fails
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'u1' }) // calculateUserReputation('u1') → user check
        .mockResolvedValueOnce({ id: 'u1', joined: new Date() }) // activity
        .mockResolvedValueOnce(null); // calculateUserReputation('u2') → not found

      const results = await recalculateAllReputations(prisma);

      expect(results).toHaveLength(2);
      expect(results[0].userId).toBe('u1');
      expect(results[0].success).toBe(true);
      expect(results[1].userId).toBe('u2');
      expect(results[1].success).toBe(false);
    });

    it('should handle empty user list', async () => {
      const prisma = mockPrisma();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const results = await recalculateAllReputations(prisma);
      expect(results).toEqual([]);
    });
  });

  describe('loadUserReputation', () => {
    const userId = '60d5ec49ad414d7a8d5464a0';

    function profilePrisma(rows: unknown[] | Error) {
      const prisma = mockPrisma() as unknown as ProfileReputationPrisma & {
        userReputation: { findRaw: jest.Mock };
      };
      prisma.userReputation = {
        findRaw:
          rows instanceof Error
            ? jest.fn().mockRejectedValue(rows)
            : jest.fn().mockResolvedValue(rows),
      } as never;
      return prisma;
    }

    it('reads the stored legacy row by _userId and rounds scores to whole numbers', async () => {
      const prisma = profilePrisma([
        {
          _id: { $oid: '6ad23e00b91649003e4dbc4e' },
          _userId: { $oid: userId },
          overallScore: 116,
          inviteNetworkScore: 0,
          conductScore: 290,
          activityScore: { $numberDouble: '0.0516' },
          metrics: { totalReportsReceived: 1, totalPosts: 3 },
          lastCalculated: { $date: '2026-10-16T15:08:48.328Z' },
        },
      ]);

      const result = await loadUserReputation(prisma, userId);

      expect(prisma.userReputation.findRaw).toHaveBeenCalledWith({
        filter: { $or: [{ _userId: { $oid: userId } }, { userId: { $oid: userId } }] },
        options: { limit: 1 },
      });
      expect(result).toMatchObject({
        _id: '6ad23e00b91649003e4dbc4e',
        _userId: userId,
        overallScore: 116,
        conductScore: 290,
        activityScore: 0,
        lastCalculated: '2026-10-16T15:08:48.328Z',
      });
      expect(result?.metrics).toMatchObject({
        totalReportsReceived: 1,
        totalPosts: 3,
        totalInvitesSent: 0,
        totalComments: 0,
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('calculates a reputation without saving it when the user has no stored row', async () => {
      const prisma = profilePrisma([]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: userId, joined: null });
      (prisma.post.count as jest.Mock).mockResolvedValue(2);

      const result = await loadUserReputation(prisma, userId);

      expect(result).toMatchObject({ _id: userId, _userId: userId, conductScore: 310 });
      expect(result?.metrics.totalPosts).toBe(2);
      expect(Number.isInteger(result?.activityScore)).toBe(true);
      expect(new Date(result?.lastCalculated as string).getFullYear()).toBeGreaterThan(2000);
    });

    it('returns null when the user does not exist', async () => {
      const prisma = profilePrisma([]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(loadUserReputation(prisma, userId)).resolves.toBeNull();
    });

    it('returns null when the read fails', async () => {
      const prisma = profilePrisma(new Error('db down'));

      await expect(loadUserReputation(prisma, userId)).resolves.toBeNull();
    });
  });
});
