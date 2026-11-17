import { graphql, type ExecutionResult } from 'graphql';
import { schema } from '~/data/schema';

// Room membership and ownership rules, exercised through the executable
// schema against an in-memory fake of Prisma. Denied cases assert both the
// outcome and that the protected data or write was never touched.

const date = new Date('2026-01-01T00:00:00.000Z');

const memberId = '507f1f77bcf86cd799439011';
const otherMemberId = '507f1f77bcf86cd799439012';
const outsiderId = '507f1f77bcf86cd799439013';
const lonerId = '507f1f77bcf86cd799439014';
const strangerId = '507f1f77bcf86cd799439015';

const dmRoomId = '507f1f77bcf86cd799439021';
const postRoomId = '507f1f77bcf86cd799439022';
const outsiderRoomId = '507f1f77bcf86cd799439023';
const unknownRoomId = '507f1f77bcf86cd799439099';
const postId = '507f1f77bcf86cd799439031';

const dmMessageId = '507f1f77bcf86cd799439041';
const postMessageId = '507f1f77bcf86cd799439042';
const outsiderReactionId = '507f1f77bcf86cd799439051';
const memberReactionId = '507f1f77bcf86cd799439052';
const newReactionId = '507f1f77bcf86cd799439053';

type RoomType = 'USER' | 'POST' | 'SYSTEM';

const makeRoom = (
  id: string,
  messageType: RoomType,
  userIds: string[],
  roomPostId: string | null = null
) => ({
  id,
  userIds,
  messageType,
  postId: roomPostId,
  title: null,
  avatar: null,
  isDirect: messageType === 'USER',
  lastMessageTime: null,
  lastActivity: date,
  lastSeenMessages: null,
  unreadMessages: 0,
  created: date,
  updatedAt: date,
});

const makeMessage = (id: string, messageRoomId: string, userId: string) => ({
  id,
  messageRoomId,
  userId,
  userName: null,
  title: null,
  text: 'hello',
  type: null,
  mutationType: null,
  deleted: false,
  readBy: [] as string[],
  readByDetailed: [] as unknown[],
  deliveredTo: [] as unknown[],
  created: date,
});

const makeReaction = (id: string, userId: string) => ({
  id,
  userId,
  actionId: null,
  messageId: dmMessageId,
  emoji: '👍',
  created: date,
});

function buildPrisma() {
  const rooms = [
    makeRoom(dmRoomId, 'USER', [memberId, otherMemberId]),
    makeRoom(postRoomId, 'POST', [], postId),
    makeRoom(outsiderRoomId, 'USER', [outsiderId, strangerId]),
  ];
  const messages = [
    makeMessage(dmMessageId, dmRoomId, otherMemberId),
    makeMessage(postMessageId, postRoomId, memberId),
  ];
  const reactions = [
    makeReaction(outsiderReactionId, outsiderId),
    makeReaction(memberReactionId, memberId),
  ];
  const byId = <T extends { id: string }>(list: T[], id: string): T | null =>
    list.find((item) => item.id === id) ?? null;

  return {
    messageRoom: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => byId(rooms, where.id)),
      findMany: jest.fn(async ({ where }: { where: { userIds: { has: string } } }) =>
        rooms.filter((room) => room.userIds.includes(where.userIds.has))
      ),
      findFirst: jest.fn(
        async ({ where }: { where: { userIds: { hasEvery: string[] }; messageType: string } }) =>
          rooms.find(
            (room) =>
              room.messageType === where.messageType &&
              where.userIds.hasEvery.every((id) => room.userIds.includes(id))
          ) ?? null
      ),
    },
    message: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => byId(messages, where.id)),
      findMany: jest.fn(
        async ({ where }: { where: { messageRoomId: string | { in: string[] } } }) => {
          const ids =
            typeof where.messageRoomId === 'string'
              ? [where.messageRoomId]
              : where.messageRoomId.in;
          return messages.filter((message) => ids.includes(message.messageRoomId));
        }
      ),
      updateMany: jest.fn(async () => ({ count: 1 })),
      create: jest.fn(async () => messages[0]),
    },
    reaction: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) =>
        byId(reactions, where.id)
      ),
      findFirst: jest.fn(async () => null),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: newReactionId,
        actionId: null,
        created: date,
        ...data,
      })),
      update: jest.fn(
        async ({ where, data }: { where: { id: string }; data: { emoji: string } }) => ({
          ...byId(reactions, where.id),
          emoji: data.emoji,
        })
      ),
    },
    typing: {
      findMany: jest.fn(async () => []),
      upsert: jest.fn(async () => ({})),
      deleteMany: jest.fn(async () => ({ count: 0 })),
    },
    post: { findUnique: jest.fn(async () => ({ deleted: false })) },
    user: { findMany: jest.fn(async () => []) },
    userBlock: { findMany: jest.fn(async () => []) },
    $runCommandRaw: jest.fn(async () => ({ ok: 1, value: { count: 1 } })),
  };
}

