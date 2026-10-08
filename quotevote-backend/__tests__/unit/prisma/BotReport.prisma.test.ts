import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockBotReport: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockBotReport = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ botReport: model })),
    Prisma: {
      PrismaClientKnownRequestError: class extends Error {
        code: string;
        constructor(message: string, { code }: { code: string }) {
          super(message);
          this.code = code;
        }
      },
    },
  };
});

import { PrismaClient, Prisma } from '@prisma/client';

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

    it('should throw P2002 when duplicate reporterId and userId are provided', async () => {
      mockBotReport.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '6.19.2',
        })
      );

      await expect(
        prisma.botReport.create({
          data: { userId: 'user1', reporterId: 'reporter1' },
        })
      ).rejects.toMatchObject({ code: 'P2002' });
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

    it('should read legacy records without created or updatedAt timestamps without P2032 errors', async () => {
      const legacyRecord = {
        id: 'legacy_br_1',
        userId: 'user1',
        reporterId: 'reporter1',
        createdAt: new Date('2024-01-01'),
        created: null,
        updatedAt: null,
      };

      mockBotReport.findUnique.mockResolvedValue(legacyRecord);

      const result = await prisma.botReport.findUnique({ where: { id: 'legacy_br_1' } });

      expect(result).toEqual(legacyRecord);
      expect(result?.created).toBeNull();
      expect(result?.updatedAt).toBeNull();
      expect(result?.createdAt).toEqual(legacyRecord.createdAt);
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
