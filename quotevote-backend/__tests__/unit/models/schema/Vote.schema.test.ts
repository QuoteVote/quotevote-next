import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Vote from '~/data/models/Vote';

describe('Vote Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Vote();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.postId).toBeDefined();
      expect(errors?.type).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Vote({
        userId: createObjectId(),
        postId: createObjectId(),
        type: 'up',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Vote({
        userId: createObjectId(),
        postId: createObjectId(),
        type: 'up',
      });
      expect(doc.deleted).toBe(false);
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should reject invalid type enum', () => {
      const doc = new Vote({
        userId: createObjectId(),
        postId: createObjectId(),
        type: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.type).toBeDefined();
    });

    it('should accept valid enum values', () => {
      for (const type of ['up', 'down']) {
        const doc = new Vote({
          userId: createObjectId(),
          postId: createObjectId(),
          type,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional fields', () => {
      const doc = new Vote({
        userId: createObjectId(),
        postId: createObjectId(),
        type: 'up',
        startWordIndex: 0,
        endWordIndex: 5,
        tags: ['insightful'],
        content: 'Great point',
      });
      expect(doc.tags).toEqual(['insightful']);
      expect(doc.content).toBe('Great point');
    });
  });

  describe('Static Methods', () => {
    it('findByPostId should filter deleted and sort by created desc', async () => {
      const postId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Vote, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Vote.find>);

      await Vote.findByPostId(postId);

      expect(findSpy).toHaveBeenCalledWith({ postId, deleted: { $ne: true } });
      findSpy.mockRestore();
    });

    it('findByUserId should filter deleted and sort by created desc', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Vote, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Vote.find>);

      await Vote.findByUserId(userId);

      expect(findSpy).toHaveBeenCalledWith({ userId, deleted: { $ne: true } });
      findSpy.mockRestore();
    });
  });
});
