import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Reaction from '~/data/models/Reaction';

describe('Reaction Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Reaction();
      const errors = getValidationErrors(doc);
      expect(errors?.userId).toBeDefined();
      expect(errors?.emoji).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Reaction({
        userId: createObjectId(),
        emoji: '👍',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default created date', () => {
      const doc = new Reaction({
        userId: createObjectId(),
        emoji: '👍',
      });
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should accept optional messageId and actionId', () => {
      const doc = new Reaction({
        userId: createObjectId(),
        emoji: '❤️',
        messageId: createObjectId(),
        actionId: createObjectId(),
      });
      expect(doc.messageId).toBeDefined();
      expect(doc.actionId).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('findByActionId should query and sort by created desc', async () => {
      const actionId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Reaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Reaction.find>);

      await Reaction.findByActionId(actionId);

      expect(findSpy).toHaveBeenCalledWith({ actionId });
      findSpy.mockRestore();
    });

    it('findByMessageId should query and sort by created desc', async () => {
      const messageId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Reaction, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Reaction.find>);

      await Reaction.findByMessageId(messageId);

      expect(findSpy).toHaveBeenCalledWith({ messageId });
      findSpy.mockRestore();
    });
  });
});
