/**
 * Test suite for activity logging resolver utility.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { logActivity } from '~/data/resolvers/utils/activities';
import type { ActivityIds } from '~/data/resolvers/utils/activities';

// Mock the Activity model
const mockSave = jest.fn().mockResolvedValue(undefined);
jest.mock('~/data/models/Activity', () => {
  return jest.fn().mockImplementation((data: Record<string, unknown>) => ({
    ...data,
    save: mockSave,
  }));
});

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
    it('should create and save a new activity', async () => {
      const ids: ActivityIds = { userId: 'user1', postId: 'post1' };
      await logActivity('POSTED', ids, 'Test content');

      const Activity = require('~/data/models/Activity');
      expect(Activity).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'POSTED',
          userId: 'user1',
          postId: 'post1',
          content: 'Test content',
          created: expect.any(Date),
        })
      );
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle activity without content', async () => {
      const ids: ActivityIds = { userId: 'user1', voteId: 'vote1' };
      await logActivity('VOTED', ids);

      const Activity = require('~/data/models/Activity');
      expect(Activity).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'VOTED',
          userId: 'user1',
          voteId: 'vote1',
          content: undefined,
        })
      );
      expect(mockSave).toHaveBeenCalled();
    });

    it('should handle activity with all optional ids', async () => {
      const ids: ActivityIds = {
        userId: 'user1',
        postId: 'post1',
        voteId: 'vote1',
        commentId: 'comment1',
        quoteId: 'quote1',
      };
      await logActivity('COMMENTED', ids, 'A comment');

      const Activity = require('~/data/models/Activity');
      expect(Activity).toHaveBeenCalledWith(
        expect.objectContaining({
          activityType: 'COMMENTED',
          userId: 'user1',
          postId: 'post1',
          voteId: 'vote1',
          commentId: 'comment1',
          quoteId: 'quote1',
          content: 'A comment',
        })
      );
    });
  });
});
