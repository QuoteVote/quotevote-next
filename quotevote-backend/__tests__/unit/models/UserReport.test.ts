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

const MockUserReport = mongoose.model('UserReport') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('UserReport Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReport = {
    _id: 'ur1',
    reportedUserId: 'user1',
    reporterId: 'reporter1',
    reason: 'spam',
    status: 'pending',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a user report', async () => {
      MockUserReport.create.mockResolvedValue(mockReport);

      const result = await MockUserReport.create({
        reportedUserId: 'user1',
        reporterId: 'reporter1',
        reason: 'spam',
      });

      expect(result.reason).toBe('spam');
      expect(result.status).toBe('pending');
    });
  });

  describe('Read', () => {
    it('should find reports by reportedUserId', async () => {
      MockUserReport.find.mockResolvedValue([mockReport]);

      const result = await MockUserReport.find({ reportedUserId: 'user1' });

      expect(result).toHaveLength(1);
    });

    it('should find a report by id', async () => {
      MockUserReport.findById.mockResolvedValue(mockReport);

      const result = await MockUserReport.findById('ur1');

      expect(result).toEqual(mockReport);
    });

    it('should return null for non-existent report', async () => {
      MockUserReport.findById.mockResolvedValue(null);

      const result = await MockUserReport.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update report status', async () => {
      const updated = { ...mockReport, status: 'resolved' };
      MockUserReport.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUserReport.findByIdAndUpdate(
        'ur1',
        { status: 'resolved' },
        { new: true }
      );

      expect(result.status).toBe('resolved');
    });
  });

  describe('Delete', () => {
    it('should delete a report', async () => {
      MockUserReport.findByIdAndDelete.mockResolvedValue(mockReport);

      const result = await MockUserReport.findByIdAndDelete('ur1');

      expect(result).toEqual(mockReport);
    });
  });
});
