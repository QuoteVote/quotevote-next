import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockDomain: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockDomain = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ domain: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma Domain Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'dom1',
    key: 'example.com',
    name: 'Example',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a domain with unique key', async () => {
      mockDomain.create.mockResolvedValue(mockRecord);

      const result = await prisma.domain.create({
        data: { key: 'example.com', name: 'Example' },
      });

      expect(result.key).toBe('example.com');
    });
  });

  describe('Read', () => {
    it('should find domain by unique key', async () => {
      mockDomain.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.domain.findUnique({ where: { key: 'example.com' } });

      expect(result?.key).toBe('example.com');
    });

    it('should find domain by id', async () => {
      mockDomain.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.domain.findUnique({ where: { id: 'dom1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update domain name', async () => {
      const updated = { ...mockRecord, name: 'Updated Example' };
      mockDomain.update.mockResolvedValue(updated);

      const result = await prisma.domain.update({
        where: { id: 'dom1' },
        data: { name: 'Updated Example' },
      });

      expect(result.name).toBe('Updated Example');
    });
  });

  describe('Delete', () => {
    it('should delete a domain', async () => {
      mockDomain.delete.mockResolvedValue(mockRecord);

      const result = await prisma.domain.delete({ where: { id: 'dom1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
