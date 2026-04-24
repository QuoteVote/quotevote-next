import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockActivity: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockActivity = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ activity: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Activity Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'act1',
    userId: 'user1',
    postId: 'post1',
    activityType: 'POSTED',
    content: 'Created a post',
    voteId: null,
    commentId: null,
    quoteId: null,
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create an activity', async () => {
      mockActivity.create.mockResolvedValue(mockRecord);

      const result = await prisma.activity.create({
        data: { userId: 'user1', postId: 'post1', activityType: 'POSTED', content: 'Created a post' },
      });

      expect(result.activityType).toBe('POSTED');
      expect(mockActivity.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('Read', () => {
    it('should find activities by userId', async () => {
      mockActivity.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.activity.findMany({ where: { userId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find activity by id', async () => {
      mockActivity.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.activity.findUnique({ where: { id: 'act1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update activity content', async () => {
      const updated = { ...mockRecord, content: 'Updated content' };
      mockActivity.update.mockResolvedValue(updated);

      const result = await prisma.activity.update({
        where: { id: 'act1' },
        data: { content: 'Updated content' },
      });

      expect(result.content).toBe('Updated content');
    });
  });

  describe('Delete', () => {
    it('should delete an activity', async () => {
      mockActivity.delete.mockResolvedValue(mockRecord);

      const result = await prisma.activity.delete({ where: { id: 'act1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
