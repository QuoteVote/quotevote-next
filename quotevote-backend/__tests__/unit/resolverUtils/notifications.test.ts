/**
 * Test suite for notification resolver utilities.
 */

import type { PrismaClient } from '@prisma/client';
import {
  addNotification,
  hasUnreadNotification,
  NOTIFICATION_SELECT,
  toNotificationEntity,
} from '~/data/resolvers/utils/notifications';
import type { AddNotificationInput } from '~/data/resolvers/utils/notifications';

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

const created = new Date('2026-01-01T00:00:00.000Z');

function mockPrisma(blocked = false) {
  const blockLookup = jest.fn().mockResolvedValue(blocked ? { id: 'block-1' } : null);
  const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'notif-1',
    userId: data.userId,
    userIdBy: data.userIdBy,
    label: data.label,
    status: data.status,
    notificationType: data.notificationType,
    postId: data.postId ?? null,
    created,
  }));
  const prisma = {
    notification: { create },
    userBlock: { findFirst: blockLookup },
  } as unknown as Pick<PrismaClient, 'notification' | 'userBlock'>;
  return { prisma, create, blockLookup };
}

describe('notifications resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toNotificationEntity', () => {
    it('maps id to _id and null postId to undefined', () => {
      expect(
        toNotificationEntity({
          id: 'n1',
          userId: 'u1',
          userIdBy: 'u2',
          label: 'hello',
          status: 'new',
          notificationType: 'COMMENTED',
          postId: null,
          created,
        })
      ).toEqual({
        _id: 'n1',
        userId: 'u1',
        userIdBy: 'u2',
        label: 'hello',
        status: 'new',
        notificationType: 'COMMENTED',
        postId: undefined,
        created,
      });
    });
  });

  describe('addNotification', () => {
    const input: AddNotificationInput = {
      userId: 'user1',
      userIdBy: 'user2',
      notificationType: 'UPVOTED',
      label: 'Someone upvoted your post',
      postId: 'post1',
    };

    it('creates the notification through Prisma with status new', async () => {
      const { prisma, create } = mockPrisma();

      const result = await addNotification(prisma, input);

      expect(create).toHaveBeenCalledWith({
        data: {
          userId: 'user1',
          userIdBy: 'user2',
          notificationType: 'UPVOTED',
          label: 'Someone upvoted your post',
          postId: 'post1',
          status: 'new',
          created: expect.any(Date),
        },
        select: NOTIFICATION_SELECT,
      });
      expect(result).toEqual(
        expect.objectContaining({ _id: 'notif-1', userId: 'user1', postId: 'post1' })
      );
    });

    it('publishes the mapped notification via pubsub', async () => {
      const { prisma } = mockPrisma();

      await addNotification(prisma, input);

      expect(mockPublish).toHaveBeenCalledWith('NOTIFICATION_CREATED', {
        notification: expect.objectContaining({
          _id: 'notif-1',
          userId: 'user1',
          userIdBy: 'user2',
        }),
      });
    });

    it('handles a notification without postId', async () => {
      const { prisma, create } = mockPrisma();

      const result = await addNotification(prisma, {
        userId: 'user1',
        userIdBy: 'user2',
        notificationType: 'FOLLOW',
        label: 'Someone followed you',
      });

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user1', postId: undefined }),
        })
      );
      expect(result?.postId).toBeUndefined();
    });
  });

  describe('addNotification with a block (#749)', () => {
    const input: AddNotificationInput = {
      userId: 'author',
      userIdBy: 'blocked',
      notificationType: 'UPVOTED',
      label: 'x',
      postId: 'post1',
    };

    it('creates and publishes nothing while either member blocks the other', async () => {
      const { prisma, create, blockLookup } = mockPrisma(true);

      await expect(addNotification(prisma, input)).resolves.toBeNull();

      expect(blockLookup).toHaveBeenCalledWith({
        where: {
          OR: [
            { blockerId: 'author', blockedUserId: 'blocked' },
            { blockerId: 'blocked', blockedUserId: 'author' },
          ],
        },
        select: { id: true },
      });
      expect(create).not.toHaveBeenCalled();
      expect(mockPublish).not.toHaveBeenCalled();
    });
  });

  describe('hasUnreadNotification', () => {
    const input = {
      userId: 'author',
      userIdBy: 'member',
      notificationType: 'COMMENTED' as const,
      postId: 'post-1',
    };

    it('looks for one not yet cleared, of the same type, from the same member, on the same post', async () => {
      const findFirst = jest.fn().mockResolvedValue({ id: 'notif-1' });
      const prisma = { notification: { findFirst } } as unknown as Pick<
        PrismaClient,
        'notification'
      >;

      await expect(hasUnreadNotification(prisma, input)).resolves.toBe(true);
      expect(findFirst).toHaveBeenCalledWith({
        where: { ...input, status: 'new' },
        select: { id: true },
      });
    });

    it('is false when there is none', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { notification: { findFirst } } as unknown as Pick<
        PrismaClient,
        'notification'
      >;

      await expect(hasUnreadNotification(prisma, input)).resolves.toBe(false);
    });
  });
});
