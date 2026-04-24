import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockBotReport: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockBotReport = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ botReport: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma BotReport Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'br1',
    userId: 'user1',
    reporterId: 'reporter1',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a bot report', async () => {
      mockBotReport.create.mockResolvedValue(mockRecord);

      const result = await prisma.botReport.create({
        data: { userId: 'user1', reporterId: 'reporter1' },
      });

      expect(result.userId).toBe('user1');
      expect(result.reporterId).toBe('reporter1');
    });
  });

  describe('Read', () => {
    it('should find reports by userId', async () => {
      mockBotReport.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.botReport.findMany({ where: { userId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find report by id', async () => {
      mockBotReport.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.botReport.findUnique({ where: { id: 'br1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Delete', () => {
    it('should delete a bot report', async () => {
      mockBotReport.delete.mockResolvedValue(mockRecord);

      const result = await prisma.botReport.delete({ where: { id: 'br1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
