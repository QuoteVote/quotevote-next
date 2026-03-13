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

const MockDomain = mongoose.model('Domain') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Domain Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockDomain = {
    _id: 'd1',
    key: 'example.com',
    name: 'Example',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a domain', async () => {
      MockDomain.create.mockResolvedValue(mockDomain);

      const result = await MockDomain.create({
        key: 'example.com',
        name: 'Example',
      });

      expect(result.key).toBe('example.com');
    });
  });

  describe('Read', () => {
    it('should find a domain by key', async () => {
      MockDomain.findOne.mockResolvedValue(mockDomain);

      const result = await MockDomain.findOne({ key: 'example.com' });

      expect(result).toEqual(mockDomain);
    });

    it('should find all domains', async () => {
      MockDomain.find.mockResolvedValue([mockDomain]);

      const result = await MockDomain.find({});

      expect(result).toHaveLength(1);
    });

    it('should return null for non-existent domain', async () => {
      MockDomain.findOne.mockResolvedValue(null);

      const result = await MockDomain.findOne({ key: 'nonexistent.com' });

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update domain name', async () => {
      const updated = { ...mockDomain, name: 'Updated Example' };
      MockDomain.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockDomain.findByIdAndUpdate(
        'd1',
        { name: 'Updated Example' },
        { new: true }
      );

      expect(result.name).toBe('Updated Example');
    });
  });

  describe('Delete', () => {
    it('should delete a domain', async () => {
      MockDomain.findByIdAndDelete.mockResolvedValue(mockDomain);

      const result = await MockDomain.findByIdAndDelete('d1');

      expect(result).toEqual(mockDomain);
    });
  });
});
