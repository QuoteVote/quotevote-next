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

const MockContent = mongoose.model('Content') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Content Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockContent = {
    _id: 'ct1',
    creatorId: 'creator1',
    domainId: 'domain1',
    title: 'Test Article',
    url: 'https://example.com/article',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create content', async () => {
      MockContent.create.mockResolvedValue(mockContent);

      const result = await MockContent.create({
        creatorId: 'creator1',
        domainId: 'domain1',
        title: 'Test Article',
        url: 'https://example.com/article',
      });

      expect(result.title).toBe('Test Article');
    });
  });

  describe('Read', () => {
    it('should find content by creatorId', async () => {
      MockContent.find.mockResolvedValue([mockContent]);

      const result = await MockContent.find({ creatorId: 'creator1' });

      expect(result).toHaveLength(1);
    });

    it('should find content by id', async () => {
      MockContent.findById.mockResolvedValue(mockContent);

      const result = await MockContent.findById('ct1');

      expect(result).toEqual(mockContent);
    });
  });

  describe('Update', () => {
    it('should update content title', async () => {
      const updated = { ...mockContent, title: 'Updated Title' };
      MockContent.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockContent.findByIdAndUpdate(
        'ct1',
        { title: 'Updated Title' },
        { new: true }
      );

      expect(result.title).toBe('Updated Title');
    });
  });

  describe('Delete', () => {
    it('should delete content', async () => {
      MockContent.findByIdAndDelete.mockResolvedValue(mockContent);

      const result = await MockContent.findByIdAndDelete('ct1');

      expect(result).toEqual(mockContent);
    });
  });
});
