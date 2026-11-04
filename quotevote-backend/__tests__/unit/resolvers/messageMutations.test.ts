import { chatResolver } from '~/data/resolvers/chatResolver';
import { MESSAGE_ROOM_SELECT } from '~/data/resolvers/utils/chatRooms';
import { MESSAGE_RECORD_SELECT, REACTION_SELECT } from '~/data/resolvers/utils/commentsQuotes';
import { RATE_LIMIT_COLLECTION, resetExpiryIndexState } from '~/data/utils/rateLimiter';
import { SUBSCRIPTION_EVENTS } from '~/types/graphql';
import { createRateLimitStore, type RateLimitStore } from '../../helpers/rateLimitStore';

const me = '60d5ec49ad414d7a8d5464a0';
const bobId = '60d5ec49ad414d7a8d5464a1';
const carolId = '60d5ec49ad414d7a8d5464a2';
const dmId = '60d5ec49ad414d7a8d5464c1';

let rateLimits: RateLimitStore;

/** Rate limit commands go to the in-memory store; the rest are recorded here. */
const isRateLimitCommand = (command: Record<string, unknown>): boolean =>
  Object.values(command).includes(RATE_LIMIT_COLLECTION);
const postRoomId = '60d5ec49ad414d7a8d5464c3';
const postId = '60d5ec49ad414d7a8d5464b1';
const messageId = '60d5ec49ad414d7a8d5464d1';
const reactionId = '60d5ec49ad414d7a8d5464e1';
const date = new Date('2026-01-01T00:00:00.000Z');

const room = (overrides: Record<string, unknown> = {}) => ({
  id: dmId,
  userIds: [me, bobId],
  postId: null,
  messageType: 'USER',
  isDirect: false,
  title: null,
  avatar: null,
  lastMessageTime: null,
  lastActivity: date,
  created: date,
  ...overrides,
});

const postRoom = (overrides: Record<string, unknown> = {}) =>
  room({ id: postRoomId, userIds: [bobId], postId, messageType: 'POST', ...overrides });

const record = (overrides: Record<string, unknown> = {}) => ({
  id: messageId,
  messageRoomId: dmId,
  userId: me,
  userName: null,
  title: null,
  text: 'Hello',
  type: null,
  mutationType: null,
  deleted: false,
  readBy: [] as string[],
  readByDetailed: [],
  deliveredTo: [],
  created: date,
  ...overrides,
});

const createContext = (userId: string | null = me) => ({
  userId,
  user: userId ? { _id: userId } : undefined,
  prisma: {
    messageRoom: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    message: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    typing: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    post: { findUnique: jest.fn().mockResolvedValue({ deleted: false }) },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: bobId }),
      findMany: jest.fn().mockResolvedValue([{ id: me, name: 'Me', username: 'me' }]),
    },
    userBlock: { findMany: jest.fn().mockResolvedValue([]) },
    reaction: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $runCommandRaw: jest.fn((command: Record<string, unknown>) =>
      isRateLimitCommand(command) ? rateLimits.$runCommandRaw(command) : Promise.resolve({ ok: 1 })
    ),
  },
  pubsub: { publish: jest.fn() },
});

type Context = ReturnType<typeof createContext>;

const { Mutation } = chatResolver;

const send = (context: Context, message: Record<string, unknown>) =>
  Mutation.createMessage({}, { message: { title: 't', ...message } }, context as never);

beforeEach(() => {
  resetExpiryIndexState();
  rateLimits = createRateLimitStore();
});

