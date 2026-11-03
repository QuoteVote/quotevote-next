import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import { isObjectId } from '~/data/resolvers/utils/common';
import { MESSAGE_ROOM_SELECT, type MessageRoomRecord } from '~/data/resolvers/utils/chatRooms';
import { addUserToPostRoom } from '~/data/resolvers/utils/messages';
import { assertNoBlockBetween } from '~/data/utils/userBlock';

type Prisma = GraphQLContext['prisma'];

/** What a deleted message in a post's chat shows in its place. */
export const DELETED_MESSAGE_TEXT = 'Message deleted by its author';

/** Longest emoji accepted as a reaction, in UTF-16 units (family and flag sequences fit). */
export const MAX_REACTION_LENGTH = 32;

export const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

export const forbidden = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'FORBIDDEN' } });

export const notFound = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'NOT_FOUND' } });

export function requireUserId(context: GraphQLContext): string {
  if (!context.userId) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.userId;
}

/** A post's chat takes new messages only while the post exists and isn't deleted. */
export async function assertPostChatOpen(prisma: Prisma, postId: string | null): Promise<void> {
  const post = postId
    ? await prisma.post.findUnique({ where: { id: postId }, select: { deleted: true } })
    : null;
  if (!post) throw notFound('Post not found');
  if (post.deleted === true) throw forbidden("This post's chat is read-only");
}

export async function findRoom(prisma: Prisma, roomId: string): Promise<MessageRoomRecord | null> {
  if (!isObjectId(roomId)) return null;
  return prisma.messageRoom.findUnique({ where: { id: roomId }, select: MESSAGE_ROOM_SELECT });
}

/**
 * Check that the caller may write in a room. A post's chat is open to everyone
 * while the post is live; any other room needs membership, and a direct room
 * is closed while either member blocks the other.
 */
export async function assertCanWrite(
  prisma: Prisma,
  room: MessageRoomRecord,
  userId: string
): Promise<void> {
  if (room.messageType === 'POST') {
    await assertPostChatOpen(prisma, room.postId);
    return;
  }
  if (!room.userIds.includes(userId)) throw forbidden('Not a member of this conversation');
  if (room.messageType === 'USER') {
    const other = room.userIds.find((id) => id !== userId);
    if (other) await assertNoBlockBetween(prisma, userId, other);
  }
}

/** Find the direct room between two members, or start one. */
async function findOrCreateDirectRoom(
  prisma: Prisma,
  userId: string,
  recipientId: string
): Promise<MessageRoomRecord> {
  if (!isObjectId(recipientId)) throw badInput('Invalid recipient');
  if (recipientId.toLowerCase() === userId.toLowerCase()) {
    throw badInput('Cannot message yourself');
  }
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true },
  });
  if (!recipient) throw badInput('User not found');
  await assertNoBlockBetween(prisma, userId, recipient.id);

  // Legacy direct rooms are marked by messageType, not isDirect.
  const existing = await prisma.messageRoom.findFirst({
    where: { userIds: { hasEvery: [userId, recipient.id] }, messageType: 'USER' },
    select: MESSAGE_ROOM_SELECT,
  });
  if (existing) return existing;

  return prisma.messageRoom.create({
    data: {
      userIds: [userId, recipient.id],
      messageType: 'USER',
      isDirect: true,
      lastActivity: new Date(),
    },
    select: MESSAGE_ROOM_SELECT,
  });
}

/**
 * The room a new message goes to: the given room, or, when there is none,
 * the direct room with `componentId` (type USER) or the chat of the post
 * `componentId` (type POST), as legacy createMessage resolved it.
 */
export async function resolveRoomForMessage(
  prisma: Prisma,
  userId: string,
  input: { messageRoomId?: string | null; componentId?: string | null; type?: string | null }
): Promise<MessageRoomRecord> {
  const roomId = input.messageRoomId?.trim();
  const existing = roomId ? await findRoom(prisma, roomId) : null;
  if (existing) {
    await assertCanWrite(prisma, existing, userId);
    // Writing in a post's chat makes the writer a member, so it lists for them.
    return existing.messageType === 'POST' && existing.postId
      ? addUserToPostRoom(prisma, existing.postId, userId)
      : existing;
  }

  const componentId = input.componentId?.trim();
  if (!componentId) throw badInput('Message room not found');
  if (input.type === 'USER') return findOrCreateDirectRoom(prisma, userId, componentId);
  if (input.type === 'POST') {
    if (!isObjectId(componentId)) throw badInput('Invalid post id');
    await assertPostChatOpen(prisma, componentId);
    return addUserToPostRoom(prisma, componentId, userId);
  }
  throw badInput('Message room not found');
}

/** Trimmed emoji, or BAD_USER_INPUT when it's empty or too long. */
export function validEmoji(raw: string | null | undefined): string {
  const emoji = raw?.trim() ?? '';
  if (!emoji || emoji.length > MAX_REACTION_LENGTH) throw badInput('Invalid emoji');
  return emoji;
}
