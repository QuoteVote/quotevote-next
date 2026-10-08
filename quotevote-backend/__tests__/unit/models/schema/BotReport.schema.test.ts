import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import BotReport from '~/data/models/BotReport';

describe('BotReport Schema', () => {
  afterAll(async () => {
    await closeConnection();
  });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new BotReport();
      const errors = getValidationErrors(doc);
      expect(errors?._reportedUserId).toBeDefined();
      expect(errors?._reporterId).toBeDefined();
    });

    it('should be valid with legacy required fields', () => {
      const doc = new BotReport({
        _reportedUserId: createObjectId(),
        _reporterId: createObjectId(),
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should be valid when instantiated with alias field names', () => {
      const doc = new BotReport({
        userId: createObjectId(),
        reporterId: createObjectId(),
      });
      expect(getValidationErrors(doc)).toBeUndefined();
      expect(doc._reportedUserId).toBeDefined();
      expect(doc._reporterId).toBeDefined();
      expect(doc.userId).toEqual(doc._reportedUserId);
      expect(doc.reporterId).toEqual(doc._reporterId);
    });

    it('should set default created date', () => {
      const doc = new BotReport({
        _reportedUserId: createObjectId(),
        _reporterId: createObjectId(),
      });
      expect(doc.created).toBeInstanceOf(Date);
    });
  });
});
