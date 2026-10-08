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
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as unknown as Pick<PrismaClient, 'user' | 'post' | 'comment' | 'vote'>;
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
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'up' },
        { type: 'up' },
        { type: 'down' },
      ]);

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
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(new Array(100).fill({ type: 'up' }));
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
        createdAt: new Date(),
      });
      (prisma.post.count as jest.Mock).mockResolvedValue(3);
      (prisma.comment.count as jest.Mock).mockResolvedValue(4);
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(new Array(5).fill({ type: 'up' }));

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
        createdAt: new Date('2020-01-01'),
      });
      (prisma.post.count as jest.Mock).mockResolvedValue(100);
      (prisma.comment.count as jest.Mock).mockResolvedValue(100);
      (prisma.vote.findMany as jest.Mock).mockResolvedValue(new Array(100).fill({ type: 'up' }));

      const result = await calculateActivityScore(prisma, 'user1');
      expect(result).toBe(200);
    });

    it('should use createdAt if joined is not available', async () => {
      const prisma = mockPrisma();
      const createdAt = new Date('2024-01-01');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user1',
        joined: null,
        createdAt,
      });

      const result = await calculateActivityScore(prisma, 'user1');
      // Should include age bonus from createdAt
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getDetailedMetrics', () => {
    it('should return all metric fields', async () => {
      const prisma = mockPrisma();
      (prisma.post.count as jest.Mock).mockResolvedValue(2);
      (prisma.comment.count as jest.Mock).mockResolvedValue(1);
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'down' },
        { type: 'up' },
      ]);

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
        createdAt: new Date(),
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
        .mockResolvedValueOnce({ id: 'u1', joined: new Date(), createdAt: new Date() }) // activity
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
});
