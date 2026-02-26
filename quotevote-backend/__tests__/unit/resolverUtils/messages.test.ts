/**
 * Test suite for message resolver utilities.
 */

import Message from '~/data/models/Message';
import MessageRoom from '~/data/models/MessageRoom';
import {
  getMessages,
  getUnreadMessages,
  addUserToPostRoom,
} from '~/data/resolvers/utils/messages';

jest.mock('~/data/models/Message', () => ({
  find: jest.fn(),
}));

const mockSave = jest.fn();
jest.mock('~/data/models/MessageRoom', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MockMessageRoom: any = jest.fn().mockImplementation((data: Record<string, unknown>) => {
    const doc: Record<string, unknown> = { ...data, _id: 'room-new' };
    mockSave.mockResolvedValue(doc);
    doc.save = mockSave;
    return doc;
  });
  MockMessageRoom.findOne = jest.fn();
  MockMessageRoom.findByIdAndUpdate = jest.fn();
  return MockMessageRoom;
});

describe('messages resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMessages', () => {
    it('should return non-deleted messages for a room', async () => {
      const messages = [
        { _id: 'm1', text: 'hello' },
        { _id: 'm2', text: 'world' },
      ];
      (Message.find as jest.Mock).mockResolvedValue(messages);

      const result = await getMessages('room1');

      expect(Message.find).toHaveBeenCalledWith({
        messageRoomId: 'room1',
        deleted: { $ne: true },
      });
      expect(result).toEqual(messages);
    });

    it('should return empty array when no messages', async () => {
      (Message.find as jest.Mock).mockResolvedValue([]);

      const result = await getMessages('room1');
      expect(result).toEqual([]);
    });
  });

  describe('getUnreadMessages', () => {
    it('should return unread messages excluding own messages', async () => {
      const unread = [{ _id: 'm1', text: 'new msg' }];
      (Message.find as jest.Mock).mockResolvedValue(unread);

      const result = await getUnreadMessages('room1', 'user1');

      expect(Message.find).toHaveBeenCalledWith({
        messageRoomId: 'room1',
        userId: { $ne: 'user1' },
        readBy: { $nin: ['user1'] },
        deleted: { $ne: true },
      });
      expect(result).toEqual(unread);
    });
  });

  describe('addUserToPostRoom', () => {
    it('should create a new room if none exists for the post', async () => {
      (MessageRoom.findOne as jest.Mock).mockResolvedValue(null);

      const result = await addUserToPostRoom('663a1234567890abcdef1234', '663a1234567890abcdef5678');

      expect(MessageRoom.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ messageType: 'POST' })
      );
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should add user to existing room if not already a member', async () => {
      const existingRoom = {
        _id: 'room1',
        users: [{ toString: () => '663a1234567890abcdef9999' }],
      };
      (MessageRoom.findOne as jest.Mock).mockResolvedValue(existingRoom);
      (MessageRoom.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingRoom,
        users: [...existingRoom.users, '663a1234567890abcdef5678'],
      });

      const result = await addUserToPostRoom('663a1234567890abcdef1234', '663a1234567890abcdef5678');

      expect(MessageRoom.findByIdAndUpdate).toHaveBeenCalledWith(
        'room1',
        expect.objectContaining({
          $addToSet: expect.any(Object),
          $set: expect.objectContaining({ lastActivity: expect.any(Date) }),
        }),
        { new: true }
      );
      expect(result).toBeDefined();
    });

    it('should update lastActivity if user is already a member', async () => {
      const userId = '663a1234567890abcdef5678';
      const existingRoom = {
        _id: 'room1',
        users: [{ toString: () => userId }],
      };
      (MessageRoom.findOne as jest.Mock).mockResolvedValue(existingRoom);
      (MessageRoom.findByIdAndUpdate as jest.Mock).mockResolvedValue(existingRoom);

      const result = await addUserToPostRoom('663a1234567890abcdef1234', userId);

      expect(MessageRoom.findByIdAndUpdate).toHaveBeenCalledWith(
        'room1',
        { $set: { lastActivity: expect.any(Date) } },
        { new: true }
      );
      expect(result).toBeDefined();
    });

    it('should handle room with undefined users array', async () => {
      const existingRoom = {
        _id: 'room1',
        users: undefined,
      };
      (MessageRoom.findOne as jest.Mock).mockResolvedValue(existingRoom);
      (MessageRoom.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...existingRoom,
        users: ['663a1234567890abcdef5678'],
      });

      const result = await addUserToPostRoom('663a1234567890abcdef1234', '663a1234567890abcdef5678');

      expect(MessageRoom.findByIdAndUpdate).toHaveBeenCalledWith(
        'room1',
        expect.objectContaining({
          $addToSet: expect.any(Object),
        }),
        { new: true }
      );
      expect(result).toBeDefined();
    });
  });
});
