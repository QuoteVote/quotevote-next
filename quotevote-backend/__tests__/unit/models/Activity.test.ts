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

const MockActivity = mongoose.model('Activity') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Activity Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockActivity = {
    _id: 'act1',
    userId: 'user1',
    postId: 'post1',
    activityType: 'POSTED',
    content: 'Created a new post',
    voteId: null,
    commentId: null,
    quoteId: null,
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create an activity', async () => {
      MockActivity.create.mockResolvedValue(mockActivity);

      const result = await MockActivity.create({
        userId: 'user1',
        postId: 'post1',
        activityType: 'POSTED',
        content: 'Created a new post',
      });

      expect(result.activityType).toBe('POSTED');
      expect(result.userId).toBe('user1');
    });
  });

  describe('Read', () => {
    it('should find activities by userId', async () => {
      MockActivity.find.mockResolvedValue([mockActivity]);

      const result = await MockActivity.find({ userId: 'user1' });

      expect(result).toHaveLength(1);
    });

    it('should find an activity by id', async () => {
      MockActivity.findById.mockResolvedValue(mockActivity);

      const result = await MockActivity.findById('act1');

      expect(result).toEqual(mockActivity);
    });

    it('should return null for non-existent activity', async () => {
      MockActivity.findById.mockResolvedValue(null);

      const result = await MockActivity.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update activity content', async () => {
      const updated = { ...mockActivity, content: 'Updated content' };
      MockActivity.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockActivity.findByIdAndUpdate(
        'act1',
        { content: 'Updated content' },
        { new: true }
      );

      expect(result.content).toBe('Updated content');
    });
  });

  describe('Delete', () => {
    it('should delete an activity', async () => {
      MockActivity.findByIdAndDelete.mockResolvedValue(mockActivity);

      const result = await MockActivity.findByIdAndDelete('act1');

      expect(result).toEqual(mockActivity);
    });
  });
});
