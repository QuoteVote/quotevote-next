import { chatResolver } from '~/data/resolvers/chatResolver';

const prismaMock = {
  messageRoomMember: {
    findUnique: jest.fn(),
  },
};

describe('Chat Resolver Authorization (Unit/Integration)', () => {
  const mockRoomId = 'room-alpha-123';
  const memberUserId = 'user-member-1';
  const nonMemberUserId = 'user-outsider-2';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('messages: throws UNAUTHENTICATED if user is not logged in', async () => {
    const context = { userId: null, user: null };
    const args = { messageRoomId: mockRoomId };

    await expect(
      chatResolver.Query.messages(null, args, context as any)
    ).rejects.toThrow(); 
  });

  test('messages: throws FORBIDDEN if user is not a room member', async () => {
    prismaMock.messageRoomMember.findUnique.mockResolvedValue(null);

    const context = { userId: nonMemberUserId, user: { _id: nonMemberUserId } };
    const args = { messageRoomId: mockRoomId };

    await expect(
      chatResolver.Query.messages(null, args, context as any)
    ).rejects.toThrow();
  });
});