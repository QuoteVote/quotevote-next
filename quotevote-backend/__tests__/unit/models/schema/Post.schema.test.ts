import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Post from '~/data/models/Post';

describe('Post Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Post();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.groupId).toBeDefined();
      expect(errors?.title).toBeDefined();
      expect(errors?.text).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Post({
        userId: createObjectId(),
        groupId: createObjectId(),
        title: 'Test Post',
        text: 'Post body content',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Post({
        userId: createObjectId(),
        groupId: createObjectId(),
        title: 'Test',
        text: 'Body',
      });
      expect(doc.downvotes).toBe(0);
      expect(doc.upvotes).toBe(0);
      expect(doc.reported).toBe(0);
      expect(doc.deleted).toBe(false);
      expect(doc.enable_voting).toBe(false);
      expect(doc.dayPoints).toBe(0);
      expect(doc.citationUrl).toBeNull();
      expect(doc.created).toBeInstanceOf(Date);
      expect(doc.pointTimestamp).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Post({
        userId: createObjectId(),
        groupId: createObjectId(),
        title: 'Test',
        text: 'Body',
        url: 'https://example.com',
        citationUrl: 'https://example.com/source',
        enable_voting: true,
        featuredSlot: 3,
        messageRoomId: 'room1',
        urlId: 'url1',
      });
      expect(doc.url).toBe('https://example.com');
      expect(doc.enable_voting).toBe(true);
      expect(doc.featuredSlot).toBe(3);
    });

    it('should reject featuredSlot below min', () => {
      const doc = new Post({
        userId: createObjectId(),
        groupId: createObjectId(),
        title: 'Test',
        text: 'Body',
        featuredSlot: 0,
      });
      const errors = getValidationErrors(doc);
      expect(errors?.featuredSlot).toBeDefined();
    });

    it('should reject featuredSlot above max', () => {
      const doc = new Post({
        userId: createObjectId(),
        groupId: createObjectId(),
        title: 'Test',
        text: 'Body',
        featuredSlot: 13,
      });
      const errors = getValidationErrors(doc);
      expect(errors?.featuredSlot).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('findByUserId should query by userId', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Post, 'find').mockResolvedValue([]);

      await Post.findByUserId(userId);

      expect(findSpy).toHaveBeenCalledWith({ userId });
      findSpy.mockRestore();
    });

    it('findFeatured should query featured slots with sort and limit', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const findSpy = jest.spyOn(Post, 'find').mockReturnValue({
        sort: sortMock,
      } as unknown as ReturnType<typeof Post.find>);

      await Post.findFeatured(6);

      expect(findSpy).toHaveBeenCalledWith({ featuredSlot: { $exists: true, $ne: null } });
      expect(sortMock).toHaveBeenCalledWith({ featuredSlot: 1 });
      expect(limitMock).toHaveBeenCalledWith(6);
      findSpy.mockRestore();
    });

    it('findFeatured should default limit to 12', async () => {
      const limitMock = jest.fn().mockResolvedValue([]);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      const findSpy = jest.spyOn(Post, 'find').mockReturnValue({
        sort: sortMock,
      } as unknown as ReturnType<typeof Post.find>);

      await Post.findFeatured();

      expect(limitMock).toHaveBeenCalledWith(12);
      findSpy.mockRestore();
    });
  });
});