describe('createMessage', () => {
  it('requires a signed-in member', async () => {
    await expect(send(createContext(null), { messageRoomId: dmId, text: 'hi' })).rejects.toThrow(
      'Authentication required'
    );
  });

  it('refuses an empty message', async () => {
    await expect(send(createContext(), { messageRoomId: dmId, text: '   ' })).rejects.toThrow(
      'Message text is required'
    );
  });

  it('sends in a direct room the caller belongs to and publishes it', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room());
    context.prisma.message.create.mockResolvedValue(record({ text: 'hi' }));

    const message = await send(context, { messageRoomId: dmId, text: ' hi ' });

    expect(context.prisma.message.create).toHaveBeenCalledWith({
      data: { messageRoomId: dmId, userId: me, title: 't', text: 'hi', created: expect.any(Date) },
      select: MESSAGE_RECORD_SELECT,
    });
    expect(context.prisma.typing.deleteMany).toHaveBeenCalledWith({
      where: { messageRoomId: dmId, userId: me },
    });
    expect(context.prisma.messageRoom.updateMany).toHaveBeenCalledWith({
      where: { id: dmId },
      data: { lastActivity: expect.any(Date) },
    });
    expect(message).toMatchObject({
      _id: messageId,
      text: 'hi',
      type: 'USER',
      userName: 'Me',
      mutation_type: 'CREATED',
      user: expect.objectContaining({ _id: me }),
    });
    expect(context.pubsub.publish).toHaveBeenCalledWith(SUBSCRIPTION_EVENTS.MESSAGE_CREATED, {
      message,
    });
  });

  it("refuses a direct room the caller isn't in", async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room({ userIds: [bobId, carolId] }));

    await expect(send(context, { messageRoomId: dmId, text: 'hi' })).rejects.toThrow(
      'Not a member of this conversation'
    );
    expect(context.prisma.message.create).not.toHaveBeenCalled();
  });

  it('refuses a direct message across a block, in either direction', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room());
    context.prisma.userBlock.findMany.mockResolvedValue([{ blockerId: bobId }]);

    await expect(send(context, { messageRoomId: dmId, text: 'hi' })).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
    expect(context.prisma.message.create).not.toHaveBeenCalled();
  });

  it('starts a direct room when there is none yet', async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue(null);
    context.prisma.messageRoom.create.mockResolvedValue(room());
    context.prisma.message.create.mockResolvedValue(record());

    await send(context, { type: 'USER', componentId: bobId, text: 'hi' });

    expect(context.prisma.messageRoom.create).toHaveBeenCalledWith({
      data: {
        userIds: [me, bobId],
        messageType: 'USER',
        isDirect: true,
        lastActivity: expect.any(Date),
      },
      select: MESSAGE_ROOM_SELECT,
    });
  });

  it('reuses the existing direct room', async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue(room());
    context.prisma.message.create.mockResolvedValue(record());

    await send(context, { type: 'USER', componentId: bobId, text: 'hi' });

    expect(context.prisma.messageRoom.findFirst).toHaveBeenCalledWith({
      where: { userIds: { hasEvery: [me, bobId] }, messageType: 'USER' },
      select: MESSAGE_ROOM_SELECT,
    });
    expect(context.prisma.messageRoom.create).not.toHaveBeenCalled();
  });

  it('refuses messaging yourself or an unknown member', async () => {
    const context = createContext();
    await expect(send(context, { type: 'USER', componentId: me, text: 'hi' })).rejects.toThrow(
      'Cannot message yourself'
    );
    context.prisma.user.findUnique.mockResolvedValue(null);
    await expect(send(context, { type: 'USER', componentId: bobId, text: 'hi' })).rejects.toThrow(
      'User not found'
    );
  });

  it("joins a post's chat when writing in it", async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());
    context.prisma.messageRoom.findFirst.mockResolvedValue(postRoom());
    context.prisma.message.create.mockResolvedValue(record({ messageRoomId: postRoomId }));

    const message = await send(context, { messageRoomId: postRoomId, text: 'hi' });

    expect(context.prisma.messageRoom.updateMany).toHaveBeenCalledWith({
      where: { id: postRoomId, NOT: { userIds: { has: me } } },
      data: { userIds: { push: me }, lastActivity: expect.any(Date) },
    });
    expect(message.type).toBe('POST');
  });

  it("keeps a deleted post's chat read-only", async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());
    context.prisma.post.findUnique.mockResolvedValue({ deleted: true });

    await expect(send(context, { messageRoomId: postRoomId, text: 'hi' })).rejects.toThrow(
      "This post's chat is read-only"
    );
    await expect(send(context, { type: 'POST', componentId: postId, text: 'hi' })).rejects.toThrow(
      "This post's chat is read-only"
    );
    expect(context.prisma.message.create).not.toHaveBeenCalled();
  });

  it('refuses an unknown room with nothing to start one from', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(null);

    await expect(send(context, { messageRoomId: dmId, text: 'hi' })).rejects.toThrow(
      'Message room not found'
    );
  });

  it('allows 10 messages a minute', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room());
    context.prisma.message.create.mockResolvedValue(record());

    for (let i = 0; i < 10; i += 1) await send(context, { messageRoomId: dmId, text: 'hi' });
    await expect(send(context, { messageRoomId: dmId, text: 'hi' })).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
    expect(context.prisma.message.create).toHaveBeenCalledTimes(10);
  });
});

