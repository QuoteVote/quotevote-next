import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Presence from '~/data/models/Presence';

describe('Presence Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Presence();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Presence({ userId: createObjectId() });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Presence({ userId: createObjectId() });
      expect(doc.status).toBe('offline');
      expect(doc.lastHeartbeat).toBeInstanceOf(Date);
      expect(doc.lastSeen).toBeInstanceOf(Date);
    });

    it('should reject invalid status enum', () => {
      const doc = new Presence({
        userId: createObjectId(),
        status: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.status).toBeDefined();
    });

    it('should accept all valid status values', () => {
      for (const status of ['online', 'away', 'dnd', 'offline', 'invisible']) {
        const doc = new Presence({ userId: createObjectId(), status });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional statusMessage', () => {
      const doc = new Presence({
        userId: createObjectId(),
        statusMessage: 'Working on a feature',
      });
      expect(doc.statusMessage).toBe('Working on a feature');
    });
  });

  describe('Static Methods', () => {
    it('findByUserId should use findOne', async () => {
      const userId = createObjectId().toHexString();
      const findOneSpy = jest.spyOn(Presence, 'findOne').mockResolvedValue(null);

      await Presence.findByUserId(userId);

      expect(findOneSpy).toHaveBeenCalledWith({ userId });
      findOneSpy.mockRestore();
    });

    it('updateHeartbeat should use findOneAndUpdate with upsert', async () => {
      const userId = createObjectId().toHexString();
      const findOneAndUpdateSpy = jest
        .spyOn(Presence, 'findOneAndUpdate')
        .mockResolvedValue(null);

      await Presence.updateHeartbeat(userId);

      expect(findOneAndUpdateSpy).toHaveBeenCalledWith(
        { userId },
        expect.objectContaining({ status: 'online' }),
        expect.objectContaining({ upsert: true, new: true, setDefaultsOnInsert: true })
      );
      findOneAndUpdateSpy.mockRestore();
    });
  });
});
