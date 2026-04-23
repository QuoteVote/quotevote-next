import { createMockPrismaModel, MockPrismaModel } from './_helpers';

let mockVoteLog: MockPrismaModel;

jest.mock('@prisma/client', () => {
  const model = createMockPrismaModel();
  mockVoteLog = model;
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({ voteLog: model })),
  };
});

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Prisma VoteLog Model', () => {
  beforeEach(() => jest.clearAllMocks());

  const mockRecord = {
    id: 'vl1',
    userId: 'user1',
    voteId: 'vote1',
    postId: 'post1',
    title: 'Test Post',
    author: 'Author Name',
    description: 'Upvoted the post',
    action: 'upvote',
    type: 'up',
    tokens: 5,
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a vote log with all fields', async () => {
      mockVoteLog.create.mockResolvedValue(mockRecord);

      const result = await prisma.voteLog.create({
        data: {
          userId: 'user1',
          voteId: 'vote1',
          postId: 'post1',
          description: 'Upvoted the post',
          type: 'up',
          tokens: 5,
        },
      });

      expect(result.type).toBe('up');
      expect(result.tokens).toBe(5);
      expect(result.voteId).toBe('vote1');
      expect(result.description).toBe('Upvoted the post');
    });
  });

  describe('Read', () => {
    it('should find vote logs by postId', async () => {
      mockVoteLog.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.voteLog.findMany({ where: { postId: 'post1' } });

      expect(result).toHaveLength(1);
    });

    it('should find vote logs by userId', async () => {
      mockVoteLog.findMany.mockResolvedValue([mockRecord]);

      const result = await prisma.voteLog.findMany({ where: { userId: 'user1' } });

      expect(result).toHaveLength(1);
    });

    it('should find vote log by id', async () => {
      mockVoteLog.findUnique.mockResolvedValue(mockRecord);

      const result = await prisma.voteLog.findUnique({ where: { id: 'vl1' } });

      expect(result).toEqual(mockRecord);
    });
  });

  describe('Update', () => {
    it('should update vote log tokens', async () => {
      const updated = { ...mockRecord, tokens: 10 };
      mockVoteLog.update.mockResolvedValue(updated);

      const result = await prisma.voteLog.update({
        where: { id: 'vl1' },
        data: { tokens: 10 },
      });

      expect(result.tokens).toBe(10);
    });
  });

  describe('Delete', () => {
    it('should delete a vote log', async () => {
      mockVoteLog.delete.mockResolvedValue(mockRecord);

      const result = await prisma.voteLog.delete({ where: { id: 'vl1' } });

      expect(result).toEqual(mockRecord);
    });
  });
});
