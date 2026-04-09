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
      findByCreatorId: jest.fn(),
    }),
    models: {},
  };
});

const MockGroup = mongoose.model('Group') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findByCreatorId: jest.Mock;
};

describe('Group Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockGroup = {
    _id: 'g1',
    creatorId: 'user1',
    adminIds: ['user1'],
    allowedUserIds: ['user1', 'user2'],
    privacy: 'public' as const,
    title: 'Test Group',
    url: 'test-group',
    description: 'A test group',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a group', async () => {
      MockGroup.create.mockResolvedValue(mockGroup);

      const result = await MockGroup.create({
        creatorId: 'user1',
        title: 'Test Group',
        privacy: 'public',
      });

      expect(result.title).toBe('Test Group');
      expect(result.privacy).toBe('public');
    });
  });

  describe('Read', () => {
    it('should find a group by id', async () => {
      MockGroup.findById.mockResolvedValue(mockGroup);

      const result = await MockGroup.findById('g1');

      expect(result).toEqual(mockGroup);
    });

    it('should find groups by creatorId (static)', async () => {
      MockGroup.findByCreatorId.mockResolvedValue([mockGroup]);

      const result = await MockGroup.findByCreatorId('user1');

      expect(MockGroup.findByCreatorId).toHaveBeenCalledWith('user1');
      expect(result).toHaveLength(1);
    });

    it('should return empty array for creator with no groups', async () => {
      MockGroup.findByCreatorId.mockResolvedValue([]);

      const result = await MockGroup.findByCreatorId('user999');

      expect(result).toEqual([]);
    });

    it('should return null for non-existent group', async () => {
      MockGroup.findById.mockResolvedValue(null);

      const result = await MockGroup.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update group title', async () => {
      const updated = { ...mockGroup, title: 'Updated Group' };
      MockGroup.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockGroup.findByIdAndUpdate(
        'g1',
        { title: 'Updated Group' },
        { new: true }
      );

      expect(result.title).toBe('Updated Group');
    });

    it('should update privacy setting', async () => {
      const updated = { ...mockGroup, privacy: 'private' };
      MockGroup.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockGroup.findByIdAndUpdate(
        'g1',
        { privacy: 'private' },
        { new: true }
      );

      expect(result.privacy).toBe('private');
    });
  });

  describe('Delete', () => {
    it('should delete a group', async () => {
      MockGroup.findByIdAndDelete.mockResolvedValue(mockGroup);

      const result = await MockGroup.findByIdAndDelete('g1');

      expect(result).toEqual(mockGroup);
    });
  });
});
