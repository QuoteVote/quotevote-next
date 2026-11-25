/**
 * Rooms and read state when requests arrive at the same moment (#790, #791, #792).
 *
 * Runs the chat mutations against a real MongoDB replica set, sending the same request
 * several times at once, and checks what was saved.
 *
 * Requires a MongoDB replica set in DATABASE_URL. Use a throwaway database: the test drops
 * the documents it creates and nothing else.
 *
 * Run: pnpm test:prisma
 */

jest.mock('~/data/utils/rateLimiter', () => ({
  checkRateLimit: jest.fn().mockResolvedValue(true),
}));
jest.mock('~/data/resolvers/utils/notifications', () => ({
  addNotification: jest.fn().mockResolvedValue(null),
  hasUnreadNotification: jest.fn().mockResolvedValue(false),
}));

import { PrismaClient } from '@prisma/client';
import { chatResolver } from '~/data/resolvers/chatResolver';
import { pubsub } from '~/data/utils/pubsub';
import { runDataCheck } from '~/data/utils/dataCheck';
import type { GraphQLContext } from '~/types/graphql';

const prisma = new PrismaClient();

const hex = (n: number) => n.toString(16).padStart(24, '0');
const members = [1, 2, 3, 4].map((n) => hex(0x790000000 + n));
const postIds = [1, 2, 3].map((n) => hex(0x790000100 + n));

const contextFor = (id: string) =>
  ({
    prisma,
    pubsub,
    user: { _id: id, username: `member-${id.slice(-2)}`, admin: false },
    userId: id,
  }) as unknown as GraphQLContext;

const roomsWhere = async (filter: Record<string, unknown>) =>
  (await prisma.messageRoom.findRaw({
    filter: filter as never,
    options: { projection: { _id: 1 } },
  })) as unknown as { _id: { $oid: string } }[];

const cleanUp = () =>
  Promise.all([
    prisma.$runCommandRaw({
      delete: 'messages',
      deletes: [{ q: { userId: { $in: members.map((id) => ({ $oid: id })) } }, limit: 0 }],
    }),
    prisma.$runCommandRaw({
      delete: 'messagerooms',
      deletes: [
        { q: { postId: { $in: postIds.map((id) => ({ $oid: id })) } }, limit: 0 },
        { q: { users: { $in: members.map((id) => ({ $oid: id })) } }, limit: 0 },
      ],
    }),
    prisma.$runCommandRaw({
      delete: 'posts',
      deletes: [{ q: { _id: { $in: postIds.map((id) => ({ $oid: id })) } }, limit: 0 }],
    }),
    prisma.$runCommandRaw({
      delete: 'users',
      deletes: [{ q: { _id: { $in: members.map((id) => ({ $oid: id })) } }, limit: 0 }],
    }),
  ]);

beforeAll(async () => {
  await cleanUp();
  await prisma.$runCommandRaw({
    insert: 'users',
    documents: members.map((id, i) => ({
      _id: { $oid: id },
      username: `race-member-${i}`,
      name: `Race member ${i}`,
      email: `race-member-${i}@example.test`,
    })),
  });
  await prisma.$runCommandRaw({
    insert: 'posts',
    // Posts written without a room, as older posts are.
    documents: postIds.map((id) => ({
      _id: { $oid: id },
      userId: { $oid: members[0] },
      title: 'A post without a room yet',
      text: 'Text to talk about.',
      deleted: false,
      created: { $date: new Date().toISOString() },
    })),
  });
});

afterAll(async () => {
  await cleanUp();
  await prisma.$disconnect();
});

