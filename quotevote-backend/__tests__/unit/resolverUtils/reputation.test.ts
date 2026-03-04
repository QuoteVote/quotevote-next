/**
 * Test suite for reputation resolver utilities.
 */

import User from '~/data/models/User';
import Post from '~/data/models/Post';
import Comment from '~/data/models/Comment';
import Vote from '~/data/models/Vote';
import {
  calculateUserReputation,
  calculateInviteNetworkScore,
  calculateConductScore,
  calculateActivityScore,
  getDetailedMetrics,
  recalculateAllReputations,
} from '~/data/resolvers/utils/reputation';

jest.mock('~/data/models/User', () => ({
  findById: jest.fn(),
  find: jest.fn(),
}));

jest.mock('~/data/models/Post', () => ({
  find: jest.fn(),
}));

jest.mock('~/data/models/Comment', () => ({
  find: jest.fn(),
}));

jest.mock('~/data/models/Vote', () => ({
  find: jest.fn(),
}));

jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

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
      (Vote.find as jest.Mock).mockResolvedValue([]);
      (Post.find as jest.Mock).mockResolvedValue([]);
      (Comment.find as jest.Mock).mockResolvedValue([]);

      const result = await calculateConductScore('user1');
      expect(result).toBe(300);
    });

    it('should increase score for more upvotes than downvotes', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'up' },
        { type: 'up' },
        { type: 'down' },
      ]);
      (Post.find as jest.Mock).mockResolvedValue([]);
      (Comment.find as jest.Mock).mockResolvedValue([]);

      const result = await calculateConductScore('user1');
      // 300 + min((3-1)*2, 100) = 300 + 4 = 304
      expect(result).toBe(304);
    });

    it('should add bonuses for posts and comments', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([]);
      (Post.find as jest.Mock).mockResolvedValue(new Array(5).fill({}));
      (Comment.find as jest.Mock).mockResolvedValue(new Array(10).fill({}));

      const result = await calculateConductScore('user1');
      // 300 + min(5*5, 50) + min(10*2, 50) = 300 + 25 + 20 = 345
      expect(result).toBe(345);
    });

    it('should cap posts and comments bonuses', async () => {
      (Vote.find as jest.Mock).mockResolvedValue([]);
      (Post.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));
      (Comment.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));

      const result = await calculateConductScore('user1');
      // 300 + 50 + 50 = 400
      expect(result).toBe(400);
    });

    it('should cap total conduct score at 500', async () => {
      // Create a scenario that would exceed 500
      (Vote.find as jest.Mock).mockResolvedValue(
        new Array(100).fill({ type: 'up' })
      );
      (Post.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));
      (Comment.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));

      const result = await calculateConductScore('user1');
      expect(result).toBeLessThanOrEqual(500);
    });
  });

  describe('calculateActivityScore', () => {
    it('should return 0 if user is not found', async () => {
      (User.findById as jest.Mock).mockResolvedValue(null);

      const result = await calculateActivityScore('user1');
      expect(result).toBe(0);
    });

    it('should calculate activity from posts, comments, and votes', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user1',
        joined: new Date().toISOString(),
      });
      (Post.find as jest.Mock).mockResolvedValue(new Array(3).fill({}));
      (Comment.find as jest.Mock).mockResolvedValue(new Array(4).fill({}));
      (Vote.find as jest.Mock).mockResolvedValue(new Array(5).fill({}));

      const result = await calculateActivityScore('user1');
      // min(3*10, 100) + min(4*5, 50) + min(5*2, 50) + age bonus
      // 30 + 20 + 10 + ~0 = 60 + age
      expect(result).toBeGreaterThanOrEqual(60);
    });

    it('should cap score at 200', async () => {
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user1',
        joined: new Date('2020-01-01').toISOString(),
      });
      (Post.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));
      (Comment.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));
      (Vote.find as jest.Mock).mockResolvedValue(new Array(100).fill({}));

      const result = await calculateActivityScore('user1');
      expect(result).toBe(200);
    });

    it('should use createdAt if joined is not available', async () => {
      const createdAt = new Date('2024-01-01');
      (User.findById as jest.Mock).mockResolvedValue({
        _id: 'user1',
        createdAt,
      });
      (Post.find as jest.Mock).mockResolvedValue([]);
      (Comment.find as jest.Mock).mockResolvedValue([]);
      (Vote.find as jest.Mock).mockResolvedValue([]);

      const result = await calculateActivityScore('user1');
      // Should include age bonus from createdAt
      expect(result).toBeGreaterThan(0);
    });
  });

  describe('getDetailedMetrics', () => {
    it('should return all metric fields', async () => {
      (Post.find as jest.Mock).mockResolvedValue([{}, {}]);
      (Comment.find as jest.Mock).mockResolvedValue([{}]);
      (Vote.find as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'down' },
        { type: 'up' },
      ]);

      const result = await getDetailedMetrics('user1');

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
      (User.findById as jest.Mock).mockResolvedValue(null);

      await expect(calculateUserReputation('nonexistent')).rejects.toThrow(
        'User not found'
      );
    });

    it('should calculate overall reputation for a valid user', async () => {
      (User.findById as jest.Mock).mockResolvedValue({ _id: 'user1' });
      (Vote.find as jest.Mock).mockResolvedValue([]);
      (Post.find as jest.Mock).mockResolvedValue([]);
      (Comment.find as jest.Mock).mockResolvedValue([]);

      const result = await calculateUserReputation('user1');

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
      (User.findById as jest.Mock).mockRejectedValue('some string error');

      await expect(calculateUserReputation('user1')).rejects.toThrow('some string error');
    });
  });

  describe('recalculateAllReputations', () => {
    it('should return results for all users', async () => {
      (User.find as jest.Mock).mockResolvedValue([
        { _id: { toString: () => 'u1' } },
        { _id: { toString: () => 'u2' } },
      ]);

      // For each calculateUserReputation call:
      // First user succeeds, second fails
      (User.findById as jest.Mock)
        .mockResolvedValueOnce({ _id: 'u1' })  // calculateUserReputation('u1') → user check
        .mockResolvedValueOnce({ _id: 'u1' })  // calculateActivityScore('u1')
        .mockResolvedValueOnce(null);           // calculateUserReputation('u2') → not found

      (Vote.find as jest.Mock).mockResolvedValue([]);
      (Post.find as jest.Mock).mockResolvedValue([]);
      (Comment.find as jest.Mock).mockResolvedValue([]);

      const results = await recalculateAllReputations();

      expect(results).toHaveLength(2);
      expect(results[0].userId).toBe('u1');
      expect(results[0].success).toBe(true);
      expect(results[1].userId).toBe('u2');
      expect(results[1].success).toBe(false);
    });

    it('should handle empty user list', async () => {
      (User.find as jest.Mock).mockResolvedValue([]);

      const results = await recalculateAllReputations();
      expect(results).toEqual([]);
    });
  });
});