type Persona = { label: string; userId: string | null };
const guest: Persona = { label: 'a guest', userId: null };
const outsider: Persona = { label: 'a non-member', userId: outsiderId };
const member: Persona = { label: 'a member', userId: memberId };

async function run(
  source: string,
  userId: string | null,
  variableValues: Record<string, unknown> = {}
) {
  const prisma = buildPrisma();
  const pubsub = { publish: jest.fn(async () => undefined) };
  const contextValue = { user: userId ? { _id: userId } : null, userId, prisma, pubsub };
  const result = await graphql({ schema, source, variableValues, contextValue });
  return { result, prisma, pubsub };
}

const codeOf = (result: ExecutionResult): unknown => result.errors?.[0]?.extensions?.code;
const messageOf = (result: ExecutionResult): string | undefined => result.errors?.[0]?.message;

describe('Room membership authorization (executable schema)', () => {
  describe('messages', () => {
    const source = `query ($id: String!) { found: messages(messageRoomId: $id) { _id text } }`;

    it.each([guest, outsider])(
      'returns nothing from a direct room to $label and never reads its messages',
      async ({ userId }) => {
        const { result, prisma } = await run(source, userId, { id: dmRoomId });

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({ found: [] });
        expect(prisma.message.findMany).not.toHaveBeenCalled();
      }
    );

    it('returns the messages of a direct room to a member', async () => {
      const { result } = await run(source, memberId, { id: dmRoomId });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ found: [{ _id: dmMessageId, text: 'hello' }] });
    });

    it.each([guest, outsider, member])(
      'keeps a post chat readable by $label',
      async ({ userId }) => {
        const { result } = await run(source, userId, { id: postRoomId });

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({ found: [{ _id: postMessageId, text: 'hello' }] });
      }
    );

    it('returns nothing for an unknown room', async () => {
      const { result } = await run(source, memberId, { id: unknownRoomId });

      expect(result.data).toEqual({ found: [] });
    });
  });

  describe('searchMessages', () => {
    const source = `
      query ($text: String!) {
        found: searchMessages(text: $text) { results { _id } nextCursor }
      }
    `;

    it('rejects a guest without reading anything', async () => {
      const { result, prisma } = await run(source, null, { text: 'hello' });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(result.data).toEqual({ found: null });
      expect(prisma.messageRoom.findMany).not.toHaveBeenCalled();
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    });

    it('searches only the rooms the member belongs to', async () => {
      const { result, prisma } = await run(source, memberId, { text: 'hello' });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ found: { results: [{ _id: dmMessageId }], nextCursor: null } });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ messageRoomId: { in: [dmRoomId] } }),
        })
      );
    });

    it("never searches another user's room", async () => {
      const { result, prisma } = await run(source, outsiderId, { text: 'hello' });

      expect(result.data).toEqual({ found: { results: [], nextCursor: null } });
      expect(prisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ messageRoomId: { in: [outsiderRoomId] } }),
        })
      );
    });

    it('reads no messages for a user who is in no room', async () => {
      const { result, prisma } = await run(source, lonerId, { text: 'hello' });

      expect(result.data).toEqual({ found: { results: [], nextCursor: null } });
      expect(prisma.message.findMany).not.toHaveBeenCalled();
    });
  });

  describe('messageRoom and messageRooms', () => {
    it('returns no direct room to a guest', async () => {
      const source = `query ($other: String!) { found: messageRoom(otherUserId: $other) { _id } }`;
      const { result, prisma } = await run(source, null, { other: memberId });

      expect(result.data).toEqual({ found: null });
      expect(prisma.messageRoom.findFirst).not.toHaveBeenCalled();
    });

    it("does not return someone else's direct room", async () => {
      const source = `query ($other: String!) { found: messageRoom(otherUserId: $other) { _id } }`;
      const { result } = await run(source, outsiderId, { other: memberId });

      expect(result.data).toEqual({ found: null });
    });

    it('lists no rooms for a guest', async () => {
      const { result, prisma } = await run(`query { found: messageRooms { _id } }`, null);

      expect(result.data).toEqual({ found: [] });
      expect(prisma.messageRoom.findMany).not.toHaveBeenCalled();
    });
  });

  describe('typing', () => {
    const read = `query ($id: String!) { found: getTypingUsers(messageRoomId: $id) { __typename } }`;
    const write = `mutation ($id: String!) { result: updateTyping(typing: { messageRoomId: $id, isTyping: true }) { success } }`;

    it.each([dmRoomId, postRoomId])('requires a session to read typing in room %s', async (id) => {
      const { result, prisma } = await run(read, null, { id });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.typing.findMany).not.toHaveBeenCalled();
    });

    it('hides typing in a direct room from a non-member', async () => {
      const { result, prisma } = await run(read, outsiderId, { id: dmRoomId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(prisma.typing.findMany).not.toHaveBeenCalled();
    });

    it('rejects an unknown room', async () => {
      const { result } = await run(read, memberId, { id: unknownRoomId });

      expect(codeOf(result)).toBe('NOT_FOUND');
    });

    it('shows typing to a member, and in a post chat to any signed-in user', async () => {
      const asMember = await run(read, memberId, { id: dmRoomId });
      const asOutsider = await run(read, outsiderId, { id: postRoomId });

      expect(asMember.result.data).toEqual({ found: [] });
      expect(asOutsider.result.data).toEqual({ found: [] });
    });

    it('rejects a guest writing typing', async () => {
      const { result, prisma } = await run(write, null, { id: dmRoomId });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.typing.upsert).not.toHaveBeenCalled();
    });

    it('rejects a non-member writing typing in a direct room', async () => {
      const { result, prisma, pubsub } = await run(write, outsiderId, { id: dmRoomId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(prisma.typing.upsert).not.toHaveBeenCalled();
      expect(pubsub.publish).not.toHaveBeenCalled();
    });

    it.each([
      { label: 'a member in a direct room', userId: memberId, id: dmRoomId },
      { label: 'a non-member in a post chat', userId: outsiderId, id: postRoomId },
    ])('lets $label write typing', async ({ userId, id }) => {
      const { result, pubsub } = await run(write, userId, { id });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ result: { success: true } });
      expect(pubsub.publish).toHaveBeenCalled();
    });
  });

  describe('createMessage', () => {
    const source = `
      mutation ($roomId: String!) {
        created: createMessage(message: { messageRoomId: $roomId, title: "t", text: "hi", type: "USER" }) { _id }
      }
    `;

    it('rejects a guest', async () => {
      const { result, prisma } = await run(source, null, { roomId: dmRoomId });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('rejects a non-member writing in a direct room', async () => {
      const { result, prisma } = await run(source, outsiderId, { roomId: dmRoomId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Not a member of this conversation');
      expect(prisma.message.create).not.toHaveBeenCalled();
    });
  });

  describe('deleteMessage', () => {
    const source = `mutation ($id: String!) { deleted: deleteMessage(messageId: $id) { _id } }`;

    it('rejects a guest', async () => {
      const { result, prisma } = await run(source, null, { id: postMessageId });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a non-member deleting a direct message', async () => {
      const { result, prisma } = await run(source, outsiderId, { id: dmMessageId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe("Direct messages can't be deleted");
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('does not let even a member delete a direct message', async () => {
      const { result, prisma } = await run(source, memberId, { id: dmMessageId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe("Direct messages can't be deleted");
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it("does not let someone delete another author's post message", async () => {
      const { result, prisma } = await run(source, outsiderId, { id: postMessageId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Only the author can delete this message');
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('lets the author delete their own post message', async () => {
      const { result, prisma } = await run(source, memberId, { id: postMessageId });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ deleted: { _id: postMessageId } });
      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: { id: postMessageId },
        data: { deleted: true },
      });
    });
  });

  describe('updateMessageReadBy', () => {
    const source = `mutation ($id: String!) { read: updateMessageReadBy(messageRoomId: $id) { _id } }`;

    it('rejects a guest', async () => {
      const { result, prisma } = await run(source, null, { id: dmRoomId });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('changes nothing for a non-member', async () => {
      const { result, prisma } = await run(source, outsiderId, { id: dmRoomId });

      expect(result.data).toEqual({ read: [] });
      expect(prisma.message.findMany).not.toHaveBeenCalled();
      expect(prisma.message.updateMany).not.toHaveBeenCalled();
    });

    it('marks the unread messages as read for a member', async () => {
      const { result, prisma } = await run(source, memberId, { id: dmRoomId });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ read: [{ _id: dmMessageId }] });
      expect(prisma.message.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [dmMessageId] } },
        data: { readBy: { push: memberId } },
      });
    });
  });

  describe('reactions', () => {
    const add = `
      mutation ($messageId: String!) {
        reaction: addMessageReaction(reaction: { messageId: $messageId, emoji: "👍" }) { _id emoji }
      }
    `;
    const update = `
      mutation ($id: String!) {
        reaction: updateReaction(_id: $id, emoji: "🎉") { _id emoji }
      }
    `;

    it('rejects a guest adding a reaction', async () => {
      const { result, prisma } = await run(add, null, { messageId: dmMessageId });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.reaction.create).not.toHaveBeenCalled();
    });

    it('rejects a non-member reacting in a direct room', async () => {
      const { result, prisma } = await run(add, outsiderId, { messageId: dmMessageId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(prisma.reaction.create).not.toHaveBeenCalled();
    });

    it('lets a member react in a direct room', async () => {
      const { result } = await run(add, memberId, { messageId: dmMessageId });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ reaction: { _id: newReactionId, emoji: '👍' } });
    });

    it("does not let a member edit someone else's reaction", async () => {
      const { result, prisma } = await run(update, memberId, { id: outsiderReactionId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Not authorized');
      expect(prisma.reaction.update).not.toHaveBeenCalled();
    });

    it("does not let someone edit their reaction in a room they're not in", async () => {
      const { result, prisma } = await run(update, outsiderId, { id: outsiderReactionId });

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Not a member of this conversation');
      expect(prisma.reaction.update).not.toHaveBeenCalled();
    });

    it('lets the owner edit their reaction while still a member', async () => {
      const { result } = await run(update, memberId, { id: memberReactionId });

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ reaction: { _id: memberReactionId, emoji: '🎉' } });
    });
  });

  describe('createPostMessageRoom', () => {
    it('rejects a guest', async () => {
      const source = `mutation ($postId: String!) { room: createPostMessageRoom(postId: $postId) { _id } }`;
      const { result } = await run(source, null, { postId });

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
    });
  });
});