describe('one discussion room per post (#790)', () => {
  it.each(postIds.map((id, i) => [i + 1, id]))(
    'run %i: three members joining at once share one room',
    async (_run, postId) => {
      const joined = await Promise.all(
        members
          .slice(1)
          .map((id) =>
            chatResolver.Mutation.createPostMessageRoom(null, { postId }, contextFor(id))
          )
      );

      const rooms = await roomsWhere({ postId: { $oid: postId }, messageType: 'POST' });
      expect(rooms).toHaveLength(1);
      expect(new Set(joined.map((room) => room._id))).toEqual(new Set([rooms[0]._id.$oid]));
      const [room] = await prisma.messageRoom.findMany({
        where: { id: rooms[0]._id.$oid },
        select: { userIds: true },
      });
      expect([...room.userIds].sort()).toEqual([...members.slice(1)].sort());
    }
  );
});

describe('one direct conversation per pair (#791)', () => {
  it.each([1, 2, 3])(
    'run %i: two members sending a first message at once share one room',
    async () => {
      const [a, b] = [members[1], members[2]];
      await prisma.$runCommandRaw({
        delete: 'messagerooms',
        deletes: [{ q: { messageType: 'USER', users: { $oid: a } }, limit: 0 }],
      });

      const [fromA, fromB] = await Promise.all([
        chatResolver.Mutation.createMessage(
          null,
          { message: { componentId: b, type: 'USER', text: 'hello from a' } },
          contextFor(a)
        ),
        chatResolver.Mutation.createMessage(
          null,
          { message: { componentId: a, type: 'USER', text: 'hello from b' } },
          contextFor(b)
        ),
      ]);

      const rooms = await roomsWhere({
        messageType: 'USER',
        users: { $all: [{ $oid: a }, { $oid: b }] },
      });
      expect(rooms).toHaveLength(1);
      expect(fromA.messageRoomId).toBe(rooms[0]._id.$oid);
      expect(fromB.messageRoomId).toBe(rooms[0]._id.$oid);
    }
  );
});

describe('one read record per reader (#792)', () => {
  it('records a reader once when three tabs mark the room read at once', async () => {
    const sent = await chatResolver.Mutation.createMessage(
      null,
      { message: { componentId: members[3], type: 'USER', text: 'read me once' } },
      contextFor(members[1])
    );

    await Promise.all(
      [1, 2, 3].map(() =>
        chatResolver.Mutation.updateMessageReadBy(
          null,
          { messageRoomId: sent.messageRoomId },
          contextFor(members[3])
        )
      )
    );

    const [message] = (await prisma.message.findRaw({
      filter: { _id: { $oid: sent._id } },
      options: { projection: { readBy: 1, readByDetailed: 1 } },
    })) as unknown as { readBy: unknown[]; readByDetailed: unknown[] }[];
    expect(message.readBy).toHaveLength(1);
    expect(message.readByDetailed).toHaveLength(1);
  });
});

describe('the data check counts conversations already split in two (#790, #791)', () => {
  it('counts posts with more than one room and pairs with more than one direct room', async () => {
    await cleanUp();
    const room = (extra: Record<string, unknown>) => ({
      lastActivity: { $date: new Date().toISOString() },
      ...extra,
    });
    const [a, b, c] = members.map((id) => ({ $oid: id }));
    await prisma.$runCommandRaw({
      insert: 'messagerooms',
      documents: [
        // Two rooms for one post, one room for another.
        room({ messageType: 'POST', postId: { $oid: postIds[0] }, users: [a] }),
        room({ messageType: 'POST', postId: { $oid: postIds[0] }, users: [b] }),
        room({ messageType: 'POST', postId: { $oid: postIds[1] }, users: [a] }),
        // The same pair stored in both orders, and a different pair once.
        room({ messageType: 'USER', users: [a, b] }),
        room({ messageType: 'USER', users: [b, a] }),
        room({ messageType: 'USER', users: [a, c] }),
      ],
    });

    const report = await runDataCheck({
      run: (command) => prisma.$runCommandRaw(command as never),
      database: 'test',
      models: [],
      enums: [],
    });

    expect(report.records.duplicatePostRooms).toBe(1);
    expect(report.records.duplicateDirectRooms).toBe(1);
  });
});
