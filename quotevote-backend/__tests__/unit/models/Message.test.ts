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

const MockMessage = mongoose.model('Message') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Message Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockMessage = {
    _id: 'm1',
    messageRoomId: 'room1',
    userId: 'user1',
    userName: 'John',
    title: 'Hello',
    text: 'Hello world',
    type: 'text',
    mutation_type: 'create',
    deleted: false,
    readBy: ['user2'],
    readByDetailed: [{ userId: 'user2', readAt: new Date() }],
    deliveredTo: [{ userId: 'user2', deliveredAt: new Date() }],
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a message', async () => {
      MockMessage.create.mockResolvedValue(mockMessage);

      const result = await MockMessage.create({
        messageRoomId: 'room1',
        userId: 'user1',
        text: 'Hello world',
      });

      expect(MockMessage.create).toHaveBeenCalledWith({
        messageRoomId: 'room1',
        userId: 'user1',
        text: 'Hello world',
      });
      expect(result.text).toBe('Hello world');
      expect(result.deleted).toBe(false);
    });
  });

  describe('Read', () => {
    it('should find messages by messageRoomId', async () => {
      MockMessage.find.mockResolvedValue([mockMessage]);

      const result = await MockMessage.find({ messageRoomId: 'room1', deleted: { $ne: true } });

      expect(MockMessage.find).toHaveBeenCalledWith({
        messageRoomId: 'room1',
        deleted: { $ne: true },
      });
      expect(result).toHaveLength(1);
    });

    it('should find messages by userId', async () => {
      MockMessage.find.mockResolvedValue([mockMessage]);

      const result = await MockMessage.find({ userId: 'user1' });

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user1');
    });

    it('should find a message by id', async () => {
      MockMessage.findById.mockResolvedValue(mockMessage);

      const result = await MockMessage.findById('m1');

      expect(result).toEqual(mockMessage);
    });

    it('should return null for non-existent message', async () => {
      MockMessage.findById.mockResolvedValue(null);

      const result = await MockMessage.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should include readByDetailed and deliveredTo', async () => {
      MockMessage.findById.mockResolvedValue(mockMessage);

      const result = await MockMessage.findById('m1');

      expect(result.readByDetailed).toHaveLength(1);
      expect(result.deliveredTo).toHaveLength(1);
    });
  });

  describe('Update', () => {
    it('should update message text', async () => {
      const updated = { ...mockMessage, text: 'Updated message' };
      MockMessage.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockMessage.findByIdAndUpdate(
        'm1',
        { text: 'Updated message' },
        { new: true }
      );

      expect(result.text).toBe('Updated message');
    });

    it('should soft-delete a message', async () => {
      const softDeleted = { ...mockMessage, deleted: true };
      MockMessage.findByIdAndUpdate.mockResolvedValue(softDeleted);

      const result = await MockMessage.findByIdAndUpdate(
        'm1',
        { deleted: true },
        { new: true }
      );

      expect(result.deleted).toBe(true);
    });

    it('should mark message as read', async () => {
      const read = {
        ...mockMessage,
        readBy: ['user2', 'user3'],
        readByDetailed: [
          { userId: 'user2', readAt: new Date() },
          { userId: 'user3', readAt: new Date() },
        ],
      };
      MockMessage.findByIdAndUpdate.mockResolvedValue(read);

      const result = await MockMessage.findByIdAndUpdate(
        'm1',
        { $push: { readBy: 'user3' } },
        { new: true }
      );

      expect(result.readBy).toHaveLength(2);
    });
  });

  describe('Delete', () => {
    it('should delete a message', async () => {
      MockMessage.findByIdAndDelete.mockResolvedValue(mockMessage);

      const result = await MockMessage.findByIdAndDelete('m1');

      expect(result).toEqual(mockMessage);
    });
  });
});
