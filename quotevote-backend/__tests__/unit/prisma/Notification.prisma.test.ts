import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockNotification: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockNotification = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ notification: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Notification Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'notif1',
    userId: 'user1',
    userIdBy: 'user2',
    label: 'New vote on your post',
    status: 'new',
    notificationType: 'UPVOTED',
    postId: 'post1',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a notification', async () => {
      mockNotification.create.mockResolvedValue(mockRecord);

      const result = await prisma.notification.create({
        data: {
          userId: 'user1',
          userIdBy: 'user2',
          label: 'New vote on your post',
          notificationType: 'UPVOTED',
          postId: 'post1',
        },
      });

      expect(result.notificationType).toBe('UPVOTED');
      expect(result.status).toBe('new');
    });
  });

  describe('Read', () => {
    it('should find notifications by userId', async () => {
      mockNotification.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.notification.findMany({ where: { userId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find notification by id', async () => {
      mockNotification.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.notification.findUnique({ where: { id: 'notif1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update notification status to read', async () => {
      const updated = { ...mockRecord, status: 'read' };
      mockNotification.update.mockResolvedValue(updated);

      const result = await prisma.notification.update({
        where: { id: 'notif1' },
        data: { status: 'read' },
      });

      expect(result.status).toBe('read');
    });
  });

  describe('Delete', () => {
    it('should delete a notification', async () => {
      mockNotification.delete.mockResolvedValue(mockRecord);

      const result = await prisma.notification.delete({ where: { id: 'notif1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
