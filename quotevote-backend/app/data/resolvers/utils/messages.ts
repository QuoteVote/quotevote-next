import type { Message, MessageRoom, PrismaClient } from '@prisma/client';

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
  if (room.messageType === 'POST') return room;
  if (userId && room.userIds.includes(userId)) return room;
  return null;
};

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
