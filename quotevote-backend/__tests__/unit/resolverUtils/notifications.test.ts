/**
 * Test suite for notification resolver utilities.
 */

import { addNotification } from '~/data/resolvers/utils/notifications';
import type { AddNotificationInput } from '~/data/resolvers/utils/notifications';
import type { PrismaClient } from '@prisma/client';

const mockNotificationCreate = jest.fn();
const mockPrisma = {
  notification: { create: mockNotificationCreate },
} as unknown as PrismaClient;

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
    mockNotificationCreate.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'notif-1',
        ...data,
        postId: data.postId ?? null,
        createdAt: data.created,
        updatedAt: data.created,
      })
    );
  });

  describe('addNotification', () => {
    const input: AddNotificationInput = {
      userId: 'user1',
      userIdBy: 'user2',
      notificationType: 'UPVOTED',
      label: 'Someone upvoted your post',
      postId: 'post1',
    };

    it('creates a notification through Prisma', async () => {
      const result = await addNotification(input, mockPrisma);

      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          userIdBy: 'user2',
          notificationType: 'UPVOTED',
          label: 'Someone upvoted your post',
          postId: 'post1',
          status: 'new',
          created: expect.any(Date),
        }),
      });
      expect(result).toMatchObject({ _id: 'notif-1', userId: 'user1' });
    });

    it('should publish notification via pubsub', async () => {
      await addNotification(input, mockPrisma);

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

      await addNotification(inputWithoutPost, mockPrisma);

      expect(mockNotificationCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user1',
          postId: undefined,
        }),
      });
    });
  });
});
