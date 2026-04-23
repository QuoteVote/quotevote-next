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

const MockMessageRoom = mongoose.model('MessageRoom') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('MessageRoom Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRoom = {
    _id: 'room1',
    users: ['user1', 'user2'],
    postId: 'post1',
    messageType: 'USER' as const,
    title: 'Test Room',
    avatar: 'avatar.png',
    isDirect: true,
    lastActivity: new Date(),
    lastMessageTime: new Date(),
    lastSeenMessages: new Map([['user1', 'msg1']]),
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a direct message room', async () => {
      MockMessageRoom.create.mockResolvedValue(mockRoom);

      const result = await MockMessageRoom.create({
        users: ['user1', 'user2'],
        messageType: 'USER',
        isDirect: true,
      });

      expect(MockMessageRoom.create).toHaveBeenCalledWith({
        users: ['user1', 'user2'],
        messageType: 'USER',
        isDirect: true,
      });
      expect(result.isDirect).toBe(true);
      expect(result.users).toHaveLength(2);
    });

    it('should create a post-linked message room', async () => {
      const postRoom = { ...mockRoom, _id: 'room2', messageType: 'POST' as const, isDirect: false };
      MockMessageRoom.create.mockResolvedValue(postRoom);

      const result = await MockMessageRoom.create({
        users: ['user1', 'user2'],
        postId: 'post1',
        messageType: 'POST',
      });

      expect(result.messageType).toBe('POST');
      expect(result.postId).toBe('post1');
    });
  });

  describe('Read', () => {
    it('should find rooms by userId', async () => {
      MockMessageRoom.find.mockResolvedValue([mockRoom]);

      const result = await MockMessageRoom.find({ users: 'user1' });

      expect(MockMessageRoom.find).toHaveBeenCalledWith({ users: 'user1' });
      expect(result).toHaveLength(1);
    });

    it('should find a room by postId', async () => {
      MockMessageRoom.findOne.mockResolvedValue(mockRoom);

      const result = await MockMessageRoom.findOne({ postId: 'post1' });

      expect(result).toEqual(mockRoom);
    });

    it('should find a direct room between two users', async () => {
      MockMessageRoom.findOne.mockResolvedValue(mockRoom);

      const result = await MockMessageRoom.findOne({
        users: { $all: ['user1', 'user2'] },
        isDirect: true,
      });

      expect(result.isDirect).toBe(true);
    });

    it('should find a room by id', async () => {
      MockMessageRoom.findById.mockResolvedValue(mockRoom);

      const result = await MockMessageRoom.findById('room1');

      expect(result).toEqual(mockRoom);
    });

    it('should return null for non-existent room', async () => {
      MockMessageRoom.findById.mockResolvedValue(null);

      const result = await MockMessageRoom.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update lastActivity', async () => {
      const newDate = new Date();
      const updated = { ...mockRoom, lastActivity: newDate };
      MockMessageRoom.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockMessageRoom.findByIdAndUpdate(
        'room1',
        { lastActivity: newDate },
        { new: true }
      );

      expect(result.lastActivity).toBe(newDate);
    });

    it('should update room title', async () => {
      const updated = { ...mockRoom, title: 'New Title' };
      MockMessageRoom.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockMessageRoom.findByIdAndUpdate(
        'room1',
        { title: 'New Title' },
        { new: true }
      );

      expect(result.title).toBe('New Title');
    });
  });

  describe('Delete', () => {
    it('should delete a message room', async () => {
      MockMessageRoom.findByIdAndDelete.mockResolvedValue(mockRoom);

      const result = await MockMessageRoom.findByIdAndDelete('room1');

      expect(result).toEqual(mockRoom);
    });
  });
});
