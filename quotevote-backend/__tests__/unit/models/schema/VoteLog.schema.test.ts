import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import VoteLog from '~/data/models/VoteLog';

describe('VoteLog Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new VoteLog();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.voteId).toBeDefined();
      expect(errors?.postId).toBeDefined();
      expect(errors?.description).toBeDefined();
      expect(errors?.type).toBeDefined();
      expect(errors?.tokens).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new VoteLog({
        userId: createObjectId(),
        voteId: createObjectId(),
        postId: createObjectId(),
        description: 'Upvoted a post',
        type: 'up',
        tokens: 10,
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new VoteLog({
        userId: createObjectId(),
        voteId: createObjectId(),
        postId: createObjectId(),
        description: 'Upvoted',
        type: 'up',
        tokens: 10,
      });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should reject invalid type enum', () => {
      const doc = new VoteLog({
        userId: createObjectId(),
        voteId: createObjectId(),
        postId: createObjectId(),
        description: 'Voted',
        type: 'invalid',
        tokens: 10,
      });
      const errors = getValidationErrors(doc);
      expect(errors?.type).toBeDefined();
    });

    it('should accept valid type values', () => {
      for (const type of ['up', 'down']) {
        const doc = new VoteLog({
          userId: createObjectId(),
          voteId: createObjectId(),
          postId: createObjectId(),
          description: 'Voted',
          type,
          tokens: 5,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional fields', () => {
      const doc = new VoteLog({
        userId: createObjectId(),
        voteId: createObjectId(),
        postId: createObjectId(),
        description: 'Upvoted',
        type: 'up',
        tokens: 10,
        title: 'Post Title',
        author: 'John Doe',
        action: 'upvote',
      });
      expect(doc.title).toBe('Post Title');
      expect(doc.author).toBe('John Doe');
      expect(doc.action).toBe('upvote');
    });
  });
});