describe('deleteMessage', () => {
  const remove = (context: Context, id = messageId) =>
    Mutation.deleteMessage({}, { messageId: id }, context as never);

  it("lets the author delete their message in a post's chat", async () => {
    const context = createContext();
    context.prisma.message.findUnique.mockResolvedValue(record({ messageRoomId: postRoomId }));
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());

    await expect(remove(context)).resolves.toEqual({ _id: messageId });
    expect(context.prisma.message.updateMany).toHaveBeenCalledWith({
      where: { id: messageId },
      data: { deleted: true },
    });
  });

  it('never deletes a direct message', async () => {
    const context = createContext();
    context.prisma.message.findUnique.mockResolvedValue(record());
    context.prisma.messageRoom.findUnique.mockResolvedValue(room());

    await expect(remove(context)).rejects.toThrow("Direct messages can't be deleted");
    expect(context.prisma.message.updateMany).not.toHaveBeenCalled();
  });

  it("refuses someone else's message", async () => {
    const context = createContext();
    context.prisma.message.findUnique.mockResolvedValue(
      record({ messageRoomId: postRoomId, userId: bobId })
    );
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());

    await expect(remove(context)).rejects.toThrow('Only the author can delete this message');
    expect(context.prisma.message.updateMany).not.toHaveBeenCalled();
  });

  it("refuses changes in a deleted post's chat", async () => {
    const context = createContext();
    context.prisma.message.findUnique.mockResolvedValue(record({ messageRoomId: postRoomId }));
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());
    context.prisma.post.findUnique.mockResolvedValue({ deleted: true });

    await expect(remove(context)).rejects.toThrow("This post's chat is read-only");
  });

  it('treats missing, invalid and already deleted messages as not found', async () => {
    const context = createContext();
    await expect(remove(context, 'not-an-id')).rejects.toThrow('Message not found');
    context.prisma.message.findUnique.mockResolvedValue(null);
    await expect(remove(context)).rejects.toThrow('Message not found');
    context.prisma.message.findUnique.mockResolvedValue(
      record({ messageRoomId: postRoomId, deleted: true })
    );
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());
    await expect(remove(context)).rejects.toThrow('Message not found');
  });
});

describe('createPostMessageRoom', () => {
  const open = (context: Context, id = postId) =>
    Mutation.createPostMessageRoom({}, { postId: id }, context as never);

  it("adds the caller to the post's chat", async () => {
    const context = createContext();
    context.prisma.messageRoom.findFirst.mockResolvedValue(postRoom());

    await expect(open(context)).resolves.toMatchObject({
      _id: postRoomId,
      users: [bobId, me],
      messageType: 'POST',
      postId,
    });
  });

  it('refuses an invalid, missing or deleted post', async () => {
    const context = createContext();
    await expect(open(context, 'nope')).rejects.toThrow('Invalid post id');
    context.prisma.post.findUnique.mockResolvedValue(null);
    await expect(open(context)).rejects.toThrow('Post not found');
    context.prisma.post.findUnique.mockResolvedValue({ deleted: true });
    await expect(open(context)).rejects.toThrow("This post's chat is read-only");
    expect(context.prisma.messageRoom.create).not.toHaveBeenCalled();
  });
});

describe('updateMessageReadBy', () => {
  const read = (context: Context) =>
    Mutation.updateMessageReadBy({}, { messageRoomId: dmId }, context as never);

  it('marks messages from others as read, including legacy ones with no readBy', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room());
    context.prisma.message.findMany.mockResolvedValue([
      record({ id: 'mine', userId: me }),
      record({ id: 'seen', userId: bobId, readBy: [me] }),
      record({ id: 'legacy', userId: bobId, readBy: undefined }),
      record({ id: 'gone', userId: bobId, deleted: true }),
      record({ id: 'new', userId: bobId }),
    ]);

    const result = await read(context);

    expect(result.map((m) => [m._id, m.readBy])).toEqual([
      ['legacy', [me]],
      ['new', [me]],
    ]);
    expect(context.prisma.message.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['legacy', 'new'] } },
      data: { readBy: { push: me } },
    });
    const command = context.prisma.$runCommandRaw.mock.calls[0][0] as {
      update: string;
      updates: { u: unknown }[];
    };
    expect(command.update).toBe('messagerooms');
    expect(JSON.stringify(command.updates[0].u)).toContain(`{"${me}":{"$oid":"new"}}`);
  });

  it('records the last message as seen when nothing is unread', async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room());
    context.prisma.message.findMany.mockResolvedValue([record({ id: 'mine', userId: me })]);

    await expect(read(context)).resolves.toEqual([]);
    expect(context.prisma.message.updateMany).not.toHaveBeenCalled();
    expect(JSON.stringify(context.prisma.$runCommandRaw.mock.calls[0][0])).toContain(
      `{"${me}":{"$oid":"mine"}}`
    );
  });

  it("does nothing in a room the caller isn't in", async () => {
    const context = createContext();
    context.prisma.messageRoom.findUnique.mockResolvedValue(room({ userIds: [bobId, carolId] }));

    await expect(read(context)).resolves.toEqual([]);
    expect(context.prisma.message.findMany).not.toHaveBeenCalled();
    expect(context.prisma.$runCommandRaw).not.toHaveBeenCalled();
  });
});

