import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Tag from '~/data/models/Tag';

describe('Tag Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Tag();
      const errors = getValidationErrors(doc);
      expect(errors?.creatorId).toBeDefined();
      expect(errors?.title).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Tag({
        creatorId: createObjectId(),
        title: 'Test Tag',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Tag({
        creatorId: createObjectId(),
        title: 'Test Tag',
      });
      expect(doc.privacy).toBe('public');
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should reject invalid privacy enum', () => {
      const doc = new Tag({
        creatorId: createObjectId(),
        title: 'Test Tag',
        privacy: 'invalid',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.privacy).toBeDefined();
    });

    it('should accept valid privacy values', () => {
      for (const privacy of ['public', 'private', 'restricted']) {
        const doc = new Tag({
          creatorId: createObjectId(),
          title: 'Test',
          privacy,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional fields', () => {
      const doc = new Tag({
        creatorId: createObjectId(),
        title: 'Test',
        adminIds: [createObjectId()],
        allowedUserIds: [createObjectId()],
        url: 'test-Tag',
        description: 'A test Tag',
      });
      expect(doc.adminIds).toHaveLength(1);
      expect(doc.description).toBe('A test Tag');
    });
  });

  describe('Static Methods', () => {
    it('findByCreatorId should query by creatorId', async () => {
      const creatorId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Tag, 'find').mockResolvedValue([]);

      await Tag.findByCreatorId(creatorId);

      expect(findSpy).toHaveBeenCalledWith({ creatorId });
      findSpy.mockRestore();
    });
  });
});
