import { chatResolver } from '~/data/resolvers/chatResolver';

const date = new Date('2026-01-01T00:00:00.000Z');

const createContext = () => ({
  userId: 'user-1',
  prisma: {
    messageRoom: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
    reaction: {
      findMany: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  },
});

describe('chatResolver Prisma queries', () => {
  it('finds a direct room containing both users', async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue({
      id: 'room-1',
      userIds: ['user-1', 'user-2'],
      postId: null,
      messageType: 'USER',
      title: null,
      avatar: null,
      isDirect: true,
      lastMessageTime: null,
      lastActivity: date,
      lastSeenMessages: {},
      unreadMessages: 0,
      created: date,
      updatedAt: date,
    });

    const result = await chatResolver.Query.messageRoom(
      {},
      { otherUserId: 'user-2' },
      context as never
    );

    expect(context.prisma.messageRoom.findFirst).toHaveBeenCalledWith({
      where: {
        userIds: { hasEvery: ['user-1', 'user-2'] },
        isDirect: true,
      },
    });
    expect(result?._id).toBe('room-1');
    expect(result?.users).toEqual(['user-1', 'user-2']);
  });

  it('lists rooms in descending activity order', async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([]);

    await chatResolver.Query.messageRooms({}, {}, context as never);

    expect(context.prisma.messageRoom.findMany).toHaveBeenCalledWith({
      where: { userIds: { has: 'user-1' } },
      orderBy: { lastActivity: 'desc' },
    });
  });

  it('maps messages and reactions to the legacy GraphQL shape', async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue({ id: 'room-1' });
    context.prisma.message.findMany.mockResolvedValue([
      {
        id: 'message-1',
        messageRoomId: 'room-1',
        userId: 'user-1',
        userName: 'A User',
        title: null,
        text: 'Hello',
        type: 'USER',
        mutationType: 'CREATE',
        deleted: false,
        readBy: [],
        readByDetailed: [],
        deliveredTo: [],
        created: date,
        updatedAt: date,
      },
    ]);
    context.prisma.reaction.findMany.mockResolvedValue([
      {
        id: 'reaction-1',
        userId: 'user-2',
        messageId: 'message-1',
        actionId: null,
        emoji: '👍',
        created: date,
        updatedAt: date,
      },
    ]);

    const messages = await chatResolver.Query.messages(
      {},
      { messageRoomId: 'room-1' },
      context as never
    );
    const reactions = await chatResolver.Query.messageReactions(
      {},
      { messageId: 'message-1' },
      context as never
    );

    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: { messageRoomId: 'room-1' },
      orderBy: { created: 'asc' },
    });
    expect(messages[0]).toMatchObject({
      _id: 'message-1',
      messageRoomId: 'room-1',
      mutation_type: 'CREATE',
    });

    expect(reactions[0]).toMatchObject({
      _id: 'reaction-1',
      messageId: 'message-1',
      emoji: '👍',
    });
  });

  it('loads post details and room messages through Prisma', async () => {
    const context = createContext();
    context.prisma.post.findUnique.mockResolvedValue({ title: 'Post title', text: 'Post text' });
    context.prisma.messageRoom.findFirst.mockResolvedValue({ id: 'room-1' });
    context.prisma.message.findMany.mockResolvedValue([]);

    const parent = { _id: 'room-1', postId: 'post-1', created: date };
    const postDetails = await chatResolver.MessageRoom.postDetails(parent, {}, context as never);
    const messages = await chatResolver.MessageRoom.messages(parent, {}, context as never);

    expect(context.prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: 'post-1' },
    });
    expect(postDetails).toEqual({ title: 'Post title', text: 'Post text' });
    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: { messageRoomId: 'room-1' },
      orderBy: { created: 'asc' },
    });
    expect(messages).toEqual([]);
  });

  it('does not return nested history for a room the current user cannot access', async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue(null);

    await expect(
      chatResolver.MessageRoom.messages(
        { _id: 'private-room', created: date },
        {},
        context as never
      )
    ).resolves.toEqual([]);
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('does not return history for a room the current user cannot access', async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue(null);

    await expect(
      chatResolver.Query.messages({}, { messageRoomId: 'private-room' }, context as never)
    ).resolves.toEqual([]);
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
  });
});