describe('message reactions', () => {
  const reactionRecord = (overrides: Record<string, unknown> = {}) => ({
    id: reactionId,
    userId: me,
    actionId: null,
    messageId,
    emoji: '👍',
    created: date,
    ...overrides,
  });

  const react = (context: Context, emoji: string) =>
    Mutation.addMessageReaction({}, { reaction: { messageId, emoji } }, context as never);

  const withPostMessage = (context: Context) => {
    context.prisma.message.findUnique.mockResolvedValue(
      record({ messageRoomId: postRoomId, userId: bobId })
    );
    context.prisma.messageRoom.findUnique.mockResolvedValue(postRoom());
  };

  it('adds a reaction for the caller, ignoring any userId sent', async () => {
    const context = createContext();
    withPostMessage(context);
    context.prisma.reaction.create.mockResolvedValue(reactionRecord());

    await expect(
      Mutation.addMessageReaction(
        {},
        { reaction: { messageId, emoji: ' 👍 ', userId: bobId } as never },
        context as never
      )
    ).resolves.toMatchObject({ _id: reactionId, userId: me, emoji: '👍' });
    expect(context.prisma.reaction.create).toHaveBeenCalledWith({
      data: { userId: me, messageId, emoji: '👍' },
      select: REACTION_SELECT,
    });
  });

  it('changes the emoji when the caller already reacted', async () => {
    const context = createContext();
    withPostMessage(context);
    context.prisma.reaction.findFirst.mockResolvedValue(reactionRecord());
    context.prisma.reaction.update.mockResolvedValue(reactionRecord({ emoji: '🎉' }));

    await react(context, '🎉');

    expect(context.prisma.reaction.update).toHaveBeenCalledWith({
      where: { id: reactionId },
      data: { emoji: '🎉' },
      select: REACTION_SELECT,
    });
    expect(context.prisma.reaction.create).not.toHaveBeenCalled();
  });

  it('refuses an empty or oversized emoji', async () => {
    const context = createContext();
    withPostMessage(context);
    await expect(react(context, ' ')).rejects.toThrow('Invalid emoji');
    await expect(react(context, 'x'.repeat(33))).rejects.toThrow('Invalid emoji');
  });

  it("refuses reacting in a direct room the caller isn't in", async () => {
    const context = createContext();
    context.prisma.message.findUnique.mockResolvedValue(record({ userId: bobId }));
    context.prisma.messageRoom.findUnique.mockResolvedValue(room({ userIds: [bobId, carolId] }));

    await expect(react(context, '👍')).rejects.toThrow('Not a member of this conversation');
    expect(context.prisma.reaction.create).not.toHaveBeenCalled();
  });

  it("lets only the reaction's owner change it", async () => {
    const context = createContext();
    withPostMessage(context);
    context.prisma.reaction.findUnique.mockResolvedValue(reactionRecord({ userId: bobId }));

    await expect(
      Mutation.updateReaction({}, { _id: reactionId, emoji: '🎉' }, context as never)
    ).rejects.toThrow('Not authorized');

    context.prisma.reaction.findUnique.mockResolvedValue(reactionRecord());
    context.prisma.reaction.update.mockResolvedValue(reactionRecord({ emoji: '🎉' }));
    await expect(
      Mutation.updateReaction({}, { _id: reactionId, emoji: '🎉' }, context as never)
    ).resolves.toMatchObject({ _id: reactionId, emoji: '🎉' });
  });

  it('treats an unknown reaction as not found', async () => {
    const context = createContext();
    context.prisma.reaction.findUnique.mockResolvedValue(null);
    await expect(
      Mutation.updateReaction({}, { _id: reactionId, emoji: '🎉' }, context as never)
    ).rejects.toThrow('Reaction not found');
  });
});
