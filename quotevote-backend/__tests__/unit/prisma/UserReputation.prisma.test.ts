import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockUserReputation: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockUserReputation = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ userReputation: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma UserReputation Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'rep1',
    userId: 'user1',
    overallScore: 75.5,
    inviteNetworkScore: 80.0,
    conductScore: 90.0,
    activityScore: 60.0,
    metrics: {
      totalInvitesSent: 10,
      totalInvitesAccepted: 8,
      totalInvitesDeclined: 2,
      averageInviteeReputation: 70.0,
      totalReportsReceived: 0,
      totalReportsResolved: 0,
      totalUpvotes: 50,
      totalDownvotes: 5,
      totalPosts: 20,
      totalComments: 30,
    },
    lastCalculated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a reputation record with metrics', async () => {
      mockUserReputation.create.mockResolvedValue(mockRecord);

      const result = await prisma.userReputation.create({
        data: {
          userId: 'user1',
          overallScore: 75.5,
          metrics: {
            totalInvitesSent: 10,
            totalInvitesAccepted: 8,
            totalInvitesDeclined: 2,
            averageInviteeReputation: 70.0,
            totalReportsReceived: 0,
            totalReportsResolved: 0,
            totalUpvotes: 50,
            totalDownvotes: 5,
            totalPosts: 20,
            totalComments: 30,
          },
        },
      });

      expect(result.overallScore).toBe(75.5);
      expect(result.metrics.totalUpvotes).toBe(50);
    });
  });

  describe('Read', () => {
    it('should find reputation by unique userId', async () => {
      mockUserReputation.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.userReputation.findUnique({ where: { userId: 'user1' } });

      expect(result?.userId).toBe('user1');
      expect(result?.metrics.totalPosts).toBe(20);
    });

    it('should find reputation by id', async () => {
      mockUserReputation.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.userReputation.findUnique({ where: { id: 'rep1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update reputation scores', async () => {
      const updated = { ...mockRecord, overallScore: 85.0, activityScore: 75.0 };
      mockUserReputation.update.mockResolvedValue(updated);

      const result = await prisma.userReputation.update({
        where: { userId: 'user1' },
        data: { overallScore: 85.0, activityScore: 75.0 },
      });

      expect(result.overallScore).toBe(85.0);
      expect(result.activityScore).toBe(75.0);
    });

    it('should upsert reputation', async () => {
      mockUserReputation.upsert.mockResolvedValue(mockRecord);

      const result = await prisma.userReputation.upsert({
        where: { userId: 'user1' },
        create: { userId: 'user1', overallScore: 0, metrics: mockRecord.metrics },
        update: { overallScore: 75.5 },
      });

      expect(result.userId).toBe('user1');
    });
  });

  describe('Delete', () => {
    it('should delete a reputation record', async () => {
      mockUserReputation.delete.mockResolvedValue(mockRecord);

      const result = await prisma.userReputation.delete({ where: { id: 'rep1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
