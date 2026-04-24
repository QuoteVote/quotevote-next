import { createObjectId, getValidationErrors, closeConnection } from './_helpers';
import MessageRoom from '~/data/models/MessageRoom';

describe('MessageRoom Schema', () => {
  afterAll(async () => { await closeConnection(); });

  describe('Validation', () => {
    it('should be invalid if required fields are empty', () => {
      const doc = new MessageRoom();
      const errors = getValidationErrors(doc);
      expect(errors?.messageType).toBeDefined();
    });

    it('should be valid with all required fields', () => {
      const doc = new MessageRoom({
        users: [createObjectId()],
        messageType: 'USER',
      });
      expect(getValidationErrors(doc)).toBeUndefined();
    });

    it('should set default values', () => {
      const doc = new MessageRoom({
        users: [createObjectId()],
        messageType: 'USER',
      });
      expect(doc.isDirect).toBe(false);
      expect(doc.lastActivity).toBeInstanceOf(Date);
      expect(doc.created).toBeInstanceOf(Date);
    });

    it('should reject invalid messageType enum', () => {
      const doc = new MessageRoom({
        users: [createObjectId()],
        messageType: 'INVALID',
      });
      const errors = getValidationErrors(doc);
      expect(errors?.messageType).toBeDefined();
    });

    it('should accept valid messageType values', () => {
      for (const messageType of ['USER', 'POST']) {
        const doc = new MessageRoom({
          users: [createObjectId()],
          messageType,
        });
        expect(getValidationErrors(doc)).toBeUndefined();
      }
    });

    it('should accept optional fields', () => {
      const doc = new MessageRoom({
        users: [createObjectId(), createObjectId()],
        messageType: 'POST',
        postId: createObjectId(),
        title: 'Room Title',
        avatar: 'avatar.png',
        isDirect: true,
      });
      expect(doc.title).toBe('Room Title');
      expect(doc.isDirect).toBe(true);
    });
  });

  describe('Static Methods', () => {
    it('findByUserId should query and sort by lastActivity desc', async () => {
      const userId = createObjectId().toHexString();
      const findSpy = jest.spyOn(MessageRoom, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      } as unknown as ReturnType<typeof MessageRoom.find>);

      await MessageRoom.findByUserId(userId);

      expect(findSpy).toHaveBeenCalledWith({ users: userId });
      findSpy.mockRestore();
    });

    it('findByPostId should use findOne', async () => {
      const postId = createObjectId().toHexString();
      const findOneSpy = jest.spyOn(MessageRoom, 'findOne').mockResolvedValue(null);

      await MessageRoom.findByPostId(postId);

      expect(findOneSpy).toHaveBeenCalledWith({ postId });
      findOneSpy.mockRestore();
    });

    it('findBetweenUsers should query $all with isDirect', async () => {
      const userId1 = createObjectId().toHexString();
      const userId2 = createObjectId().toHexString();
      const findOneSpy = jest.spyOn(MessageRoom, 'findOne').mockResolvedValue(null);

      await MessageRoom.findBetweenUsers(userId1, userId2);

      expect(findOneSpy).toHaveBeenCalledWith({
        users: { $all: [userId1, userId2] },
        isDirect: true,
      });
      findOneSpy.mockRestore();
    });
  });
});
