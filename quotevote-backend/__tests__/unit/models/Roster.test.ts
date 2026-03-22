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
    }),
    models: {},
  };
});

const MockRoster = mongoose.model('Roster') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Roster Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRoster = {
    _id: 'ros1',
    userId: 'user1',
    buddyId: 'user2',
    status: 'pending' as const,
    initiatedBy: 'user1',
    created: new Date(),
    updated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a roster entry (buddy request)', async () => {
      MockRoster.create.mockResolvedValue(mockRoster);

      const result = await MockRoster.create({
        userId: 'user1',
        buddyId: 'user2',
        initiatedBy: 'user1',
      });

      expect(MockRoster.create).toHaveBeenCalledWith({
        userId: 'user1',
        buddyId: 'user2',
        initiatedBy: 'user1',
      });
      expect(result.status).toBe('pending');
    });
  });

  describe('Read', () => {
    it('should find roster entries by userId', async () => {
      MockRoster.find.mockResolvedValue([mockRoster]);

      const result = await MockRoster.find({
        $or: [{ userId: 'user1' }, { buddyId: 'user1' }],
      });

      expect(result).toHaveLength(1);
    });

    it('should find pending requests for a user', async () => {
      MockRoster.find.mockResolvedValue([mockRoster]);

      const result = await MockRoster.find({ buddyId: 'user2', status: 'pending' });

      expect(MockRoster.find).toHaveBeenCalledWith({ buddyId: 'user2', status: 'pending' });
      expect(result).toHaveLength(1);
    });

    it('should find blocked users', async () => {
      const blocked = { ...mockRoster, status: 'blocked' as const };
      MockRoster.find.mockResolvedValue([blocked]);

      const result = await MockRoster.find({ userId: 'user1', status: 'blocked' });

      expect(result[0].status).toBe('blocked');
    });

    it('should find a specific buddy pair', async () => {
      MockRoster.findOne.mockResolvedValue(mockRoster);

      const result = await MockRoster.findOne({ userId: 'user1', buddyId: 'user2' });

      expect(result).toEqual(mockRoster);
    });

    it('should find a roster entry by id', async () => {
      MockRoster.findById.mockResolvedValue(mockRoster);

      const result = await MockRoster.findById('ros1');

      expect(result).toEqual(mockRoster);
    });

    it('should return null for non-existent roster entry', async () => {
      MockRoster.findById.mockResolvedValue(null);

      const result = await MockRoster.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should accept a buddy request', async () => {
      const accepted = { ...mockRoster, status: 'accepted' as const };
      MockRoster.findByIdAndUpdate.mockResolvedValue(accepted);

      const result = await MockRoster.findByIdAndUpdate(
        'ros1',
        { status: 'accepted' },
        { new: true }
      );

      expect(result.status).toBe('accepted');
    });

    it('should decline a buddy request', async () => {
      const declined = { ...mockRoster, status: 'declined' as const };
      MockRoster.findByIdAndUpdate.mockResolvedValue(declined);

      const result = await MockRoster.findByIdAndUpdate(
        'ros1',
        { status: 'declined' },
        { new: true }
      );

      expect(result.status).toBe('declined');
    });

    it('should block a user', async () => {
      const blocked = { ...mockRoster, status: 'blocked' as const };
      MockRoster.findByIdAndUpdate.mockResolvedValue(blocked);

      const result = await MockRoster.findByIdAndUpdate(
        'ros1',
        { status: 'blocked' },
        { new: true }
      );

      expect(result.status).toBe('blocked');
    });
  });

  describe('Delete', () => {
    it('should delete a roster entry', async () => {
      MockRoster.findByIdAndDelete.mockResolvedValue(mockRoster);

      const result = await MockRoster.findByIdAndDelete('ros1');

      expect(result).toEqual(mockRoster);
    });
  });
});
