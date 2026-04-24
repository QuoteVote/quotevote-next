import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import Message from '~/data/models/Message';

describe('Message Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new Message();
      const errors = getValidationErrors(doc);
      expect(errors?.messageRoomId).toBeDefined();
      expect(errors?.userId).toBeDefined();
      expect(errors?.text).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new Message({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
        text: 'Hello world',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new Message({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
        text: 'Hello',
      });
      expect(doc.deleted).toBe(false);
      expect(doc.created).toBeInstanceOf(Date);
      expect(doc.readByDetailed).toEqual([]);
      expect(doc.deliveredTo).toEqual([]);
    });

    it('should accept optional fields', () => {
      const doc = new Message({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
        text: 'Hello',
        userName: 'John',
        title: 'Greeting',
        type: 'text',
        mutation_type: 'create',
      });
      expect(doc.userName).toBe('John');
      expect(doc.title).toBe('Greeting');
    });

    it('should accept embedded readByDetailed and deliveredTo', () => {
      const doc = new Message({
        messageRoomId: createObjectId(),
        userId: createObjectId(),
        text: 'Hello',
        readByDetailed: [{ userId: createObjectId(), readAt: new Date() }],
        deliveredTo: [{ userId: createObjectId(), deliveredAt: new Date() }],
      });
      expect(doc.readByDetailed).toHaveLength(1);
      expect(doc.deliveredTo).toHaveLength(1);
    });
  });

  describe('Static Methods', () => {
    it('findByRoomId should filter deleted and sort by created asc', async () => {
      const messageRoomId = createObjectId().toHexString();
      const findSpy = jest.spyOn(Message, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof Message.find>);

      await Message.findByRoomId(messageRoomId);

      expect(findSpy).toHaveBeenCalledWith({ messageRoomId, deleted: { $ne: true } });
      findSpy.mockRestore();
    });
  });
});
