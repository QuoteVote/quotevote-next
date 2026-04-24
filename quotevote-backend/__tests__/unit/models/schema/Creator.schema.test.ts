import { getValidationErrors, closeConnection } from './_helpers';
import Creator from '~/data/models/Creator';

describe('Creator Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Creator();
      const errors = getValidationErrors(doc);
      expect(errors?.name).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Creator({ name: 'Test Creator' });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new Creator({ name: 'Test Creator' });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Creator({
        name: 'Test Creator',
        avatar: 'https://example.com/avatar.jpg',
        bio: 'A test creator bio',
      });
      expect(doc.avatar).toBe('https://example.com/avatar.jpg');
      expect(doc.bio).toBe('A test creator bio');
    });
  });
});
