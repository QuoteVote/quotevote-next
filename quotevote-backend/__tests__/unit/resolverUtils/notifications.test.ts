/**
 * Test suite for notification resolver utilities.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import { addNotification } from '~/data/resolvers/utils/notifications';
import type { AddNotificationInput } from '~/data/resolvers/utils/notifications';

// Mock Notification model
const mockSave = jest.fn();
jest.mock('~/data/models/Notification', () => {
  return jest.fn().mockImplementation((data: Record<string, unknown>) => {
    const doc: Record<string, unknown> = { ...data, _id: 'notif-1' };
    mockSave.mockResolvedValue(doc);
    doc.save = mockSave;
    return doc;
  });
});

// Mock pubsub
const mockPublish = jest.fn().mockResolvedValue(undefined);
jest.mock('~/data/utils/pubsub', () => ({
  pubsub: {
    publish: (...args: unknown[]) => mockPublish(...args),
  },
}));

jest.mock('~/data/utils/constants', () => ({
  NOTIFICATION_CREATED: 'NOTIFICATION_CREATED',
}));

describe('notifications resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addNotification', () => {
    const input: AddNotificationInput = {
      userId: 'user1',
      userIdBy: 'user2',
      notificationType: 'UPVOTED',
      label: 'Someone upvoted your post',
      postId: 'post1',
    };

    it('should create and save a notification', async () => {
      const result = await addNotification(input);

      const Notification = require('~/data/models/Notification');
      expect(Notification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          userIdBy: 'user2',
          notificationType: 'UPVOTED',
          label: 'Someone upvoted your post',
          postId: 'post1',
          status: 'new',
          created: expect.any(Date),
        })
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should publish notification via pubsub', async () => {
      await addNotification(input);

      expect(mockPublish).toHaveBeenCalledWith('NOTIFICATION_CREATED', {
        notification: expect.objectContaining({
          userId: 'user1',
          userIdBy: 'user2',
        }),
      });
    });

    it('should handle notification without postId', async () => {
      const inputWithoutPost: AddNotificationInput = {
        userId: 'user1',
        userIdBy: 'user2',
        notificationType: 'FOLLOW',
        label: 'Someone followed you',
      };

      await addNotification(inputWithoutPost);

      const Notification = require('~/data/models/Notification');
      expect(Notification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user1',
          postId: undefined,
        })
      );
    });
  });
});
