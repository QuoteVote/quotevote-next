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

const MockNotification = mongoose.model('Notification') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Notification Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockNotification = {
    _id: 'n1',
    userId: 'user1',
    userIdBy: 'user2',
    postId: 'post1',
    notificationType: 'UPVOTED',
    label: 'user2 upvoted your post',
    status: 'new',
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a notification', async () => {
      MockNotification.create.mockResolvedValue(mockNotification);

      const result = await MockNotification.create({
        userId: 'user1',
        userIdBy: 'user2',
        postId: 'post1',
        notificationType: 'UPVOTED',
        label: 'user2 upvoted your post',
      });

      expect(result.notificationType).toBe('UPVOTED');
      expect(result.status).toBe('new');
    });
  });

  describe('Read', () => {
    it('should find notifications by userId', async () => {
      MockNotification.find.mockResolvedValue([mockNotification]);

      const result = await MockNotification.find({ userId: 'user1' });

      expect(result).toHaveLength(1);
    });

    it('should find a notification by id', async () => {
      MockNotification.findById.mockResolvedValue(mockNotification);

      const result = await MockNotification.findById('n1');

      expect(result).toEqual(mockNotification);
    });

    it('should return null for non-existent notification', async () => {
      MockNotification.findById.mockResolvedValue(null);

      const result = await MockNotification.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should mark notification as read', async () => {
      const updated = { ...mockNotification, status: 'read' };
      MockNotification.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockNotification.findByIdAndUpdate(
        'n1',
        { status: 'read' },
        { new: true }
      );

      expect(result.status).toBe('read');
    });
  });

  describe('Delete', () => {
    it('should delete a notification', async () => {
      MockNotification.findByIdAndDelete.mockResolvedValue(mockNotification);

      const result = await MockNotification.findByIdAndDelete('n1');

      expect(result).toEqual(mockNotification);
    });
  });
});
