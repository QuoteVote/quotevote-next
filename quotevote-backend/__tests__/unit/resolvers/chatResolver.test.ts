import { GraphQLError } from 'graphql';
import { chatResolver } from '~/data/resolvers/chatResolver';
import MessageRoom from '~/data/models/MessageRoom';
import Message from '~/data/models/Message';

jest.mock('~/data/models/MessageRoom');
jest.mock('~/data/models/Message');
describe('chatResolver.Query.messages', () => {
  const context = { userId: null } as any;

  it('throws UNAUTHENTICATED without a session', async () => {
     (MessageRoom.findById as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({ messageType: 'USER', users: ['user-2'] }),
   });
    await expect(
      chatResolver.Query.messages(null, { messageRoomId: 'room-1' }, context)
    ).rejects.toThrow(GraphQLError);
  });

  it('throws NOT_FOUND for an unknown room', async () => {
    (MessageRoom.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(null) });
    await expect(
      chatResolver.Query.messages(null, { messageRoomId: 'room-1' }, { userId: 'user-1' } as any)
    ).rejects.toThrow('Room not found');
  });

  it('throws FORBIDDEN for a non-member of a USER room', async () => {
    (MessageRoom.findById as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({ messageType: 'USER', users: ['user-2'] }),
    });
    await expect(
      chatResolver.Query.messages(null, { messageRoomId: 'room-1' }, { userId: 'user-1' } as any)
    ).rejects.toThrow('Not a member of this room');
  });
});


describe('chatResolver.Query.messages — guest access to POST rooms', () => {
  it('allows an unauthenticated caller to read messages in a POST room', async () => {
    (MessageRoom.findById as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({ messageType: 'POST', users: [] }),
    });
    (Message.find as jest.Mock).mockReturnValue({
      sort: () => ({ lean: () => Promise.resolve([]) }),
    });

    const context = { userId: null } as any;
    await expect(
      chatResolver.Query.messages(null, { messageRoomId: 'room-1' }, context)
    ).resolves.toEqual([]);
  });

  it('still requires a session for a USER room', async () => {
    (MessageRoom.findById as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({ messageType: 'USER', users: ['user-1'] }),
    });

    const context = { userId: null } as any;
    await expect(
      chatResolver.Query.messages(null, { messageRoomId: 'room-1' }, context)
    ).rejects.toThrow(GraphQLError);
  });

  it('excludes soft-deleted messages', async () => {
    (MessageRoom.findById as jest.Mock).mockReturnValue({
      lean: () => Promise.resolve({ messageType: 'POST', users: [] }),
    });
    const find = jest.fn().mockReturnValue({
      sort: () => ({ lean: () => Promise.resolve([]) }),
    });
    (Message.find as jest.Mock) = find;

    await chatResolver.Query.messages(null, { messageRoomId: 'room-1' }, { userId: null } as any);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ deleted: { $ne: true } })
    );
  });
});