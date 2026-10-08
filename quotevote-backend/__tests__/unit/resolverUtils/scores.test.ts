/**
 * Test suite for score resolver utilities.
 */

import type { PrismaClient } from '@prisma/client';
import {
  scoreUtil,
  voteTypeUtil,
  upvotes,
  downvotes,
  topUsers,
} from '~/data/resolvers/utils/scores';

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
    vote: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  } as unknown as Pick<PrismaClient, 'vote' | 'user'>;
}

describe('scores resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scoreUtil', () => {
    it('should calculate net score from mixed votes', async () => {
      const prisma = mockPrisma();
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([
        { type: 'up' },
        { type: 'up' },
        { type: 'down' },
      ]);

      const result = await scoreUtil(prisma, { user_id: 'user1' });
      expect(result).toBe(1); // 2 ups (+2) - 1 down (-1) = 1
      expect(prisma.vote.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        select: { type: true },
      });
    });

    it('should return 0 for no votes', async () => {
      const prisma = mockPrisma();

      const result = await scoreUtil(prisma, {});
      expect(result).toBe(0);
    });

    it('should return 0 without querying for legacy song_id / artist_id filters', async () => {
      const prisma = mockPrisma();

      const result = await scoreUtil(prisma, { song_id: 'song1', artist_id: 'artist1' });
      expect(result).toBe(0);
      expect(prisma.vote.findMany).not.toHaveBeenCalled();
    });
  });

  describe('voteTypeUtil', () => {
    it('should filter by upvotes when vote_type is true', async () => {
      const prisma = mockPrisma();
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([{ type: 'up' }, { type: 'up' }]);

      const result = await voteTypeUtil(prisma, { vote_type: true });
      expect(result).toBe(2);
      expect(prisma.vote.findMany).toHaveBeenCalledWith({
        where: { type: 'up' },
        select: { type: true },
      });
    });

    it('should filter by downvotes when vote_type is false', async () => {
      const prisma = mockPrisma();
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([{ type: 'down' }]);

      const result = await voteTypeUtil(prisma, { vote_type: false });
      expect(result).toBe(-1);
      expect(prisma.vote.findMany).toHaveBeenCalledWith({
        where: { type: 'down' },
        select: { type: true },
      });
    });
  });

  describe('upvotes', () => {
    it('should count upvotes matching the filter', async () => {
      const prisma = mockPrisma();
      (prisma.vote.count as jest.Mock).mockResolvedValue(2);

      const result = await upvotes(prisma, { user_id: 'user1' });
      expect(result).toBe(2);
      expect(prisma.vote.count).toHaveBeenCalledWith({
        where: { userId: 'user1', type: 'up' },
      });
    });

    it('should return 0 for no upvotes', async () => {
      const prisma = mockPrisma();

      const result = await upvotes(prisma, {});
      expect(result).toBe(0);
    });

    it('should return 0 without querying for legacy song_id filters', async () => {
      const prisma = mockPrisma();

      const result = await upvotes(prisma, { song_id: 'song1' });
      expect(result).toBe(0);
      expect(prisma.vote.count).not.toHaveBeenCalled();
    });
  });

  describe('downvotes', () => {
    it('should count downvotes matching the filter', async () => {
      const prisma = mockPrisma();
      (prisma.vote.count as jest.Mock).mockResolvedValue(1);

      const result = await downvotes(prisma, { user_id: 'user1' });
      expect(result).toBe(1);
      expect(prisma.vote.count).toHaveBeenCalledWith({
        where: { userId: 'user1', type: 'down' },
      });
    });
  });

  describe('topUsers', () => {
    it('should return top users sorted by net vote score', async () => {
      const prisma = mockPrisma();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: 'u1', username: 'alice' },
        { id: 'u2', username: 'bob' },
        { id: 'u3', username: 'charlie' },
      ]);

      (prisma.vote.findMany as jest.Mock)
        .mockResolvedValueOnce([{ type: 'up' }, { type: 'up' }]) // u1: +2
        .mockResolvedValueOnce([{ type: 'down' }]) // u2: -1
        .mockResolvedValueOnce([{ type: 'up' }, { type: 'up' }, { type: 'up' }]); // u3: +3

      const result = await topUsers(prisma, 2);

      expect(result).toHaveLength(2);
      expect(result[0].user).toBe('charlie'); // score 3
      expect(result[1].user).toBe('alice'); // score 2
    });

    it('should show "unknown" for users without a username', async () => {
      const prisma = mockPrisma();
      (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 'u1', username: null }]);
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

      const result = await topUsers(prisma, 10);
      expect(result[0].user).toBe('unknown');
    });
  });
});
