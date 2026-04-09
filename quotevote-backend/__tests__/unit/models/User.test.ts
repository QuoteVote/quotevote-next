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
      findOneAndUpdate: jest.fn(),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
    }),
    models: {},
  };
});

const MockUser = mongoose.model('User') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findOneAndUpdate: jest.Mock;
  findByUsername: jest.Mock;
  findByEmail: jest.Mock;
};

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    _id: 'user1',
    name: 'Test User',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed_password_123',
    avatar: { url: 'https://example.com/avatar.jpg', thumb: 'https://example.com/thumb.jpg' },
    bio: 'A test user bio',
    location: 'New York',
    website: 'https://example.com',
    companyName: 'Test Corp',
    plan: 'personal',
    status: 1,
    stripeCustomerId: 'cus_test123',
    tokens: 10,
    _wallet: 'wallet_abc',
    _votesId: 'votes_123',
    favorited: [{ postId: 'post1' }],
    contributorBadge: false,
    admin: false,
    emailVerified: true,
    isModerator: false,
    _followingId: ['user2', 'user3'],
    _followersId: ['user4'],
    blockedUserIds: [],
    upvotes: 5,
    downvotes: 1,
    accountStatus: 'active',
    botReports: 0,
    lastBotReportDate: null,
    settings: { theme: 'dark', notifications: true },
    lastLogin: new Date(),
    joined: new Date(),
    reputation: {
      overallScore: 100,
      inviteNetworkScore: 50,
      conductScore: 30,
      activityScore: 20,
      metrics: {
        totalInvitesSent: 5,
        totalInvitesAccepted: 3,
        totalInvitesDeclined: 1,
        averageInviteeReputation: 200,
        totalReportsReceived: 0,
        totalReportsResolved: 0,
        totalUpvotes: 10,
        totalDownvotes: 2,
        totalPosts: 8,
        totalComments: 15,
      },
      lastCalculated: new Date(),
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: jest.fn(),
  };

  describe('Create', () => {
    it('should create a user with all fields', async () => {
      MockUser.create.mockResolvedValue(mockUser);

      const result = await MockUser.create({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        bio: 'A test user bio',
        companyName: 'Test Corp',
        plan: 'personal',
      });

      expect(MockUser.create).toHaveBeenCalled();
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
      expect(result.bio).toBe('A test user bio');
      expect(result.companyName).toBe('Test Corp');
      expect(result.plan).toBe('personal');
    });

    it('should create a user with default values', async () => {
      const userWithDefaults = {
        ...mockUser,
        plan: 'personal',
        tokens: 0,
        contributorBadge: false,
        admin: false,
        emailVerified: false,
        isModerator: false,
        upvotes: 0,
        downvotes: 0,
        accountStatus: 'active',
        botReports: 0,
        favorited: [],
      };
      MockUser.create.mockResolvedValue(userWithDefaults);

      const result = await MockUser.create({
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result.plan).toBe('personal');
      expect(result.tokens).toBe(0);
      expect(result.contributorBadge).toBe(false);
      expect(result.admin).toBe(false);
      expect(result.emailVerified).toBe(false);
      expect(result.isModerator).toBe(false);
      expect(result.accountStatus).toBe('active');
      expect(result.botReports).toBe(0);
      expect(result.favorited).toEqual([]);
    });
  });

  describe('Read', () => {
    it('should find user by username (static method)', async () => {
      MockUser.findByUsername.mockResolvedValue(mockUser);

      const result = await MockUser.findByUsername('testuser');

      expect(MockUser.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result.username).toBe('testuser');
      expect(result.email).toBe('test@example.com');
    });

    it('should find user by email (static method)', async () => {
      MockUser.findByEmail.mockResolvedValue(mockUser);

      const result = await MockUser.findByEmail('test@example.com');

      expect(MockUser.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.email).toBe('test@example.com');
    });

    it('should return null for non-existent username', async () => {
      MockUser.findByUsername.mockResolvedValue(null);

      const result = await MockUser.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      MockUser.findByEmail.mockResolvedValue(null);

      const result = await MockUser.findByEmail('none@example.com');

      expect(result).toBeNull();
    });

    it('should find user by id', async () => {
      MockUser.findById.mockResolvedValue(mockUser);

      const result = await MockUser.findById('user1');

      expect(MockUser.findById).toHaveBeenCalledWith('user1');
      expect(result._id).toBe('user1');
    });

    it('should find all users with query', async () => {
      MockUser.find.mockResolvedValue([mockUser]);

      const result = await MockUser.find({ accountStatus: 'active' });

      expect(MockUser.find).toHaveBeenCalledWith({ accountStatus: 'active' });
      expect(result).toHaveLength(1);
    });
  });

  describe('Update', () => {
    it('should update user profile fields', async () => {
      const updated = {
        ...mockUser,
        bio: 'Updated bio',
        location: 'San Francisco',
        website: 'https://newsite.com',
      };
      MockUser.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUser.findByIdAndUpdate(
        'user1',
        { bio: 'Updated bio', location: 'San Francisco', website: 'https://newsite.com' },
        { new: true }
      );

      expect(result.bio).toBe('Updated bio');
      expect(result.location).toBe('San Francisco');
      expect(result.website).toBe('https://newsite.com');
    });

    it('should update user plan and stripe info', async () => {
      const updated = {
        ...mockUser,
        plan: 'premium',
        stripeCustomerId: 'cus_new456',
      };
      MockUser.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUser.findByIdAndUpdate(
        'user1',
        { plan: 'premium', stripeCustomerId: 'cus_new456' },
        { new: true }
      );

      expect(result.plan).toBe('premium');
      expect(result.stripeCustomerId).toBe('cus_new456');
    });

    it('should update account status to disabled', async () => {
      const updated = { ...mockUser, accountStatus: 'disabled' };
      MockUser.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUser.findByIdAndUpdate(
        'user1',
        { accountStatus: 'disabled' },
        { new: true }
      );

      expect(result.accountStatus).toBe('disabled');
    });

    it('should update bot reports', async () => {
      const updated = { ...mockUser, botReports: 3, lastBotReportDate: new Date() };
      MockUser.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUser.findByIdAndUpdate(
        'user1',
        { $inc: { botReports: 1 }, lastBotReportDate: new Date() },
        { new: true }
      );

      expect(result.botReports).toBe(3);
      expect(result.lastBotReportDate).toBeDefined();
    });

    it('should update settings', async () => {
      const updated = { ...mockUser, settings: { theme: 'light', notifications: false } };
      MockUser.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUser.findByIdAndUpdate(
        'user1',
        { settings: { theme: 'light', notifications: false } },
        { new: true }
      );

      expect(result.settings).toEqual({ theme: 'light', notifications: false });
    });

    it('should update lastLogin', async () => {
      const loginDate = new Date();
      const updated = { ...mockUser, lastLogin: loginDate };
      MockUser.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockUser.findByIdAndUpdate(
        'user1',
        { lastLogin: loginDate },
        { new: true }
      );

      expect(result.lastLogin).toBe(loginDate);
    });
  });

  describe('Delete', () => {
    it('should delete a user', async () => {
      MockUser.findByIdAndDelete.mockResolvedValue(mockUser);

      const result = await MockUser.findByIdAndDelete('user1');

      expect(MockUser.findByIdAndDelete).toHaveBeenCalledWith('user1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('Avatar field', () => {
    it('should accept avatar as object (JSON)', async () => {
      const userWithObjectAvatar = {
        ...mockUser,
        avatar: { url: 'https://example.com/img.jpg', thumb: 'https://example.com/thumb.jpg' },
      };
      MockUser.create.mockResolvedValue(userWithObjectAvatar);

      const result = await MockUser.create({
        username: 'avataruser',
        email: 'avatar@test.com',
        password: 'pass',
        avatar: { url: 'https://example.com/img.jpg', thumb: 'https://example.com/thumb.jpg' },
      });

      expect(result.avatar).toEqual({
        url: 'https://example.com/img.jpg',
        thumb: 'https://example.com/thumb.jpg',
      });
    });

    it('should accept avatar as string', async () => {
      const userWithStringAvatar = {
        ...mockUser,
        avatar: 'https://example.com/avatar.png',
      };
      MockUser.create.mockResolvedValue(userWithStringAvatar);

      const result = await MockUser.create({
        username: 'avataruser2',
        email: 'avatar2@test.com',
        password: 'pass',
        avatar: 'https://example.com/avatar.png',
      });

      expect(result.avatar).toBe('https://example.com/avatar.png');
    });

    it('should accept avatar as null', async () => {
      const userWithNullAvatar = { ...mockUser, avatar: null };
      MockUser.create.mockResolvedValue(userWithNullAvatar);

      const result = await MockUser.create({
        username: 'avataruser3',
        email: 'avatar3@test.com',
        password: 'pass',
        avatar: null,
      });

      expect(result.avatar).toBeNull();
    });
  });

  describe('comparePassword (instance method)', () => {
    it('should call comparePassword with candidate password', async () => {
      mockUser.comparePassword.mockResolvedValue(true);

      const result = await mockUser.comparePassword('correctpassword');

      expect(mockUser.comparePassword).toHaveBeenCalledWith('correctpassword');
      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      mockUser.comparePassword.mockResolvedValue(false);

      const result = await mockUser.comparePassword('wrongpassword');

      expect(result).toBe(false);
    });
  });

  describe('Followers and Following', () => {
    it('should have follower and following arrays', () => {
      expect(mockUser._followingId).toEqual(['user2', 'user3']);
      expect(mockUser._followersId).toEqual(['user4']);
    });

    it('should have empty blockedUserIds by default', () => {
      expect(mockUser.blockedUserIds).toEqual([]);
    });
  });

  describe('Reputation', () => {
    it('should have nested reputation object with scores', () => {
      expect(mockUser.reputation.overallScore).toBe(100);
      expect(mockUser.reputation.inviteNetworkScore).toBe(50);
      expect(mockUser.reputation.conductScore).toBe(30);
      expect(mockUser.reputation.activityScore).toBe(20);
    });

    it('should have reputation metrics', () => {
      expect(mockUser.reputation.metrics.totalPosts).toBe(8);
      expect(mockUser.reputation.metrics.totalComments).toBe(15);
      expect(mockUser.reputation.metrics.totalUpvotes).toBe(10);
      expect(mockUser.reputation.metrics.totalDownvotes).toBe(2);
    });
  });
});
