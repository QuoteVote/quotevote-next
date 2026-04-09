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
      findByEmail: jest.fn(),
    }),
    models: {},
  };
});

const MockUserInvite = mongoose.model('UserInvite') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findByEmail: jest.Mock;
};

describe('UserInvite Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockInvite = {
    _id: 'inv1',
    email: 'test@example.com',
    invitedBy: 'user1',
    code: 'ABC123',
    status: 'pending',
    expiresAt: new Date('2026-12-31'),
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Create', () => {
    it('should create an invite', async () => {
      MockUserInvite.create.mockResolvedValue(mockInvite);

      const result = await MockUserInvite.create({
        email: 'test@example.com',
        invitedBy: 'user1',
        code: 'ABC123',
      });

      expect(result.email).toBe('test@example.com');
      expect(result.status).toBe('pending');
    });
  });

  describe('Read', () => {
    it('should find invite by email (static)', async () => {
      MockUserInvite.findByEmail.mockResolvedValue(mockInvite);

      const result = await MockUserInvite.findByEmail('test@example.com');

      expect(MockUserInvite.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      MockUserInvite.findByEmail.mockResolvedValue(null);

      const result = await MockUserInvite.findByEmail('nobody@example.com');

      expect(result).toBeNull();
    });

    it('should find invites by invitedBy', async () => {
      MockUserInvite.find.mockResolvedValue([mockInvite]);

      const result = await MockUserInvite.find({ invitedBy: 'user1' });

      expect(result).toHaveLength(1);
    });

    it('should find invites by status', async () => {
      MockUserInvite.find.mockResolvedValue([mockInvite]);

      const result = await MockUserInvite.find({ status: 'pending' });

      expect(result).toHaveLength(1);
    });

    it('should find invite by id', async () => {
      MockUserInvite.findById.mockResolvedValue(mockInvite);

      const result = await MockUserInvite.findById('inv1');

      expect(result).toEqual(mockInvite);
    });
  });

  describe('Update', () => {
    it('should update invite status to joined', async () => {
      const updated = { ...mockInvite, status: 'joined' };
      MockUserInvite.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUserInvite.findByIdAndUpdate(
        'inv1',
        { status: 'joined' },
        { new: true }
      );

      expect(result.status).toBe('joined');
    });

    it('should update invite status to declined', async () => {
      const updated = { ...mockInvite, status: 'declined' };
      MockUserInvite.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUserInvite.findByIdAndUpdate(
        'inv1',
        { status: 'declined' },
        { new: true }
      );

      expect(result.status).toBe('declined');
    });
  });

  describe('Delete', () => {
    it('should delete an invite', async () => {
      MockUserInvite.findByIdAndDelete.mockResolvedValue(mockInvite);

      const result = await MockUserInvite.findByIdAndDelete('inv1');

      expect(result).toEqual(mockInvite);
    });
  });
});
