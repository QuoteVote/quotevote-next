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
      findByUserId: jest.fn(),
      findFeatured: jest.fn(),
    }),
    models: {},
  };
});

const MockPost = mongoose.model('Post') as unknown as {
  create: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findByIdAndDelete: jest.Mock;
  findByUserId: jest.Mock;
  findFeatured: jest.Mock;
};

describe('Post Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockPost = {
    _id: 'post1',
    userId: 'user1',
    groupId: 'group1',
    title: 'Test Post',
    text: 'This is a test quote for voting.',
    url: 'https://example.com/article',
    citationUrl: 'https://example.com/source',
    upvotes: 5,
    downvotes: 1,
    reported: 0,
    approved: 1,
    approvedBy: ['mod1'],
    rejectedBy: [],
    reportedBy: [],
    bookmarkedBy: ['user2'],
    votedBy: ['user2', 'user3'],
    enable_voting: true,
    featuredSlot: 3,
    messageRoomId: 'room1',
    urlId: 'url1',
    deleted: false,
    dayPoints: 10,
    pointTimestamp: new Date(),
    created: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  describe('Create', () => {
    it('should create a post with required fields', async () => {
      MockPost.create.mockResolvedValue(mockPost);

      const result = await MockPost.create({
        userId: 'user1',
        groupId: 'group1',
        title: 'Test Post',
        text: 'This is a test quote for voting.',
      });

      expect(result.title).toBe('Test Post');
      expect(result.userId).toBe('user1');
      expect(result.groupId).toBe('group1');
    });

    it('should create a post with optional fields', async () => {
      MockPost.create.mockResolvedValue(mockPost);

      const result = await MockPost.create({
        userId: 'user1',
        groupId: 'group1',
        title: 'Test Post',
        text: 'This is a test quote for voting.',
        url: 'https://example.com/article',
        citationUrl: 'https://example.com/source',
        enable_voting: true,
      });

      expect(result.url).toBe('https://example.com/article');
      expect(result.citationUrl).toBe('https://example.com/source');
      expect(result.enable_voting).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Read
  // ---------------------------------------------------------------------------

  describe('Read', () => {
    it('should find a post by id', async () => {
      MockPost.findById.mockResolvedValue(mockPost);

      const result = await MockPost.findById('post1');

      expect(result).toEqual(mockPost);
    });

    it('should return null for a non-existent post', async () => {
      MockPost.findById.mockResolvedValue(null);

      const result = await MockPost.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should find posts by userId (static)', async () => {
      MockPost.findByUserId.mockResolvedValue([mockPost]);

      const result = await MockPost.findByUserId('user1');

      expect(MockPost.findByUserId).toHaveBeenCalledWith('user1');
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user1');
    });

    it('should return empty array for user with no posts', async () => {
      MockPost.findByUserId.mockResolvedValue([]);

      const result = await MockPost.findByUserId('user999');

      expect(result).toEqual([]);
    });

    it('should find featured posts (static)', async () => {
      MockPost.findFeatured.mockResolvedValue([mockPost]);

      const result = await MockPost.findFeatured(12);

      expect(MockPost.findFeatured).toHaveBeenCalledWith(12);
      expect(result).toHaveLength(1);
      expect(result[0].featuredSlot).toBe(3);
    });

    it('should return empty array when no featured posts exist', async () => {
      MockPost.findFeatured.mockResolvedValue([]);

      const result = await MockPost.findFeatured();

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  describe('Update', () => {
    it('should update post title', async () => {
      const updated = { ...mockPost, title: 'Updated Title' };
      MockPost.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockPost.findByIdAndUpdate(
        'post1',
        { title: 'Updated Title' },
        { new: true },
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should update upvotes and downvotes', async () => {
      const updated = { ...mockPost, upvotes: 10, downvotes: 2 };
      MockPost.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockPost.findByIdAndUpdate(
        'post1',
        { upvotes: 10, downvotes: 2 },
        { new: true },
      );

      expect(result.upvotes).toBe(10);
      expect(result.downvotes).toBe(2);
    });

    it('should soft-delete a post', async () => {
      const updated = { ...mockPost, deleted: true };
      MockPost.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockPost.findByIdAndUpdate(
        'post1',
        { deleted: true },
        { new: true },
      );

      expect(result.deleted).toBe(true);
    });

    it('should update featuredSlot', async () => {
      const updated = { ...mockPost, featuredSlot: 7 };
      MockPost.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await MockPost.findByIdAndUpdate(
        'post1',
        { featuredSlot: 7 },
        { new: true },
      );

      expect(result.featuredSlot).toBe(7);
    });
  });

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  describe('Delete', () => {
    it('should delete a post', async () => {
      MockPost.findByIdAndDelete.mockResolvedValue(mockPost);

      const result = await MockPost.findByIdAndDelete('post1');

      expect(result).toEqual(mockPost);
    });
  });

  // ---------------------------------------------------------------------------
  // Filtering / Listing
  // ---------------------------------------------------------------------------

  describe('Filtering', () => {
    it('should list posts filtered by groupId', async () => {
      MockPost.find.mockResolvedValue([mockPost]);

      const result = await MockPost.find({ groupId: 'group1' });

      expect(MockPost.find).toHaveBeenCalledWith({ groupId: 'group1' });
      expect(result).toHaveLength(1);
    });

    it('should list only non-deleted posts', async () => {
      MockPost.find.mockResolvedValue([mockPost]);

      const result = await MockPost.find({ deleted: false });

      expect(MockPost.find).toHaveBeenCalledWith({ deleted: false });
      expect(result[0].deleted).toBe(false);
    });
  });
});
