import mongoose from 'mongoose';
import Comment from '~/data/models/Comment';

describe('Comment Model', () => {
  beforeAll(async () => {
    // Connect to minimal mock or handle mock connection as in other models if needed.
    // For unit testing the schema definition, this might suffice.
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Schema Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const comment = new Comment();
      const err = comment.validateSync();
      expect(err?.errors.content).toBeDefined();
      expect(err?.errors.userId).toBeDefined();
      expect(err?.errors.startWordIndex).toBeDefined();
      expect(err?.errors.endWordIndex).toBeDefined();
    });

    it('should set default values', () => {
      const comment = new Comment({
        content: 'Test content',
        userId: new mongoose.Types.ObjectId(),
        startWordIndex: 0,
        endWordIndex: 5,
      });
      expect(comment.deleted).toBe(false);
      expect(comment.created).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('findByPostId should return query ignoring deleted comments', async () => {
      const postId = new mongoose.Types.ObjectId().toHexString();
      // Since it's a unit test without DB, we just ensure it builds the right query.
      // We can spy on Comment.find
      const findSpy = jest.spyOn(Comment, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await Comment.findByPostId(postId);

      expect(findSpy).toHaveBeenCalledWith({
        postId,
        deleted: { $ne: true },
      });

      findSpy.mockRestore();
    });

    it('findByUserId should return query ignoring deleted comments', async () => {
      const userId = new mongoose.Types.ObjectId().toHexString();
      const findSpy = jest.spyOn(Comment, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      await Comment.findByUserId(userId);

      expect(findSpy).toHaveBeenCalledWith({
        userId,
        deleted: { $ne: true },
      });

      findSpy.mockRestore();
    });
  });
});
