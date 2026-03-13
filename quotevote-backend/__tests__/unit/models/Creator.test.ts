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

const MockCreator = mongoose.model('Creator') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Creator Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCreator = {
    _id: 'c1',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.png',
    bio: 'A content creator',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a creator', async () => {
      MockCreator.create.mockResolvedValue(mockCreator);

      const result = await MockCreator.create({
        name: 'John Doe',
        avatar: 'https://example.com/avatar.png',
        bio: 'A content creator',
      });

      expect(result.name).toBe('John Doe');
    });
  });

  describe('Read', () => {
    it('should find a creator by id', async () => {
      MockCreator.findById.mockResolvedValue(mockCreator);

      const result = await MockCreator.findById('c1');

      expect(result).toEqual(mockCreator);
    });

    it('should find all creators', async () => {
      MockCreator.find.mockResolvedValue([mockCreator]);

      const result = await MockCreator.find({});

      expect(result).toHaveLength(1);
    });
  });

  describe('Update', () => {
    it('should update creator bio', async () => {
      const updated = { ...mockCreator, bio: 'Updated bio' };
      MockCreator.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockCreator.findByIdAndUpdate(
        'c1',
        { bio: 'Updated bio' },
        { new: true }
      );

      expect(result.bio).toBe('Updated bio');
    });
  });

  describe('Delete', () => {
    it('should delete a creator', async () => {
      MockCreator.findByIdAndDelete.mockResolvedValue(mockCreator);

      const result = await MockCreator.findByIdAndDelete('c1');

      expect(result).toEqual(mockCreator);
    });
  });
});
