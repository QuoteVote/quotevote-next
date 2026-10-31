import { chatResolver } from '~/data/resolvers/chatResolver';
import { MESSAGE_ROOM_SELECT } from '~/data/resolvers/utils/chatRooms';
import { MESSAGE_RECORD_SELECT } from '~/data/resolvers/utils/commentsQuotes';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';

const date = new Date('2026-01-01T00:00:00.000Z');

const createContext = () => ({
  userId: 'user-1',
  prisma: {
    messageRoom: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
    },
    reaction: {
      findMany: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    comment: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
  pubsub: {
    publish: jest.fn(),
  },
  user: { _id: 'user-1', username: 'alice', name: 'Alice' },
});

const me = '60d5ec49ad414d7a8d5464a0';
const bobId = '60d5ec49ad414d7a8d5464a1';
const carolId = '60d5ec49ad414d7a8d5464a2';
const dmId = '60d5ec49ad414d7a8d5464c1';
const quietDmId = '60d5ec49ad414d7a8d5464c2';
const postRoomId = '60d5ec49ad414d7a8d5464c3';
const postId = '60d5ec49ad414d7a8d5464b1';
const day = (n: number) => new Date(Date.UTC(2026, 0, n));
const bob = { id: bobId, name: 'Bob', username: 'bob', avatar: 'bob.png' };
const carol = { id: carolId, name: 'Carol', username: 'carol', avatar: 'carol.png' };

const room = (overrides: Record<string, unknown>) => ({
  id: dmId,
  userIds: [] as string[],
  postId: null,
  messageType: 'USER',
  isDirect: false,
  title: null,
  avatar: null,
  lastMessageTime: null,
  lastActivity: null,
  created: date,
  ...overrides,
});

describe('chatResolver Prisma queries', () => {
  it('finds a direct room containing both users', async () => {
    const context = createContext();
    context.userId = me;
    context.prisma.messageRoom.findFirst.mockResolvedValue(
      room({ id: dmId, userIds: [me, bobId] })
    );
    context.prisma.user.findMany.mockResolvedValue([bob]);

    const result = await chatResolver.Query.messageRoom(
      {},
      { otherUserId: bobId },
      context as never
    );

    // Legacy direct rooms are marked by messageType; isDirect is false on all of them.
    expect(context.prisma.messageRoom.findFirst).toHaveBeenCalledWith({
      where: { userIds: { hasEvery: [me, bobId] }, messageType: 'USER' },
      select: MESSAGE_ROOM_SELECT,
    });
    expect(result).toMatchObject({
      _id: dmId,
      users: [me, bobId],
      title: 'Bob',
      avatar: 'bob.png',
      unreadMessages: 0,
      postDetails: null,
    });
  });

  it('returns null for a guest or an id that is not an ObjectId, without querying', async () => {
    const context = createContext();
    context.userId = me;
    await expect(
      chatResolver.Query.messageRoom({}, { otherUserId: 'not-an-id' }, context as never)
    ).resolves.toBeNull();
    context.userId = null as never;
    await expect(
      chatResolver.Query.messageRoom({}, { otherUserId: bobId }, context as never)
    ).resolves.toBeNull();
    expect(context.prisma.messageRoom.findFirst).not.toHaveBeenCalled();
  });

  it('lists rooms with the fields the chat list shows, newest message first', async () => {
    const context = createContext();
    context.userId = me;
    context.prisma.messageRoom.findMany.mockResolvedValue([
      // Legacy room with no messages: lastMessageTime falls back to lastActivity.
      room({ id: quietDmId, userIds: [me, carolId], lastActivity: day(1) }),
      room({ id: dmId, userIds: [me, bobId], lastActivity: day(2) }),
      room({ id: postRoomId, userIds: [me, bobId], messageType: 'POST', postId }),
    ]);
    context.prisma.post.findMany.mockImplementation(({ select }: { select: object }) =>
      Promise.resolve(
        'title' in select
          ? [{ id: postId, title: 'A post', text: 'Body', userId: carolId, url: '/post/a' }]
          : [{ id: postId, userId: carolId }]
      )
    );
    // The viewer commented on the post, so its room is listed.
    context.prisma.comment.findMany.mockResolvedValue([{ postId, deleted: false }]);
    context.prisma.message.findMany.mockResolvedValue([
      { messageRoomId: dmId, deleted: false },
      { messageRoomId: dmId },
      { messageRoomId: dmId, deleted: true },
    ]);
    context.prisma.message.groupBy.mockResolvedValue([
      { messageRoomId: dmId, _max: { created: day(5) } },
      { messageRoomId: postRoomId, _max: { created: day(4) } },
    ]);
    context.prisma.user.findMany.mockResolvedValue([bob, carol]);

    const rooms = await chatResolver.Query.messageRooms({}, {}, context as never);

    expect(context.prisma.messageRoom.findMany).toHaveBeenCalledWith({
      where: { userIds: { has: me } },
      select: MESSAGE_ROOM_SELECT,
    });
    expect(MESSAGE_ROOM_SELECT).not.toHaveProperty('createdAt');
    expect(MESSAGE_ROOM_SELECT).not.toHaveProperty('updatedAt');
    expect(rooms.map((r) => r._id)).toEqual([dmId, postRoomId, quietDmId]);
    expect(rooms[0]).toMatchObject({
      title: 'Bob',
      avatar: 'bob.png',
      // Deleted messages aren't counted; legacy messages without the flag are.
      unreadMessages: 2,
      lastMessageTime: day(5),
    });
    expect(rooms[1]).toMatchObject({
      title: 'A post',
      // A post room shows the post author's avatar.
      avatar: 'carol.png',
      postDetails: { _id: postId, title: 'A post', text: 'Body', userId: carolId, url: '/post/a' },
    });
    expect(rooms[2]).toMatchObject({ title: 'Carol', lastMessageTime: day(1), unreadMessages: 0 });
    // Unread counts skip the viewer's own messages and ones they've read.
    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: {
        messageRoomId: { in: [quietDmId, dmId, postRoomId] },
        userId: { not: me },
        NOT: { readBy: { has: me } },
      },
      select: { messageRoomId: true, deleted: true },
    });
    expect(context.prisma.user.findMany).toHaveBeenCalledTimes(1);
  });

  it('leaves out post rooms the member has no part in', async () => {
    const context = createContext();
    context.userId = me;
    const otherPostRoom = '60d5ec49ad414d7a8d5464c9';
    const otherPost = '60d5ec49ad414d7a8d5464b9';
    context.prisma.messageRoom.findMany.mockResolvedValue([
      room({ id: postRoomId, userIds: [me], messageType: 'POST', postId }),
      room({ id: otherPostRoom, userIds: [me], messageType: 'POST', postId: otherPost }),
    ]);
    context.prisma.post.findMany.mockResolvedValue([
      { id: postId, userId: carolId },
      { id: otherPost, userId: carolId },
    ]);
    // Their only comment on the first post is deleted, and they sent nothing.
    context.prisma.comment.findMany.mockResolvedValue([{ postId, deleted: true }]);

    await expect(chatResolver.Query.messageRooms({}, {}, context as never)).resolves.toEqual([]);

    // A room on their own post, or one they sent a message in, is listed.
    context.prisma.post.findMany.mockResolvedValue([
      { id: postId, userId: me },
      { id: otherPost, userId: carolId },
    ]);
    context.prisma.message.findMany.mockImplementation(
      ({ where }: { where: { userId?: unknown } }) =>
        Promise.resolve(where.userId === me ? [{ messageRoomId: otherPostRoom }] : [])
    );
    const listed = await chatResolver.Query.messageRooms({}, {}, context as never);
    expect(listed.map((r) => r._id).sort()).toEqual([postRoomId, otherPostRoom].sort());
  });

  it('returns no rooms to a guest', async () => {
    const context = createContext();
    context.userId = null as never;
    await expect(chatResolver.Query.messageRooms({}, {}, context as never)).resolves.toEqual([]);
    expect(context.prisma.messageRoom.findMany).not.toHaveBeenCalled();
  });

  it('maps messages and reactions to the legacy GraphQL shape', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue({
      messageType: 'USER',
      userIds: ['user-1'],
    });
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
      select: MESSAGE_RECORD_SELECT,
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
    context.prisma.post.findUnique.mockResolvedValue({
      id: 'post-1',
      title: 'Post title',
      text: 'Post text',
      userId: 'user-2',
      url: '/post/a',
    });
    context.prisma.messageRoom.findUnique.mockResolvedValue({
      messageType: 'POST',
      userIds: [],
    });
    context.prisma.message.findMany.mockResolvedValue([]);

    const parent = { _id: 'room-1', postId: 'post-1', created: date };
    const postDetails = await chatResolver.MessageRoom.postDetails(parent, {}, context as never);
    const messages = await chatResolver.MessageRoom.messages(parent, {}, context as never);

    expect(context.prisma.post.findUnique).toHaveBeenCalledWith({
      where: { id: 'post-1' },
      select: { id: true, title: true, text: true, userId: true, url: true },
    });
    expect(postDetails).toEqual({
      _id: 'post-1',
      title: 'Post title',
      text: 'Post text',
      userId: 'user-2',
      url: '/post/a',
    });
    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: { messageRoomId: 'room-1' },
      orderBy: { created: 'asc' },
      select: MESSAGE_RECORD_SELECT,
    });
    expect(messages).toEqual([]);
  });

  it('uses post details the room list already loaded', async () => {
    const context = createContext();
    const postDetails = { _id: 'post-1', title: 'T', text: '', userId: 'user-2', url: '' };

    await expect(
      chatResolver.MessageRoom.postDetails(
        { _id: 'room-1', postId: 'post-1', created: date, postDetails },
        {},
        context as never
      )
    ).resolves.toBe(postDetails);
    await expect(
      chatResolver.MessageRoom.postDetails(
        { _id: 'room-2', created: date, postDetails: null },
        {},
        context as never
      )
    ).resolves.toBeNull();
    expect(context.prisma.post.findUnique).not.toHaveBeenCalled();
  });

  it('adds each author, their name and the room type to messages, in one user query', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue({
      messageType: 'USER',
      userIds: ['user-1', bobId],
    });
    const message = (id: string, userId: string) => ({
      id,
      messageRoomId: dmId,
      userId,
      userName: null,
      title: null,
      text: 'Hi',
      type: null,
      mutationType: null,
      deleted: false,
      readBy: [],
      readByDetailed: [],
      deliveredTo: [],
      created: date,
    });
    context.prisma.message.findMany.mockResolvedValue([
      message('m1', bobId),
      message('m2', bobId),
      message('m3', 'gone-user'),
    ]);
    context.prisma.user.findMany.mockResolvedValue([bob]);

    const messages = await chatResolver.Query.messages(
      {},
      { messageRoomId: dmId },
      context as never
    );

    expect(context.prisma.user.findMany).toHaveBeenCalledTimes(1);
    expect(context.prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [bobId, 'gone-user'] } },
      select: PUBLIC_USER_SELECT,
    });
    expect(messages[0]).toMatchObject({
      userName: 'Bob',
      type: 'USER',
      user: { _id: bobId, username: 'bob', email: '' },
    });
    // Legacy names a message from a missing account "Unknown User".
    expect(messages[2]).toMatchObject({ userName: 'Unknown User', type: 'USER', user: null });
  });

  it('does not return nested history for a room the current user cannot access', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(null);

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
    context.prisma.messageRoom.findUnique.mockResolvedValue(null);

    await expect(
      chatResolver.Query.messages({}, { messageRoomId: 'private-room' }, context as never)
    ).resolves.toEqual([]);
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('allows unauthenticated readers to load post-room history', async () => {
    const context = createContext();
    context.userId = null;
    context.prisma.messageRoom.findUnique.mockResolvedValue({
      messageType: 'POST',
      userIds: [],
    });
    context.prisma.message.findMany.mockResolvedValue([]);

    await expect(
      chatResolver.Query.messages({}, { messageRoomId: 'post-room' }, context as never)
    ).resolves.toEqual([]);

    expect(context.prisma.messageRoom.findUnique).toHaveBeenCalledWith({
      where: { id: 'post-room' },
      select: { messageType: true, userIds: true },
    });
    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: { messageRoomId: 'post-room' },
      orderBy: { created: 'asc' },
      select: MESSAGE_RECORD_SELECT,
    });
  });

  it('does not expose a private room to a non-member', async () => {
    const context = createContext();
    context.userId = 'outsider';
    context.prisma.messageRoom.findUnique.mockResolvedValue({
      messageType: 'USER',
      userIds: ['member'],
    });

    await expect(
      chatResolver.Query.messages({}, { messageRoomId: 'private-room' }, context as never)
    ).resolves.toEqual([]);
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('does not return soft-deleted messages', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue({
      messageType: 'POST',
      userIds: [],
    });
    context.prisma.message.findMany.mockResolvedValue([
      {
        id: 'visible',
        messageRoomId: 'post-room',
        userId: 'user-1',
        userName: 'A User',
        title: null,
        text: 'Visible',
        type: 'POST',
        mutationType: 'CREATE',
        deleted: false,
        readBy: [],
        readByDetailed: [],
        deliveredTo: [],
        created: date,
        updatedAt: date,
      },
      {
        id: 'deleted',
        messageRoomId: 'post-room',
        userId: 'user-1',
        userName: 'A User',
        title: null,
        text: 'Deleted',
        type: 'POST',
        mutationType: 'DELETE',
        deleted: true,
        readBy: [],
        readByDetailed: [],
        deliveredTo: [],
        created: date,
        updatedAt: date,
      },
    ]);

    const messages = await chatResolver.Query.messages(
      {},
      { messageRoomId: 'post-room' },
      context as never
    );

    expect(messages.map((message) => message._id)).toEqual(['visible']);
    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: { messageRoomId: 'post-room' },
      orderBy: { created: 'asc' },
      select: MESSAGE_RECORD_SELECT,
    });
  });

  it('returns legacy messages that have no deleted flag or timestamps', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue({ messageType: 'POST', userIds: [] });
    context.prisma.message.findMany.mockResolvedValue([
      {
        id: 'legacy',
        messageRoomId: 'post-room',
        userId: 'user-1',
        userName: null,
        title: null,
        text: 'From the legacy API',
        type: null,
        mutationType: null,
        readBy: [],
        readByDetailed: [],
        deliveredTo: [],
        created: date,
      },
    ]);

    const messages = await chatResolver.MessageRoom.messages(
      { _id: 'post-room' } as never,
      {},
      context as never
    );

    expect(messages.map((message) => message._id)).toEqual(['legacy']);
    const { select } = context.prisma.message.findMany.mock.calls[0][0];
    expect(select).not.toHaveProperty('createdAt');
    expect(select).not.toHaveProperty('updatedAt');
  });
});

