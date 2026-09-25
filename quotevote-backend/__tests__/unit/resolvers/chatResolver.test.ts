import { GraphQLError } from 'graphql';
import { chatResolver } from '~/data/resolvers/chatResolver';
import MessageRoom from '~/data/models/MessageRoom';

jest.mock('~/data/models/MessageRoom');

describe('chatResolver.Query.messages', () => {
  const context = { userId: null } as any;

  it('throws UNAUTHENTICATED without a session', async () => {
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