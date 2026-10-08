import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockUserReport: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockUserReport = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ userReport: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma UserReport Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'ur1',
    reportedUserId: 'user2',
    reporterId: 'user1',
    reason: 'spam',
    description: 'Spam report',
    status: 'pending',
    severity: 'medium',
    adminNotes: null,
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a user report', async () => {
      mockUserReport.create.mockResolvedValue(mockRecord);

      const result = await prisma.userReport.create({
        data: {
          reporterId: 'user1',
          reportedUserId: 'user2',
          reason: 'spam',
        },
      });

      expect(result.reporterId).toBe('user1');
      expect(result.reportedUserId).toBe('user2');
      expect(result.reason).toBe('spam');
    });
  });

  describe('Read', () => {
    it('should find reports by reportedUserId', async () => {
      mockUserReport.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.userReport.findMany({ where: { reportedUserId: 'user2' } });

      expect(result).toHaveLength(1);
    });

    it('should read legacy records without created or updatedAt timestamps', async () => {
      const legacyRecord = {
        ...mockRecord,
        id: 'legacy_ur_1',
        created: null,
        updatedAt: null,
      };

      mockUserReport.findUnique.mockResolvedValue(legacyRecord);

      const result = await prisma.userReport.findUnique({ where: { id: 'legacy_ur_1' } });

      expect(result).toEqual(legacyRecord);
      expect(result?.created).toBeNull();
      expect(result?.updatedAt).toBeNull();
    });
  });

  describe('Delete', () => {
    it('should delete a user report', async () => {
      mockUserReport.delete.mockResolvedValue(mockRecord);

      const result = await prisma.userReport.delete({ where: { id: 'ur1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
