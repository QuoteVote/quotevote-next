import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Comment from '~/data/models/Comment';

describe('Comment Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Comment();
      const errors = getValidationErrors(doc);
      expect(errors?.content).toBeDefined();
      expect(errors?.userId).toBeDefined();
      expect(errors?.startWordIndex).toBeDefined();
      expect(errors?.endWordIndex).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Comment({
        content: 'Test comment',
        userId: createObjectId(),
        startWordIndex: 0,
        endWordIndex: 5,
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Comment({
        content: 'Test',
        userId: createObjectId(),
        startWordIndex: 0,
        endWordIndex: 5,
      });
      expect(doc.deleted).toBe(false);
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Comment({
        content: 'Test',
        userId: createObjectId(),
        startWordIndex: 0,
        endWordIndex: 5,
        postId: createObjectId(),
        url: 'https://example.com',
        reaction: 'like',
      });
      expect(doc.postId).toBeDefined();
      expect(doc.url).toBe('https://example.com');
      expect(doc.reaction).toBe('like');
    });
  });

  describe('Static Methods', () => {
    it('findByPostId should filter deleted and sort by created', async () => {
      const postId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Comment, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Comment.find>);

      await Comment.findByPostId(postId);

      expect(findSpy).toHaveBeenCalledWith({ postId, deleted: { $ne: true } });
      findSpy.mockRestore();
    });

    it('findByUserId should filter deleted and sort by created', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Comment, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Comment.find>);

      await Comment.findByUserId(userId);

      expect(findSpy).toHaveBeenCalledWith({ userId, deleted: { $ne: true } });
      findSpy.mockRestore();
    });
  });
});
