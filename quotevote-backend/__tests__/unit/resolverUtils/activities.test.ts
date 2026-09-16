/**
 * Test suite for activity logging resolver utility.
 */

import { logActivity } from '~/data/resolvers/utils/activities';
import type { ActivityIds } from '~/data/resolvers/utils/activities';
import type { PrismaClient } from '@prisma/client';

const mockActivityCreate = jest.fn().mockResolvedValue(undefined);
const mockPrisma = {
  activity: { create: mockActivityCreate },
} as unknown as PrismaClient;

// Mock the logger
jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('activities resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logActivity', () => {
    it('creates a new activity through Prisma', async () => {
      const ids: ActivityIds = { userId: 'user1', postId: 'post1' };
      await logActivity('POSTED', ids, 'Test content', mockPrisma);

      expect(mockActivityCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          activityType: 'POSTED',
          userId: 'user1',
          postId: 'post1',
          content: 'Test content',
          created: expect.any(Date),
        }),
      });
    });

    it('should handle activity without content', async () => {
      const ids: ActivityIds = { userId: 'user1', voteId: 'vote1' };
      await logActivity('VOTED', ids, undefined, mockPrisma);

      expect(mockActivityCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          activityType: 'VOTED',
          userId: 'user1',
          voteId: 'vote1',
          content: undefined,
        }),
      });
    });

    it('should handle activity with all optional ids', async () => {
      const ids: ActivityIds = {
        userId: 'user1',
        postId: 'post1',
        voteId: 'vote1',
        commentId: 'comment1',
        quoteId: 'quote1',
      };
      await logActivity('COMMENTED', ids, 'A comment', mockPrisma);

      expect(mockActivityCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          activityType: 'COMMENTED',
          userId: 'user1',
          postId: 'post1',
          voteId: 'vote1',
          commentId: 'comment1',
          quoteId: 'quote1',
          content: 'A comment',
        }),
      });
    });
  });
});
