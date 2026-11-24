process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { graphql, type ExecutionResult } from 'graphql';
import { schema } from '~/data/schema';

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Part of #107 (slice 3): blocked users. No direct messages in either direction,
// in an existing room or a new one. The same error for both directions, so the
// sender cannot learn who blocked whom.

const date = new Date('2026-01-01T00:00:00.000Z');
const aliceId = '507f1f77bcf86cd799439201';
const bobId = '507f1f77bcf86cd799439202';
const dmRoomId = '507f1f77bcf86cd799439211';
const postRoomId = '507f1f77bcf86cd799439212';
const postId = '507f1f77bcf86cd799439213';

const BLOCK_MESSAGE = 'Cannot send message: a block exists between these users';

type Block = { blockerId: string; blockedUserId: string };

const makeRoom = (
  id: string,
  messageType: 'USER' | 'POST',
  userIds: string[],
  roomPostId: string | null
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

function buildPrisma(blocks: Block[]) {
  const dmRoom = makeRoom(dmRoomId, 'USER', [aliceId, bobId], null);
  const postRoom = makeRoom(postRoomId, 'POST', [], postId);
  return {
    messageRoom: {
      findUnique: jest.fn(
        async ({ where }: { where: { id: string } }) =>
          [dmRoom, postRoom].find((room) => room.id === where.id) ?? null
      ),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockResolvedValue(makeRoom('507f1f77bcf86cd799439299', 'USER', [aliceId, bobId], null)),
    },
    message: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => ({ id: where.id })),
    },
    userBlock: {
      findMany: jest.fn(
        async ({ where }: { where: { OR: { blockerId: string; blockedUserId: string }[] } }) =>
          blocks
            .filter((b) =>
              where.OR.some(
                (c) => c.blockerId === b.blockerId && c.blockedUserId === b.blockedUserId
              )
            )
            .map((b) => ({ blockerId: b.blockerId }))
      ),
    },
    post: { findUnique: jest.fn().mockResolvedValue({ deleted: false }) },
    $runCommandRaw: jest.fn(async () => ({ ok: 1, value: { count: 1 } })),
  };
}

type Prisma = ReturnType<typeof buildPrisma>;

async function send(source: string, senderId: string, prisma: Prisma) {
  return graphql({
    schema,
    source,
    contextValue: {
      user: { _id: senderId },
      userId: senderId,
      prisma,
      pubsub: { publish: jest.fn() },
    },
  });
}

const codeOf = (result: ExecutionResult) => result.errors?.[0]?.extensions?.code;
const messageOf = (result: ExecutionResult) => result.errors?.[0]?.message;

const intoExistingRoom = `mutation { m: createMessage(message: { messageRoomId: "${dmRoomId}", title: "t", text: "hi", type: "USER" }) { _id } }`;
const intoNewRoomWith = (recipientId: string) =>
  `mutation { m: createMessage(message: { componentId: "${recipientId}", title: "t", text: "hi", type: "USER" }) { _id } }`;

describe('blocked users (executable schema)', () => {
  const directions = [
    {
      label: 'the sender blocked the recipient',
      senderId: aliceId,
      recipientId: bobId,
      block: { blockerId: aliceId, blockedUserId: bobId },
    },
    {
      label: 'the recipient blocked the sender',
      senderId: aliceId,
      recipientId: bobId,
      block: { blockerId: bobId, blockedUserId: aliceId },
    },
  ];

  describe.each(directions)('when $label', ({ senderId, recipientId, block }) => {
    it('rejects a message into the existing direct room', async () => {
      const prisma = buildPrisma([block]);

      const result = await send(intoExistingRoom, senderId, prisma);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe(BLOCK_MESSAGE);
      expect(prisma.message.create).not.toHaveBeenCalled();
    });

    it('rejects starting a new direct room and creates nothing', async () => {
      const prisma = buildPrisma([block]);

      const result = await send(intoNewRoomWith(recipientId), senderId, prisma);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe(BLOCK_MESSAGE);
      expect(prisma.messageRoom.create).not.toHaveBeenCalled();
      expect(prisma.message.create).not.toHaveBeenCalled();
    });
  });

  it('rejects the recipient writing back into the room the sender blocked', async () => {
    const prisma = buildPrisma([{ blockerId: aliceId, blockedUserId: bobId }]);

    const result = await send(intoExistingRoom, bobId, prisma);

    expect(codeOf(result)).toBe('FORBIDDEN');
    expect(messageOf(result)).toBe(BLOCK_MESSAGE);
    expect(prisma.message.create).not.toHaveBeenCalled();
  });

  describe('without a block (control)', () => {
    it('does not reject the existing direct room for a block', async () => {
      const prisma = buildPrisma([]);

      const result = await send(intoExistingRoom, aliceId, prisma);

      expect(messageOf(result)).not.toBe(BLOCK_MESSAGE);
      expect(prisma.userBlock.findMany).toHaveBeenCalled();
    });

    it('creates the direct room for a new conversation', async () => {
      const prisma = buildPrisma([]);

      await send(intoNewRoomWith(bobId), aliceId, prisma);

      expect(prisma.messageRoom.create).toHaveBeenCalled();
    });
  });

  it("does not apply a block to a post's chat", async () => {
    const prisma = buildPrisma([{ blockerId: aliceId, blockedUserId: bobId }]);
    const source = `mutation { m: createMessage(message: { messageRoomId: "${postRoomId}", title: "t", text: "hi", type: "POST" }) { _id } }`;

    await send(source, aliceId, prisma);

    expect(prisma.userBlock.findMany).not.toHaveBeenCalled();
  });
});
