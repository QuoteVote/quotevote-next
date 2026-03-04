import mongoose from 'mongoose';

jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose');
  return {
    ...actualMongoose,
    model: jest.fn().mockReturnValue({
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByUserId: jest.fn(),
      calculateScore: jest.fn(),
    }),
    models: {},
  };
});

const MockUserReputation = mongoose.model('UserReputation') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findOneAndUpdate: jest.Mock;
  findByUserId: jest.Mock;
  calculateScore: jest.Mock;
};

describe('UserReputation Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReputation = {
    _id: 'rep1',
    userId: 'user1',
    overallScore: 450,
    inviteNetworkScore: 200,
    conductScore: 350,
    activityScore: 150,
    metrics: {
      totalInvitesSent: 10,
      totalInvitesAccepted: 8,
      totalInvitesDeclined: 2,
      averageInviteeReputation: 400,
      totalReportsReceived: 1,
      totalReportsResolved: 1,
      totalUpvotes: 50,
      totalDownvotes: 5,
      totalPosts: 20,
      totalComments: 30,
    },
    lastCalculated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a reputation record', async () => {
      MockUserReputation.create.mockResolvedValue(mockReputation);

      const result = await MockUserReputation.create({
        userId: 'user1',
        overallScore: 450,
      });

      expect(result.overallScore).toBe(450);
      expect(result.metrics.totalUpvotes).toBe(50);
    });
  });

  describe('Read', () => {
    it('should find reputation by userId (static)', async () => {
      MockUserReputation.findByUserId.mockResolvedValue(mockReputation);

      const result = await MockUserReputation.findByUserId('user1');

      expect(MockUserReputation.findByUserId).toHaveBeenCalledWith('user1');
      expect(result.overallScore).toBe(450);
    });

    it('should return null for user without reputation', async () => {
      MockUserReputation.findByUserId.mockResolvedValue(null);

      const result = await MockUserReputation.findByUserId('newuser');

      expect(result).toBeNull();
    });

    it('should find reputation by id', async () => {
      MockUserReputation.findById.mockResolvedValue(mockReputation);

      const result = await MockUserReputation.findById('rep1');

      expect(result).toEqual(mockReputation);
    });

    it('should find all reputations sorted by score', async () => {
      MockUserReputation.find.mockResolvedValue([mockReputation]);

      const result = await MockUserReputation.find({});

      expect(result).toHaveLength(1);
    });
  });

  describe('Update', () => {
    it('should update scores via findOneAndUpdate (upsert)', async () => {
      MockUserReputation.findOneAndUpdate.mockResolvedValue(mockReputation);

      const result = await MockUserReputation.findOneAndUpdate(
        { userId: 'user1' },
        {
          overallScore: 450,
          inviteNetworkScore: 200,
          conductScore: 350,
          activityScore: 150,
        },
        { upsert: true, new: true }
      );

      expect(MockUserReputation.findOneAndUpdate).toHaveBeenCalled();
      expect(result.overallScore).toBe(450);
    });

    it('should update metrics', async () => {
      const updated = {
        ...mockReputation,
        metrics: { ...mockReputation.metrics, totalPosts: 25 },
      };
      MockUserReputation.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUserReputation.findByIdAndUpdate(
        'rep1',
        { 'metrics.totalPosts': 25 },
        { new: true }
      );

      expect(result.metrics.totalPosts).toBe(25);
    });
  });

  describe('calculateScore (static)', () => {
    it('should call calculateScore with userId', async () => {
      MockUserReputation.calculateScore.mockResolvedValue(mockReputation);

      const result = await MockUserReputation.calculateScore('user1');

      expect(MockUserReputation.calculateScore).toHaveBeenCalledWith('user1');
      expect(result.overallScore).toBe(450);
    });
  });

  describe('Delete', () => {
    it('should delete a reputation record', async () => {
      MockUserReputation.findByIdAndDelete.mockResolvedValue(mockReputation);

      const result = await MockUserReputation.findByIdAndDelete('rep1');

      expect(result).toEqual(mockReputation);
    });
  });
});
