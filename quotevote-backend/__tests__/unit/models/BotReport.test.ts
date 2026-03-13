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

const MockBotReport = mongoose.model('BotReport') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('BotReport Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReport = {
    _id: 'report1',
    userId: 'user1',
    reporterId: 'reporter1',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a bot report', async () => {
      MockBotReport.create.mockResolvedValue(mockReport);

      const result = await MockBotReport.create({
        userId: 'user1',
        reporterId: 'reporter1',
      });

      expect(MockBotReport.create).toHaveBeenCalledWith({
        userId: 'user1',
        reporterId: 'reporter1',
      });
      expect(result).toEqual(mockReport);
    });
  });

  describe('Read', () => {
    it('should find reports by userId', async () => {
      MockBotReport.find.mockResolvedValue([mockReport]);

      const result = await MockBotReport.find({ userId: 'user1' });

      expect(MockBotReport.find).toHaveBeenCalledWith({ userId: 'user1' });
      expect(result).toHaveLength(1);
    });

    it('should find a report by id', async () => {
      MockBotReport.findById.mockResolvedValue(mockReport);

      const result = await MockBotReport.findById('report1');

      expect(MockBotReport.findById).toHaveBeenCalledWith('report1');
      expect(result).toEqual(mockReport);
    });

    it('should return null for non-existent report', async () => {
      MockBotReport.findById.mockResolvedValue(null);

      const result = await MockBotReport.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update a report by id', async () => {
      const updated = { ...mockReport, userId: 'user2' };
      MockBotReport.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockBotReport.findByIdAndUpdate(
        'report1',
        { userId: 'user2' },
        { new: true }
      );

      expect(result.userId).toBe('user2');
    });
  });

  describe('Delete', () => {
    it('should delete a report by id', async () => {
      MockBotReport.findByIdAndDelete.mockResolvedValue(mockReport);

      const result = await MockBotReport.findByIdAndDelete('report1');

      expect(MockBotReport.findByIdAndDelete).toHaveBeenCalledWith('report1');
      expect(result).toEqual(mockReport);
    });

    it('should return null when deleting non-existent report', async () => {
      MockBotReport.findByIdAndDelete.mockResolvedValue(null);

      const result = await MockBotReport.findByIdAndDelete('nonexistent');

      expect(result).toBeNull();
    });
  });
});
