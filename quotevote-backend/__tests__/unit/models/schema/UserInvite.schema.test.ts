import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import UserInvite from '~/data/models/UserInvite';

describe('UserInvite Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new UserInvite();
      const errors = getValidationErrors(doc);
      expect(errors?.email).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new UserInvite({ email: 'test@example.com' });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new UserInvite({ email: 'test@example.com' });
      expect(doc.status).toBe('pending');
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should lowercase and trim email', () => {
      const doc = new UserInvite({ email: '  TEST@EXAMPLE.COM  ' });
      expect(doc.email).toBe('test@example.com');
    });

    it('should accept optional fields', () => {
      const doc = new UserInvite({
        email: 'test@example.com',
        invitedBy: createObjectId(),
        code: 'INVITE123',
        expiresAt: new Date(),
      });
      expect(doc.code).toBe('INVITE123');
      expect(doc.invitedBy).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('findByEmail should lowercase and use findOne', async () => {
      const findOneSpy = jest.spyOn(UserInvite, 'findOne').mockResolvedValue(null);

      await UserInvite.findByEmail('TEST@EXAMPLE.COM');

      expect(findOneSpy).toHaveBeenCalledWith({ email: 'test@example.com' });
      findOneSpy.mockRestore();
    });
  });
});
