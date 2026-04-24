import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import BotReport from '~/data/models/BotReport';

describe('BotReport Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new BotReport();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.reporterId).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new BotReport({
        userId: createObjectId(),
        reporterId: createObjectId(),
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new BotReport({
        userId: createObjectId(),
        reporterId: createObjectId(),
      });
      expect(doc.created).toBeInstanceOf(Date);
    });
  });
});
