import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Activity from '~/data/models/Activity';

describe('Activity Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Activity();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.activityType).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Activity({
        userId: createObjectId(),
        activityType: 'POSTED',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Activity({
        userId: createObjectId(),
        activityType: 'VOTED',
      });
      expect(doc.created).toBeDefined();
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const postId = createObjectId();
      const voteId = createObjectId();
      const doc = new Activity({
        userId: createObjectId(),
        activityType: 'VOTED',
        postId,
        voteId,
        content: 'Voted on a post',
      });
      expect(doc.postId).toEqual(postId);
      expect(doc.content).toBe('Voted on a post');
    });
  });
});
