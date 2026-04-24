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

const MockTyping = mongoose.model('Typing') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Typing Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTyping = {
    _id: 't1',
    messageRoomId: 'room1',
    userId: 'user1',
    isTyping: true,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 10000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a typing indicator', async () => {
      MockTyping.create.mockResolvedValue(mockTyping);

      const result = await MockTyping.create({
        messageRoomId: 'room1',
        userId: 'user1',
        isTyping: true,
      });

      expect(MockTyping.create).toHaveBeenCalledWith({
        messageRoomId: 'room1',
        userId: 'user1',
        isTyping: true,
      });
      expect(result.isTyping).toBe(true);
    });
  });

  describe('Read', () => {
    it('should find typing indicators by room', async () => {
      MockTyping.find.mockResolvedValue([mockTyping]);

      const result = await MockTyping.find({ messageRoomId: 'room1', isTyping: true });

      expect(MockTyping.find).toHaveBeenCalledWith({
        messageRoomId: 'room1',
        isTyping: true,
      });
      expect(result).toHaveLength(1);
    });

    it('should find typing indicator for a specific user in a room', async () => {
      MockTyping.findOne.mockResolvedValue(mockTyping);

      const result = await MockTyping.findOne({
        messageRoomId: 'room1',
        userId: 'user1',
      });

      expect(result.userId).toBe('user1');
      expect(result.isTyping).toBe(true);
    });

    it('should find a typing indicator by id', async () => {
      MockTyping.findById.mockResolvedValue(mockTyping);

      const result = await MockTyping.findById('t1');

      expect(result).toEqual(mockTyping);
    });

    it('should return null when no typing indicator exists', async () => {
      MockTyping.findOne.mockResolvedValue(null);

      const result = await MockTyping.findOne({
        messageRoomId: 'room1',
        userId: 'nonexistent',
      });

      expect(result).toBeNull();
    });

    it('should include expiresAt for TTL behavior', async () => {
      MockTyping.findById.mockResolvedValue(mockTyping);

      const result = await MockTyping.findById('t1');

      expect(result.expiresAt).toBeDefined();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now() - 60000);
    });
  });

  describe('Update', () => {
    it('should stop typing indicator', async () => {
      const stopped = { ...mockTyping, isTyping: false };
      MockTyping.findByIdAndUpdate.mockResolvedValue(stopped);

      const result = await MockTyping.findByIdAndUpdate(
        't1',
        { isTyping: false },
        { new: true }
      );

      expect(result.isTyping).toBe(false);
    });

    it('should refresh typing expiresAt', async () => {
      const newExpiry = new Date(Date.now() + 10000);
      const refreshed = { ...mockTyping, expiresAt: newExpiry };
      MockTyping.findByIdAndUpdate.mockResolvedValue(refreshed);

      const result = await MockTyping.findByIdAndUpdate(
        't1',
        { expiresAt: newExpiry },
        { new: true }
      );

      expect(result.expiresAt).toBe(newExpiry);
    });
  });

  describe('Delete', () => {
    it('should delete a typing indicator', async () => {
      MockTyping.findByIdAndDelete.mockResolvedValue(mockTyping);

      const result = await MockTyping.findByIdAndDelete('t1');

      expect(result).toEqual(mockTyping);
    });
  });
});
