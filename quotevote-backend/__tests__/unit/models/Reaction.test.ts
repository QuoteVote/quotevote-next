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

const MockReaction = mongoose.model('Reaction') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Reaction Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReaction = {
    _id: 'r1',
    userId: 'user1',
    messageId: 'msg1',
    actionId: 'action1',
    emoji: '👍',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a reaction on a message', async () => {
      MockReaction.create.mockResolvedValue(mockReaction);

      const result = await MockReaction.create({
        userId: 'user1',
        messageId: 'msg1',
        emoji: '👍',
      });

      expect(MockReaction.create).toHaveBeenCalledWith({
        userId: 'user1',
        messageId: 'msg1',
        emoji: '👍',
      });
      expect(result.emoji).toBe('👍');
    });

    it('should create a reaction on an action', async () => {
      const actionReaction = { ...mockReaction, _id: 'r2', messageId: undefined };
      MockReaction.create.mockResolvedValue(actionReaction);

      const result = await MockReaction.create({
        userId: 'user1',
        actionId: 'action1',
        emoji: '❤️',
      });

      expect(result.actionId).toBe('action1');
    });
  });

  describe('Read', () => {
    it('should find reactions by messageId', async () => {
      MockReaction.find.mockResolvedValue([mockReaction]);

      const result = await MockReaction.find({ messageId: 'msg1' });

      expect(MockReaction.find).toHaveBeenCalledWith({ messageId: 'msg1' });
      expect(result).toHaveLength(1);
    });

    it('should find reactions by actionId', async () => {
      MockReaction.find.mockResolvedValue([mockReaction]);

      const result = await MockReaction.find({ actionId: 'action1' });

      expect(result).toHaveLength(1);
    });

    it('should find reactions by userId and messageId', async () => {
      MockReaction.find.mockResolvedValue([mockReaction]);

      const result = await MockReaction.find({ userId: 'user1', messageId: 'msg1' });

      expect(result).toHaveLength(1);
    });

    it('should find a reaction by id', async () => {
      MockReaction.findById.mockResolvedValue(mockReaction);

      const result = await MockReaction.findById('r1');

      expect(result).toEqual(mockReaction);
    });

    it('should return null for non-existent reaction', async () => {
      MockReaction.findById.mockResolvedValue(null);

      const result = await MockReaction.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update reaction emoji', async () => {
      const updated = { ...mockReaction, emoji: '😂' };
      MockReaction.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockReaction.findByIdAndUpdate(
        'r1',
        { emoji: '😂' },
        { new: true }
      );

      expect(result.emoji).toBe('😂');
    });
  });

  describe('Delete', () => {
    it('should delete a reaction', async () => {
      MockReaction.findByIdAndDelete.mockResolvedValue(mockReaction);

      const result = await MockReaction.findByIdAndDelete('r1');

      expect(result).toEqual(mockReaction);
    });
  });
});
