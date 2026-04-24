import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Content from '~/data/models/Content';

describe('Content Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Content();
      const errors = getValidationErrors(doc);
      expect(errors?.creatorId).toBeDefined();
      expect(errors?.title).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Content({
        creatorId: createObjectId(),
        title: 'Test Content',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new Content({
        creatorId: createObjectId(),
        title: 'Test Content',
      });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional fields', () => {
      const doc = new Content({
        creatorId: createObjectId(),
        title: 'Test Content',
        domainId: createObjectId(),
        url: 'https://example.com/article',
      });
      expect(doc.url).toBe('https://example.com/article');
    });
  });
});
