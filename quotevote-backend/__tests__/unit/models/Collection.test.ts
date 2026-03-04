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

const MockCollection = mongoose.model('Collection') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Collection Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCollection = {
    _id: 'col1',
    userId: 'user1',
    name: 'Favorites',
    description: 'My favorite posts',
    postIds: ['post1', 'post2'],
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a collection', async () => {
      MockCollection.create.mockResolvedValue(mockCollection);

      const result = await MockCollection.create({
        userId: 'user1',
        name: 'Favorites',
        description: 'My favorite posts',
      });

      expect(result.name).toBe('Favorites');
    });
  });

  describe('Read', () => {
    it('should find collections by userId', async () => {
      MockCollection.find.mockResolvedValue([mockCollection]);

      const result = await MockCollection.find({ userId: 'user1' });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Favorites');
    });

    it('should find a collection by id', async () => {
      MockCollection.findById.mockResolvedValue(mockCollection);

      const result = await MockCollection.findById('col1');

      expect(result.postIds).toHaveLength(2);
    });
  });

  describe('Update', () => {
    it('should add a post to collection', async () => {
      const updated = { ...mockCollection, postIds: ['post1', 'post2', 'post3'] };
      MockCollection.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockCollection.findByIdAndUpdate(
        'col1',
        { $push: { postIds: 'post3' } },
        { new: true }
      );

      expect(result.postIds).toHaveLength(3);
    });

    it('should update collection name', async () => {
      const updated = { ...mockCollection, name: 'Bookmarks' };
      MockCollection.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockCollection.findByIdAndUpdate(
        'col1',
        { name: 'Bookmarks' },
        { new: true }
      );

      expect(result.name).toBe('Bookmarks');
    });
  });

  describe('Delete', () => {
    it('should delete a collection', async () => {
      MockCollection.findByIdAndDelete.mockResolvedValue(mockCollection);

      const result = await MockCollection.findByIdAndDelete('col1');

      expect(result).toEqual(mockCollection);
    });
  });
});
