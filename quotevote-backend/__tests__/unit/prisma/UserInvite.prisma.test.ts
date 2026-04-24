import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockUserInvite: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockUserInvite = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ userInvite: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma UserInvite Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'inv1',
    email: 'invite@example.com',
    invitedById: 'user1',
    code: 'ABC123',
    status: 'pending',
    created: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create an invite', async () => {
      mockUserInvite.create.mockResolvedValue(mockRecord);

      const result = await prisma.userInvite.create({
        data: { email: 'invite@example.com', invitedById: 'user1', code: 'ABC123' },
      });

      expect(result.email).toBe('invite@example.com');
      expect(result.status).toBe('pending');
    });
  });

  describe('Read', () => {
    it('should find invite by code', async () => {
      mockUserInvite.findFirst.mockResolvedValue(mockRecord);

      const result = await prisma.userInvite.findFirst({ where: { code: 'ABC123' } });

      expect(result?.code).toBe('ABC123');
    });

    it('should find invites by email', async () => {
      mockUserInvite.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.userInvite.findMany({ where: { email: 'invite@example.com' } });

      expect(result).toHaveLength(1);
    });
  });

  describe('Update', () => {
    it('should update invite status to accepted', async () => {
      const updated = { ...mockRecord, status: 'accepted' };
      mockUserInvite.update.mockResolvedValue(updated);

      const result = await prisma.userInvite.update({
        where: { id: 'inv1' },
        data: { status: 'accepted' },
      });

      expect(result.status).toBe('accepted');
    });
  });

  describe('Delete', () => {
    it('should delete an invite', async () => {
      mockUserInvite.delete.mockResolvedValue(mockRecord);

      const result = await prisma.userInvite.delete({ where: { id: 'inv1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