describe('chatResolver.Query.searchMessages', () => {
  const roomId = '507f1f77bcf86cd799439021';
  const authorId = '507f1f77bcf86cd799439022';
  const otherAuthorId = '507f1f77bcf86cd799439023';
  const ids = ['507f1f77bcf86cd7994390a1', '507f1f77bcf86cd7994390a2', '507f1f77bcf86cd7994390a3'];

  const row = (overrides: Record<string, unknown> = {}) => ({
    id: ids[0],
    messageRoomId: roomId,
    userId: authorId,
    text: 'See you at the town hall tonight',
    created: date,
    deleted: false,
    ...overrides,
  });

  const search = (
    context: ReturnType<typeof createContext>,
    args: { text: string; limit?: number | null; cursor?: string | null }
  ) => chatResolver.Query.searchMessages({}, args, context as never);

  it('rejects a guest without reading anything', async () => {
    const context = { ...createContext(), userId: null };

    await expect(search(context as never, { text: 'hall' })).rejects.toMatchObject({
      extensions: { code: 'UNAUTHENTICATED' },
    });
    expect(context.prisma.messageRoom.findMany).not.toHaveBeenCalled();
  });

  it('returns nothing for blank text and does not query', async () => {
    const context = createContext();

    await expect(search(context, { text: '   ' })).resolves.toEqual({
      results: [],
      nextCursor: null,
    });
    expect(context.prisma.messageRoom.findMany).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'text that is too long', args: { text: 'a'.repeat(201) } },
    { label: 'a non-positive limit', args: { text: 'hall', limit: 0 } },
    { label: 'a malformed cursor', args: { text: 'hall', cursor: 'nope' } },
  ])('rejects $label', async ({ args }) => {
    const context = createContext();

    await expect(search(context, args)).rejects.toMatchObject({
      extensions: { code: 'BAD_USER_INPUT' },
    });
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('returns nothing when the user is in no conversation', async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([]);

    await expect(search(context, { text: 'hall' })).resolves.toEqual({
      results: [],
      nextCursor: null,
    });
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
  });

  it("only searches the signed-in user's own rooms", async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([{ id: roomId }]);
    context.prisma.message.findMany.mockResolvedValue([]);

    await search(context, { text: ' town hall ' });

    expect(context.prisma.messageRoom.findMany).toHaveBeenCalledWith({
      where: { userIds: { has: 'user-1' } },
      select: { id: true },
    });
    expect(context.prisma.message.findMany).toHaveBeenCalledWith({
      where: {
        messageRoomId: { in: [roomId] },
        text: { contains: 'town hall', mode: 'insensitive' },
      },
      orderBy: [{ created: 'desc' }, { id: 'desc' }],
      take: 21,
      select: expect.objectContaining({ text: true, deleted: true }),
    });
  });

  it('caps the page size', async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([{ id: roomId }]);
    context.prisma.message.findMany.mockResolvedValue([]);

    await search(context, { text: 'hall', limit: 1000 });

    expect(context.prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 51 })
    );
  });

  it('resumes after the (created, _id) cursor and returns the next one', async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([{ id: roomId }]);
    context.prisma.message.findMany.mockResolvedValue([
      row({ id: ids[0] }),
      row({ id: ids[1] }),
      row({ id: ids[2] }),
    ]);
    context.prisma.user.findMany.mockResolvedValue([
      { id: authorId, username: 'bob', name: 'Bob' },
    ]);

    const result = await search(context, {
      text: 'hall',
      limit: 2,
      cursor: `${date.getTime()}_${ids[2]}`,
    });

    expect(context.prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 3,
        where: expect.objectContaining({
          OR: [{ created: { lt: date } }, { created: date, id: { lt: ids[2] } }],
        }),
      })
    );
    expect(result.results.map((hit) => hit._id)).toEqual([ids[0], ids[1]]);
    expect(result.nextCursor).toBe(`${date.getTime()}_${ids[1]}`);
  });

  it('drops deleted messages in code, keeps legacy rows without the flag, and advances the cursor', async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([{ id: roomId }]);
    context.prisma.message.findMany.mockResolvedValue([
      row({ id: ids[0], deleted: undefined }),
      row({ id: ids[1], deleted: true }),
      row({ id: ids[2] }),
    ]);
    context.prisma.user.findMany.mockResolvedValue([
      { id: authorId, username: 'bob', name: 'Bob' },
    ]);

    const result = await search(context, { text: 'hall', limit: 2 });

    const { where } = context.prisma.message.findMany.mock.calls[0][0];
    expect(where).not.toHaveProperty('deleted');
    expect(result.results.map((hit) => hit._id)).toEqual([ids[0]]);
    expect(result.nextCursor).toBe(`${date.getTime()}_${ids[1]}`);
  });

  it('returns a snippet, public author fields, and null for a missing account', async () => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([{ id: roomId }]);
    context.prisma.message.findMany.mockResolvedValue([
      row({ id: ids[0] }),
      row({ id: ids[1], userId: otherAuthorId }),
    ]);
    context.prisma.user.findMany.mockResolvedValue([
      { id: authorId, username: 'bob', name: 'Bob' },
    ]);

    const result = await search(context, { text: 'hall' });

    expect(context.prisma.user.findMany).toHaveBeenCalledWith({
      where: { id: { in: [authorId, otherAuthorId] } },
      select: expect.objectContaining({ id: true, username: true }),
    });
    expect(result.results[0]).toMatchObject({
      _id: ids[0],
      messageRoomId: roomId,
      snippet: 'See you at the town hall tonight',
      user: { _id: authorId, username: 'bob' },
    });
    expect(result.results[1].user).toBeNull();
  });

  it.each([
    ['.*', '\\.\\*'],
    ['(', '\\('],
    ['a+b?', 'a\\+b\\?'],
    ['[x', '\\[x'],
  ])('escapes %s before it reaches contains', async (term, escaped) => {
    const context = createContext();
    context.prisma.messageRoom.findMany.mockResolvedValue([{ id: roomId }]);
    context.prisma.message.findMany.mockResolvedValue([row({ text: `price is 5 ${term} today` })]);
    context.prisma.user.findMany.mockResolvedValue([
      { id: authorId, username: 'bob', name: 'Bob' },
    ]);

    const result = await search(context, { text: term });

    expect(context.prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ text: { contains: escaped, mode: 'insensitive' } }),
      })
    );
    expect(result.results[0].snippet).toContain(term);
  });
});
