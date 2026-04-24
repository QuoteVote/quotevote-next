import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockCreator: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockCreator = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ creator: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Creator Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'cr1',
    name: 'John Doe',
    avatar: 'avatar.png',
    bio: 'A content creator',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a creator', async () => {
      mockCreator.create.mockResolvedValue(mockRecord);

      const result = await prisma.creator.create({
        data: { name: 'John Doe', bio: 'A content creator' },
      });

      expect(result.name).toBe('John Doe');
    });
  });

  describe('Read', () => {
    it('should find creator by name', async () => {
      mockCreator.findFirst.mockResolvedValue(mockRecord);

      const result = await prisma.creator.findFirst({ where: { name: 'John Doe' } });

      expect(result?.name).toBe('John Doe');
    });

    it('should find creator by id', async () => {
      mockCreator.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.creator.findUnique({ where: { id: 'cr1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update creator bio', async () => {
      const updated = { ...mockRecord, bio: 'Updated bio' };
      mockCreator.update.mockResolvedValue(updated);

      const result = await prisma.creator.update({
        where: { id: 'cr1' },
        data: { bio: 'Updated bio' },
      });

      expect(result.bio).toBe('Updated bio');
    });
  });

  describe('Delete', () => {
    it('should delete a creator', async () => {
      mockCreator.delete.mockResolvedValue(mockRecord);

      const result = await prisma.creator.delete({ where: { id: 'cr1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
