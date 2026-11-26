import type { MessageRoom, Prisma, PrismaClient } from '@prisma/client';
import type * as Common from '~/types/common';
import { unique, whenAny } from '~/data/resolvers/utils/batchLoad';
import { canAccessRoom } from '~/data/utils/roomAccess';
import { MESSAGE_ROOM_SELECT, type MessageRoomRecord } from '~/data/resolvers/utils/chatRooms';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
/**
 * Return a room when the caller may read its history.
 * Post-room history is public; direct/user-room history requires membership.
 */
export const getReadableMessageRoom = async (
  prisma: PrismaClient,
  messageRoomId: string,
  userId: string | null
): Promise<Pick<MessageRoom, 'messageType' | 'userIds'> | null> => {
  const room = await prisma.messageRoom.findUnique({
    where: { id: messageRoomId },
    select: { messageType: true, userIds: true },
  });

  if (!room) return null;
  return canAccessRoom(room, userId) ? room : null;
};

/**
 * Add each message's author in one query, with the name and room type legacy
 * returned alongside it. Authors are read with public fields only.
 */
export async function attachMessageAuthors(
  prisma: Pick<PrismaClient, 'user'>,
  messages: Common.Message[],
  messageType: Common.MessageType
): Promise<Common.MessageWithAuthor[]> {
  const users = await whenAny(unique(messages.map((message) => message.userId)), (ids) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: PUBLIC_USER_SELECT })
  );
  const usersById = new Map(users.map((user) => [user.id, toPublicUser(user as PrismaUserRecord)]));

  return messages.map((message) => {
    const user = usersById.get(message.userId) ?? null;
    return {
      ...message,
      userName: user ? user.name : 'Unknown User',
      type: messageType,
      user,
    };
  });
}

/**
 * The oldest room matching `where`. Ids grow with time, so this is the one created first.
 * Every lookup of a post's room or a pair's direct room goes through this, so when two
 * rooms exist (created at the same moment here, or by the legacy API, which reads the
 * first one too) everyone reads and writes the same one (#790, #791).
 */
export const findOldestRoom = (
  prisma: Pick<PrismaClient, 'messageRoom'>,
  where: Prisma.MessageRoomWhereInput
): Promise<MessageRoomRecord | null> =>
  prisma.messageRoom.findFirst({ where, orderBy: { id: 'asc' }, select: MESSAGE_ROOM_SELECT });

/**
 * Creates a room for `where` and keeps only the oldest one (#790, #791). Two requests that
 * find no room at the same moment both create one; each then reads the oldest. The one whose
 * room isn't the oldest deletes its own, which nobody has used yet, and returns the oldest.
 * A unique index can't do this here: the key is only unique for post rooms (or only for
 * direct ones), existing data may already hold duplicates, and the legacy API still creates
 * rooms in the same collection.
 */
export async function createRoomOnce(
  prisma: Pick<PrismaClient, 'messageRoom'>,
  where: Prisma.MessageRoomWhereInput,
  data: Prisma.MessageRoomUncheckedCreateInput
): Promise<{ room: MessageRoomRecord; created: boolean }> {
  const mine = await prisma.messageRoom.create({ data, select: MESSAGE_ROOM_SELECT });
  const oldest = await findOldestRoom(prisma, where);
  if (!oldest || oldest.id === mine.id) return { room: mine, created: true };
  await prisma.messageRoom.deleteMany({ where: { id: mine.id } });
  return { room: oldest, created: false };
}

/**
 * Add a user to a post's message room.
 * Creates the room if it doesn't exist. Idempotent for existing members.
 * Legacy rooms have no createdAt/updatedAt, so every read and write selects.
 */
export const addUserToPostRoom = async (
  prisma: Pick<PrismaClient, 'messageRoom'>,
  postId: string,
  userId: string
): Promise<MessageRoomRecord> => {
  const where: Prisma.MessageRoomWhereInput = { postId, messageType: 'POST' };
  let existing = await findOldestRoom(prisma, where);

  if (!existing) {
    const { room, created } = await createRoomOnce(prisma, where, {
      userIds: [userId],
      postId,
      messageType: 'POST',
      lastActivity: new Date(),
    });
    // Another request created the post's room first: join that one instead.
    if (created) return room;
    existing = room;
  }

  const now = new Date();
  const addMemberResult = await prisma.messageRoom.updateMany({
    where: {
      id: existing.id,
      NOT: { userIds: { has: userId } },
    },
    data: {
      userIds: { push: userId },
      lastActivity: now,
    },
  });
  if (addMemberResult.count === 0) {
    await prisma.messageRoom.updateMany({
      where: { id: existing.id },
      data: { lastActivity: now },
    });
  }
  const userIds = existing.userIds.includes(userId)
    ? existing.userIds
    : [...existing.userIds, userId];
  return { ...existing, userIds, lastActivity: now };
};
