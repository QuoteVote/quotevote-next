import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockGroup: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockGroup = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ group: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Group Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'grp1',
    creatorId: 'user1',
    adminIds: ['user1'],
    allowedUserIds: [],
    privacy: 'public',
    title: 'Test Group',
    url: null,
    description: 'A test group',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a group with privacy enum', async () => {
      mockGroup.create.mockResolvedValue(mockRecord);

      const result = await prisma.group.create({
        data: { creatorId: 'user1', title: 'Test Group', privacy: 'public' },
      });

      expect(result.privacy).toBe('public');
      expect(result.title).toBe('Test Group');
    });

    it('should create a restricted group', async () => {
      const restricted = { ...mockRecord, privacy: 'restricted' };
      mockGroup.create.mockResolvedValue(restricted);

      const result = await prisma.group.create({
        data: { creatorId: 'user1', title: 'Private Group', privacy: 'restricted' },
      });

      expect(result.privacy).toBe('restricted');
    });
  });

  describe('Read', () => {
    it('should find groups by creatorId', async () => {
      mockGroup.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.group.findMany({ where: { creatorId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find group by id', async () => {
      mockGroup.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.group.findUnique({ where: { id: 'grp1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update group title', async () => {
      const updated = { ...mockRecord, title: 'Updated Group' };
      mockGroup.update.mockResolvedValue(updated);

      const result = await prisma.group.update({
        where: { id: 'grp1' },
        data: { title: 'Updated Group' },
      });

      expect(result.title).toBe('Updated Group');
    });
  });

  describe('Delete', () => {
    it('should delete a group', async () => {
      mockGroup.delete.mockResolvedValue(mockRecord);

      const result = await prisma.group.delete({ where: { id: 'grp1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
