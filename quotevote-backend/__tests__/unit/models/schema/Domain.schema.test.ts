import { getValidationErrors, closeConnection } from './_helpers';
import Domain from '~/data/models/Domain';

describe('Domain Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Domain();
      const errors = getValidationErrors(doc);
      expect(errors?.key).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Domain({ key: 'example.com' });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new Domain({ key: 'example.com' });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional name', () => {
      const doc = new Domain({ key: 'example.com', name: 'Example Domain' });
      expect(doc.name).toBe('Example Domain');
    });
  });
});
