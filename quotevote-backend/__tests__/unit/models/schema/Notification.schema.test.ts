import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Notification from '~/data/models/Notification';

describe('Notification Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Notification();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.userIdBy).toBeDefined();
      expect(errors?.notificationType).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Notification({
        userId: createObjectId(),
        userIdBy: createObjectId(),
        notificationType: 'FOLLOW',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Notification({
        userId: createObjectId(),
        userIdBy: createObjectId(),
        notificationType: 'UPVOTED',
      });
      expect(doc.status).toBe('new');
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Notification({
        userId: createObjectId(),
        userIdBy: createObjectId(),
        notificationType: 'COMMENTED',
        postId: createObjectId(),
        label: 'New comment on your post',
      });
      expect(doc.label).toBe('New comment on your post');
      expect(doc.postId).toBeDefined();
    });
  });
});
