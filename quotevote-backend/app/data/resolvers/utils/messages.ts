import type { Message, MessageRoom, PrismaClient } from '@prisma/client';
import type * as Common from '~/types/common';
import { unique, whenAny } from '~/data/resolvers/utils/batchLoad';
import { canAccessRoom } from '~/data/utils/roomAccess';
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
 * Get all non-deleted messages in a message room.
 */
export const getMessages = async (
  prisma: PrismaClient,
  messageRoomId: string
): Promise<Message[]> => {
  return prisma.message.findMany({
    where: {
      messageRoomId,
      deleted: false,
    },
  });
};

/**
 * Get unread messages for the current user in a message room.
 * Excludes messages sent by the user and messages already read.
 */
export const getUnreadMessages = async (
  prisma: PrismaClient,
  messageRoomId: string,
  userId: string
): Promise<Message[]> => {
  return prisma.message.findMany({
    where: {
      messageRoomId,
      userId: { not: userId },
      NOT: { readBy: { has: userId } },
      deleted: false,
    },
  });
};

/**
 * Add a user to a post's message room.
 * Creates the room if it doesn't exist. Idempotent for existing members.
 */
export const addUserToPostRoom = async (
  prisma: PrismaClient,
  postId: string,
  userId: string
): Promise<MessageRoom> => {
  let messageRoom = await prisma.messageRoom.findFirst({
    where: {
      postId,
      messageType: 'POST',
    },
  });

  if (messageRoom) {
    const now = new Date();
    const addMemberResult = await prisma.messageRoom.updateMany({
      where: {
        id: messageRoom.id,
        NOT: { userIds: { has: userId } },
      },
      data: {
        userIds: { push: userId },
        lastActivity: now,
      },
    });
    if (addMemberResult.count === 0) {
      await prisma.messageRoom.update({
        where: { id: messageRoom.id },
        data: { lastActivity: now },
      });
    }
    messageRoom = await prisma.messageRoom.findUnique({
      where: { id: messageRoom.id },
    });
  } else {
    messageRoom = await prisma.messageRoom.create({
      data: {
        userIds: [userId],
        postId,
        messageType: 'POST',
        lastActivity: new Date(),
      },
    });
  }

  return messageRoom;
};
