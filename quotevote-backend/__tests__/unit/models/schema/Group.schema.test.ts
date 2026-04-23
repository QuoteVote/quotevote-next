import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Group from '~/data/models/Group';

describe('Group Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Group();
      const errors = getValidationErrors(doc);
      expect(errors?.creatorId).toBeDefined();
      expect(errors?.title).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Group({
        creatorId: createObjectId(),
        title: 'Test Group',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Group({
        creatorId: createObjectId(),
        title: 'Test Group',
      });
      expect(doc.privacy).toBe('public');
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should reject invalid privacy enum', () => {
      const doc = new Group({
        creatorId: createObjectId(),
        title: 'Test Group',
        privacy: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.privacy).toBeDefined();
    });

    it('should accept valid privacy values', () => {
      for (const privacy of ['public', 'private', 'restricted']) {
        const doc = new Group({
          creatorId: createObjectId(),
          title: 'Test',
          privacy,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional fields', () => {
      const doc = new Group({
        creatorId: createObjectId(),
        title: 'Test',
        adminIds: [createObjectId()],
        allowedUserIds: [createObjectId()],
        url: 'test-group',
        description: 'A test group',
      });
      expect(doc.adminIds).toHaveLength(1);
      expect(doc.description).toBe('A test group');
    });
  });

  describe('Static Methods', () => {
    it('findByCreatorId should query by creatorId', async () => {
      const creatorId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Group, 'find').mockResolvedValue([]);

      await Group.findByCreatorId(creatorId);

      expect(findSpy).toHaveBeenCalledWith({ creatorId });
      findSpy.mockRestore();
    });
  });
});
