import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Typing from '~/data/models/Typing';

describe('Typing Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Typing();
      const errors = getValidationErrors(doc);
      expect(errors?.messageRoomId).toBeDefined();
      expect(errors?.userId).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Typing({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Typing({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
      });
      expect(doc.isTyping).toBe(true);
      expect(doc.timestamp).toBeInstanceOf(Date);
    });

    it('should define expiresAt field as Date', () => {
      // The pre-save hook sets expiresAt = Date.now() + 10000.
      // Full hook testing requires mongodb-memory-server.
      // Here we verify the field accepts Date values.
      const doc = new Typing({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
        expiresAt: new Date(Date.now() + 10000),
      });
      expect(doc.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Pre-save Hook', () => {
    // Note: The pre-save hook sets this.expiresAt = new Date(Date.now() + 10 * 1000).
    // This provides TTL-based auto-cleanup of stale typing indicators.
    // Full integration testing requires mongodb-memory-server.
    it('should have expiresAt field available for TTL index', () => {
      const future = new Date(Date.now() + 10000);
      const doc = new Typing({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
        expiresAt: future,
      });
      expect(doc.expiresAt!.getTime()).toBeGreaterThan(Date.now() - 1000);
    });
  });

  describe('Static Methods', () => {
    it('findByRoomId should query by messageRoomId and isTyping=true', async () => {
      const messageRoomId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Typing, 'find').mockResolvedValue([]);

      await Typing.findByRoomId(messageRoomId);

      expect(findSpy).toHaveBeenCalledWith({
        messageRoomId,
        isTyping: true,
      });
      findSpy.mockRestore();
    });
  });
});
