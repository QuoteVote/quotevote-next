import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockCollection: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockCollection = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ collection: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Collection Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'col1',
    userId: 'user1',
    name: 'My Collection',
    description: 'A test collection',
    postIds: ['post1', 'post2'],
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a collection', async () => {
      mockCollection.create.mockResolvedValue(mockRecord);

      const result = await prisma.collection.create({
        data: { userId: 'user1', name: 'My Collection', description: 'A test collection' },
      });

      expect(result.name).toBe('My Collection');
      expect(result.userId).toBe('user1');
    });
  });

  describe('Read', () => {
    it('should find collections by userId', async () => {
      mockCollection.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.collection.findMany({ where: { userId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find collection by id', async () => {
      mockCollection.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.collection.findUnique({ where: { id: 'col1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update postIds array', async () => {
      const updated = { ...mockRecord, postIds: ['post1', 'post2', 'post3'] };
      mockCollection.update.mockResolvedValue(updated);

      const result = await prisma.collection.update({
        where: { id: 'col1' },
        data: { postIds: ['post1', 'post2', 'post3'] },
      });

      expect(result.postIds).toHaveLength(3);
    });
  });

  describe('Delete', () => {
    it('should delete a collection', async () => {
      mockCollection.delete.mockResolvedValue(mockRecord);

      const result = await prisma.collection.delete({ where: { id: 'col1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
