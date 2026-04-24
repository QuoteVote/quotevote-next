import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import UserReport from '~/data/models/UserReport';

describe('UserReport Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new UserReport();
      const errors = getValidationErrors(doc);
      expect(errors?.reporterId).toBeDefined();
      expect(errors?.reportedUserId).toBeDefined();
      expect(errors?.reason).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'spam',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'spam',
      });
      expect(doc.status).toBe('pending');
      expect(doc.severity).toBe('medium');
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should reject invalid reason enum', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'invalid_reason',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.reason).toBeDefined();
    });

    it('should accept all valid reason values', () => {
      for (const reason of ['spam', 'harassment', 'inappropriate_content', 'fake_account', 'other']) {
        const doc = new UserReport({
          reporterId: createObjectId(),
          reportedUserId: createObjectId(),
          reason,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should reject invalid status enum', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'spam',
        status: 'invalid_status',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.status).toBeDefined();
    });

    it('should accept all valid status values', () => {
      for (const status of ['pending', 'reviewed', 'resolved', 'dismissed']) {
        const doc = new UserReport({
          reporterId: createObjectId(),
          reportedUserId: createObjectId(),
          reason: 'spam',
          status,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should reject invalid severity enum', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'spam',
        severity: 'invalid_severity',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.severity).toBeDefined();
    });

    it('should accept all valid severity values', () => {
      for (const severity of ['low', 'medium', 'high', 'critical']) {
        const doc = new UserReport({
          reporterId: createObjectId(),
          reportedUserId: createObjectId(),
          reason: 'spam',
          severity,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional description and adminNotes', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'harassment',
        description: 'User sent abusive messages',
        adminNotes: 'Reviewed and confirmed',
      });
      expect(doc.description).toBe('User sent abusive messages');
      expect(doc.adminNotes).toBe('Reviewed and confirmed');
    });

    it('should reject description exceeding maxlength', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'spam',
        description: 'a'.repeat(501),
      });
      const errors = getValidationErrors(doc);
      expect(errors?.description).toBeDefined();
    });

    it('should reject adminNotes exceeding maxlength', () => {
      const doc = new UserReport({
        reporterId: createObjectId(),
        reportedUserId: createObjectId(),
        reason: 'spam',
        adminNotes: 'a'.repeat(1001),
      });
      const errors = getValidationErrors(doc);
      expect(errors?.adminNotes).toBeDefined();
    });
  });
});
