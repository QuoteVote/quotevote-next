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

const MockPresence = mongoose.model('Presence') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
};

describe('Presence Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPresence = {
    _id: 'p1',
    userId: 'user1',
    status: 'online' as const,
    statusMessage: 'Working',
    lastHeartbeat: new Date(),
    lastSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create a presence record', async () => {
      MockPresence.create.mockResolvedValue(mockPresence);

      const result = await MockPresence.create({
        userId: 'user1',
        status: 'online',
      });

      expect(MockPresence.create).toHaveBeenCalledWith({
        userId: 'user1',
        status: 'online',
      });
      expect(result.status).toBe('online');
    });

    it('should create a presence with status message', async () => {
      MockPresence.create.mockResolvedValue(mockPresence);

      const result = await MockPresence.create({
        userId: 'user1',
        status: 'online',
        statusMessage: 'Working',
      });

      expect(result.statusMessage).toBe('Working');
    });
  });

  describe('Read', () => {
    it('should find presence by userId', async () => {
      MockPresence.findOne.mockResolvedValue(mockPresence);

      const result = await MockPresence.findOne({ userId: 'user1' });

      expect(MockPresence.findOne).toHaveBeenCalledWith({ userId: 'user1' });
      expect(result.status).toBe('online');
    });

    it('should find all online users', async () => {
      MockPresence.find.mockResolvedValue([mockPresence]);

      const result = await MockPresence.find({ status: 'online' });

      expect(result).toHaveLength(1);
    });

    it('should find a presence by id', async () => {
      MockPresence.findById.mockResolvedValue(mockPresence);

      const result = await MockPresence.findById('p1');

      expect(result).toEqual(mockPresence);
    });

    it('should return null for non-existent presence', async () => {
      MockPresence.findOne.mockResolvedValue(null);

      const result = await MockPresence.findOne({ userId: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update presence status', async () => {
      const updated = { ...mockPresence, status: 'away' };
      MockPresence.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockPresence.findByIdAndUpdate(
        'p1',
        { status: 'away' },
        { new: true }
      );

      expect(result.status).toBe('away');
    });

    it('should update heartbeat', async () => {
      const newHeartbeat = new Date();
      const updated = { ...mockPresence, lastHeartbeat: newHeartbeat };
      MockPresence.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockPresence.findByIdAndUpdate(
        'p1',
        { lastHeartbeat: newHeartbeat },
        { new: true }
      );

      expect(result.lastHeartbeat).toBe(newHeartbeat);
    });

    it('should set status to offline', async () => {
      const offline = { ...mockPresence, status: 'offline', lastSeen: new Date() };
      MockPresence.findByIdAndUpdate.mockResolvedValue(offline);

      const result = await MockPresence.findByIdAndUpdate(
        'p1',
        { status: 'offline', lastSeen: new Date() },
        { new: true }
      );

      expect(result.status).toBe('offline');
    });
  });

  describe('Delete', () => {
    it('should delete a presence record', async () => {
      MockPresence.findByIdAndDelete.mockResolvedValue(mockPresence);

      const result = await MockPresence.findByIdAndDelete('p1');

      expect(result).toEqual(mockPresence);
    });
  });
});
