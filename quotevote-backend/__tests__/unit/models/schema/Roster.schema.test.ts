import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Roster from '~/data/models/Roster';

describe('Roster Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Roster();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.buddyId).toBeDefined();
      expect(errors?.initiatedBy).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Roster({
        userId: createObjectId(),
        buddyId: createObjectId(),
        initiatedBy: createObjectId(),
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Roster({
        userId: createObjectId(),
        buddyId: createObjectId(),
        initiatedBy: createObjectId(),
      });
      expect(doc.status).toBe('pending');
      expect(doc.created).toBeInstanceOf(Date);
      expect(doc.updated).toBeInstanceOf(Date);
    });

    it('should reject invalid status enum', () => {
      const doc = new Roster({
        userId: createObjectId(),
        buddyId: createObjectId(),
        initiatedBy: createObjectId(),
        status: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.status).toBeDefined();
    });

    it('should accept all valid status values', () => {
      for (const status of ['pending', 'accepted', 'declined', 'blocked']) {
        const doc = new Roster({
          userId: createObjectId(),
          buddyId: createObjectId(),
          initiatedBy: createObjectId(),
          status,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });
  });

  describe('Pre-save Hook', () => {
    // Note: The pre-save hook sets this.updated = new Date() on every save.
    // Full integration testing of hooks requires mongodb-memory-server.
    // Here we verify the schema defines the 'updated' field with a Date default.
    it('should define updated field with Date default', () => {
      const doc = new Roster({
        userId: createObjectId(),
        buddyId: createObjectId(),
        initiatedBy: createObjectId(),
      });
      expect(doc.updated).toBeInstanceOf(Date);
    });
  });

  describe('Static Methods', () => {
    it('findByUserId should use $or for userId and buddyId', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Roster, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Roster.find>);

      await Roster.findByUserId(userId);

      expect(findSpy).toHaveBeenCalledWith({
        $or: [{ userId }, { buddyId: userId }],
      });
      findSpy.mockRestore();
    });

    it('findPendingRequests should filter by buddyId and pending status', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Roster, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Roster.find>);

      await Roster.findPendingRequests(userId);

      expect(findSpy).toHaveBeenCalledWith({
        buddyId: userId,
        status: 'pending',
      });
      findSpy.mockRestore();
    });

    it('findBlockedUsers should filter by userId and blocked status', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Roster, 'find').mockResolvedValue([]);

      await Roster.findBlockedUsers(userId);

      expect(findSpy).toHaveBeenCalledWith({
        userId,
        status: 'blocked',
      });
      findSpy.mockRestore();
    });
  });
});
