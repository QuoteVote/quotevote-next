import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockTag: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockTag = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ tag: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Tag Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'grp1',
    creatorId: 'user1',
    adminIds: ['user1'],
    allowedUserIds: [],
    privacy: 'public',
    title: 'Test Tag',
    url: null,
    description: 'A test Tag',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a Tag with privacy enum', async () => {
      mockTag.create.mockResolvedValue(mockRecord);

      const result = await prisma.tag.create({
        data: { creatorId: 'user1', title: 'Test Tag', privacy: 'public' },
      });

      expect(result.privacy).toBe('public');
      expect(result.title).toBe('Test Tag');
    });

    it('should create a restricted Tag', async () => {
      const restricted = { ...mockRecord, privacy: 'restricted' };
      mockTag.create.mockResolvedValue(restricted);

      const result = await prisma.tag.create({
        data: { creatorId: 'user1', title: 'Private Tag', privacy: 'restricted' },
      });

      expect(result.privacy).toBe('restricted');
    });
  });

  describe('Read', () => {
    it('should find Tags by creatorId', async () => {
      mockTag.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.tag.findMany({ where: { creatorId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find Tag by id', async () => {
      mockTag.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.tag.findUnique({ where: { id: 'grp1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update Tag title', async () => {
      const updated = { ...mockRecord, title: 'Updated Tag' };
      mockTag.update.mockResolvedValue(updated);

      const result = await prisma.tag.update({
        where: { id: 'grp1' },
        data: { title: 'Updated Tag' },
      });

      expect(result.title).toBe('Updated Tag');
    });
  });

  describe('Delete', () => {
    it('should delete a Tag', async () => {
      mockTag.delete.mockResolvedValue(mockRecord);

      const result = await prisma.tag.delete({ where: { id: 'grp1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
