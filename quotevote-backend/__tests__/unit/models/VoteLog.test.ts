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

const MockVoteLog = mongoose.model('VoteLog') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('VoteLog Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockVoteLog = {
    _id: 'vl1',
    userId: 'user1',
    postId: 'post1',
    type: 'up' as const,
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a vote log entry', async () => {
      MockVoteLog.create.mockResolvedValue(mockVoteLog);

      const result = await MockVoteLog.create({
        userId: 'user1',
        postId: 'post1',
        type: 'up',
      });

      expect(MockVoteLog.create).toHaveBeenCalledWith({
        userId: 'user1',
        postId: 'post1',
        type: 'up',
      });
      expect(result.type).toBe('up');
    });
  });

  describe('Read', () => {
    it('should find vote logs by userId', async () => {
      MockVoteLog.find.mockResolvedValue([mockVoteLog]);

      const result = await MockVoteLog.find({ userId: 'user1' });

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('up');
    });

    it('should find vote logs by postId', async () => {
      MockVoteLog.find.mockResolvedValue([mockVoteLog]);

      const result = await MockVoteLog.find({ postId: 'post1' });

      expect(MockVoteLog.find).toHaveBeenCalledWith({ postId: 'post1' });
      expect(result).toHaveLength(1);
    });

    it('should find a vote log by id', async () => {
      MockVoteLog.findById.mockResolvedValue(mockVoteLog);

      const result = await MockVoteLog.findById('vl1');

      expect(result).toEqual(mockVoteLog);
    });
  });

  describe('Update', () => {
    it('should update vote type', async () => {
      const updated = { ...mockVoteLog, type: 'down' };
      MockVoteLog.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockVoteLog.findByIdAndUpdate(
        'vl1',
        { type: 'down' },
        { new: true }
      );

      expect(result.type).toBe('down');
    });
  });

  describe('Delete', () => {
    it('should delete a vote log', async () => {
      MockVoteLog.findByIdAndDelete.mockResolvedValue(mockVoteLog);

      const result = await MockVoteLog.findByIdAndDelete('vl1');

      expect(result).toEqual(mockVoteLog);
    });
  });
});
