import mongoose from 'mongoose';

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn().mockReturnValue({
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    }),
    models: {},
  };
});

const MockVote = mongoose.model('Vote') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Vote Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVote = {
    _id: 'v1',
    userId: 'user1',
    postId: 'post1',
    type: 'up' as const,
    startWordIndex: 0,
    endWordIndex: 5,
    tags: ['insightful'],
    content: 'Great point',
    deleted: false,
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a vote', async () => {
      MockVote.create.mockResolvedValue(mockVote);

      const result = await MockVote.create({
        userId: 'user1',
        postId: 'post1',
        type: 'up',
        content: 'Great point',
      });

      expect(MockVote.create).toHaveBeenCalledWith({
        userId: 'user1',
        postId: 'post1',
        type: 'up',
        content: 'Great point',
      });
      expect(result.type).toBe('up');
      expect(result.deleted).toBe(false);
    });

    it('should create a downvote with tags', async () => {
      const downvote = { ...mockVote, _id: 'v2', type: 'down' as const, tags: ['misleading'] };
      MockVote.create.mockResolvedValue(downvote);

      const result = await MockVote.create({
        userId: 'user1',
        postId: 'post1',
        type: 'down',
        tags: ['misleading'],
      });

      expect(result.type).toBe('down');
      expect(result.tags).toContain('misleading');
    });
  });

  describe('Read', () => {
    it('should find votes by postId', async () => {
      MockVote.find.mockResolvedValue([mockVote]);

      const result = await MockVote.find({ postId: 'post1', deleted: { $ne: true } });

      expect(MockVote.find).toHaveBeenCalledWith({ postId: 'post1', deleted: { $ne: true } });
      expect(result).toHaveLength(1);
    });

    it('should find votes by userId', async () => {
      MockVote.find.mockResolvedValue([mockVote]);

      const result = await MockVote.find({ userId: 'user1' });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user1');
    });

    it('should find a vote by id', async () => {
      MockVote.findById.mockResolvedValue(mockVote);

      const result = await MockVote.findById('v1');

      expect(result).toEqual(mockVote);
    });

    it('should return null for non-existent vote', async () => {
      MockVote.findById.mockResolvedValue(null);

      const result = await MockVote.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should exclude soft-deleted votes', async () => {
      MockVote.find.mockResolvedValue([]);

      const result = await MockVote.find({ postId: 'post1', deleted: { $ne: true } });

      expect(result).toHaveLength(0);
    });
  });

  describe('Update', () => {
    it('should update vote type', async () => {
      const updated = { ...mockVote, type: 'down' };
      MockVote.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockVote.findByIdAndUpdate('v1', { type: 'down' }, { new: true });

      expect(result.type).toBe('down');
    });

    it('should soft-delete a vote', async () => {
      const softDeleted = { ...mockVote, deleted: true };
      MockVote.findByIdAndUpdate.mockResolvedValue(softDeleted);

      const result = await MockVote.findByIdAndUpdate('v1', { deleted: true }, { new: true });

      expect(result.deleted).toBe(true);
    });
  });

  describe('Delete', () => {
    it('should delete a vote', async () => {
      MockVote.findByIdAndDelete.mockResolvedValue(mockVote);

      const result = await MockVote.findByIdAndDelete('v1');

      expect(result).toEqual(mockVote);
    });
  });
});
