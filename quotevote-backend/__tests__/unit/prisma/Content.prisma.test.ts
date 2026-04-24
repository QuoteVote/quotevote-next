import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockContent: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockContent = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ content: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Content Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'cnt1',
    title: 'Test Content',
    creatorId: 'creator1',
    domainId: 'domain1',
    url: 'https://example.com',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create content', async () => {
      mockContent.create.mockResolvedValue(mockRecord);

      const result = await prisma.content.create({
        data: { title: 'Test Content', creatorId: 'creator1' },
      });

      expect(result.title).toBe('Test Content');
      expect(result.creatorId).toBe('creator1');
    });
  });

  describe('Read', () => {
    it('should find content by domainId', async () => {
      mockContent.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.content.findMany({ where: { domainId: 'domain1' } });

      expect(result).toHaveLength(1);
    });

    it('should find content by id', async () => {
      mockContent.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.content.findUnique({ where: { id: 'cnt1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update content title', async () => {
      const updated = { ...mockRecord, title: 'Updated Title' };
      mockContent.update.mockResolvedValue(updated);

      const result = await prisma.content.update({
        where: { id: 'cnt1' },
        data: { title: 'Updated Title' },
      });

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('Delete', () => {
    it('should delete content', async () => {
      mockContent.delete.mockResolvedValue(mockRecord);

      const result = await prisma.content.delete({ where: { id: 'cnt1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
