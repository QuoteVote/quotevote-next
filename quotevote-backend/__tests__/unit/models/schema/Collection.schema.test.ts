import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Collection from '~/data/models/Collection';

describe('Collection Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Collection();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.name).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Collection({
        userId: createObjectId(),
        name: 'My Collection',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new Collection({
        userId: createObjectId(),
        name: 'My Collection',
      });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Collection({
        userId: createObjectId(),
        name: 'My Collection',
        description: 'A test collection',
        postIds: [createObjectId(), createObjectId()],
      });
      expect(doc.description).toBe('A test collection');
      expect(doc.postIds).toHaveLength(2);
    });
  });
});
