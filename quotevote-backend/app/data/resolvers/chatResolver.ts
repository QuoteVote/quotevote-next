import { GraphQLError } from 'graphql';
import type * as Common from '~/types/common';
import { SUBSCRIPTION_EVENTS, type GraphQLContext } from '~/types/graphql';
import type { MessageSearchResult } from '~/data/types/MessageSearch';
import { attachMessageAuthors, getReadableMessageRoom } from './utils/messages';
import { isLive } from '~/data/resolvers/utils/batchLoad';
import {
  MESSAGE_ROOM_SELECT,
  byLatestMessage,
  filterListedRooms,
  loadRoomViews,
} from '~/data/resolvers/utils/chatRooms';
import {
  MESSAGE_RECORD_SELECT,
  REACTION_SELECT,
  toMessageEntity,
  toReaction,
  type MessageRecord,
} from '~/data/resolvers/utils/commentsQuotes';
import {
  DELETED_MESSAGE_TEXT,
  assertCanWrite,
  assertPostChatOpen,
  badInput,
  findRoom,
  forbidden,
  notFound,
  requireUserId,
  resolveRoomForMessage,
  validEmoji,
} from '~/data/resolvers/utils/messageWrites';
import { addUserToPostRoom } from '~/data/resolvers/utils/messages';
import { toMessageRoom } from '~/data/resolvers/utils/chatRooms';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import { escapeRegExp, isObjectId } from '~/data/resolvers/utils/common';

import {
  MESSAGE_SEARCH_DEFAULT_LIMIT,
  MESSAGE_SEARCH_MAX_LIMIT,
  MESSAGE_SEARCH_MAX_TEXT_LENGTH,
  MESSAGE_SEARCH_SELECT,
  buildSnippet,
  encodeSearchCursor,
  parseSearchCursor,
} from './utils/messageSearch';

import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';

/** Messages per member per minute, as legacy allowed. */
const MESSAGE_RATE_LIMIT = 10;
const MESSAGE_RATE_WINDOW_MS = 60_000;

/**
 * What a room's history shows. A deleted message in a post's chat stays in
 * place as a note that its author deleted it; direct messages can't be deleted,
 * and the few legacy ones that were stay hidden.
 */
function visibleMessages(
  messages: MessageRecord[],
  messageType: Common.MessageType
): Common.Message[] {
  if (messageType !== 'POST') return messages.filter(isLive).map(toMessageEntity);
  return messages.map((record) =>
    isLive(record)
      ? toMessageEntity(record)
      : { ...toMessageEntity(record), title: undefined, text: DELETED_MESSAGE_TEXT }
  );
}

/** The message and its room, when the caller may change it. */
async function loadWritableMessage(
  context: GraphQLContext,
  messageId: string,
  userId: string
): Promise<{ message: MessageRecord; room: NonNullable<Awaited<ReturnType<typeof findRoom>>> }> {
  const message = isObjectId(messageId)
    ? await context.prisma.message.findUnique({
        where: { id: messageId },
        select: MESSAGE_RECORD_SELECT,
      })
    : null;
  const room = message ? await findRoom(context.prisma, message.messageRoomId) : null;
  if (!message || !room || !isLive(message)) throw notFound('Message not found');
  await assertCanWrite(context.prisma, room, userId);
  return { message, room };
}

export const chatResolver = {
  Query: {
    messageRoom: async (
      _parent: unknown,
      args: { otherUserId: string },
      context: GraphQLContext
    ): Promise<Common.MessageRoomView | null> => {
      if (!context.userId || !isObjectId(args.otherUserId)) return null;
      // Legacy direct rooms are marked by messageType, not isDirect (false on all of them).
      // Legacy also created the room here when missing; that belongs with createMessage (#633).
      const room = await context.prisma.messageRoom.findFirst({
        where: {
          userIds: { hasEvery: [context.userId, args.otherUserId] },
          messageType: 'USER',
        },
        select: MESSAGE_ROOM_SELECT,
      });
      if (!room) return null;
      const [view] = await loadRoomViews(context.prisma, [room], context.userId);
      return view;
    },

    messageRooms: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.MessageRoomView[]> => {
      if (!context.userId) return [];
      const rooms = await context.prisma.messageRoom.findMany({
        where: { userIds: { has: context.userId } },
        select: MESSAGE_ROOM_SELECT,
      });
      const listed = await filterListedRooms(context.prisma, rooms, context.userId);
      const views = await loadRoomViews(context.prisma, listed, context.userId);
      return views.sort(byLatestMessage);
    },

    messages: async (
      _parent: unknown,
      args: { messageRoomId: string },
      context: GraphQLContext
    ): Promise<Common.MessageWithAuthor[]> => {
      const room = await getReadableMessageRoom(context.prisma, args.messageRoomId, context.userId);
      if (!room) return [];
      // Legacy messages have no createdAt/updatedAt and may lack `deleted`, so read
      // the safe columns and check the flag in code.
      const messages = await context.prisma.message.findMany({
        where: { messageRoomId: args.messageRoomId },
        orderBy: { created: 'asc' },
        select: MESSAGE_RECORD_SELECT,
      });
      return attachMessageAuthors(
        context.prisma,
        visibleMessages(messages, room.messageType),
        room.messageType
      );
    },

    messageReactions: async (
      _parent: unknown,
      args: { messageId: string },
      context: GraphQLContext
    ): Promise<Common.Reaction[]> => {
      // Legacy reactions have no createdAt/updatedAt, so select the safe fields.
      const reactions = await context.prisma.reaction.findMany({
        where: { messageId: args.messageId },
        select: REACTION_SELECT,
      });
      return reactions.map(toReaction);
    },

    searchMessages: async (
      _parent: unknown,
      args: { text: string; limit?: number | null; cursor?: string | null },
      context: GraphQLContext
    ): Promise<MessageSearchResult> => {
      if (!context.userId) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const text = args.text.trim();
      if (text.length > MESSAGE_SEARCH_MAX_TEXT_LENGTH) {
        throw new GraphQLError('Search text is too long', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const limit = args.limit ?? MESSAGE_SEARCH_DEFAULT_LIMIT;
      if (!Number.isInteger(limit) || limit < 1) {
        throw new GraphQLError('limit must be a positive integer', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      const cursor = args.cursor ? parseSearchCursor(args.cursor) : null;
      if (args.cursor && !cursor) {
        throw new GraphQLError('Invalid cursor', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!text) return { results: [], nextCursor: null };

      const rooms = await context.prisma.messageRoom.findMany({
        where: { userIds: { has: context.userId } },
        select: { id: true },
      });
      if (rooms.length === 0) return { results: [], nextCursor: null };

      const pageSize = Math.min(limit, MESSAGE_SEARCH_MAX_LIMIT);
      const rows = await context.prisma.message.findMany({
        where: {
          messageRoomId: { in: rooms.map((room) => room.id) },
          text: { contains: escapeRegExp(text), mode: 'insensitive' },
          ...(cursor
            ? {
                OR: [
                  { created: { lt: cursor.created } },
                  { created: cursor.created, id: { lt: cursor.id } },
                ],
              }
            : {}),
        },
        orderBy: [{ created: 'desc' }, { id: 'desc' }],
        take: pageSize + 1,
        select: MESSAGE_SEARCH_SELECT,
      });

      const page = rows.slice(0, pageSize);
      const lastRead = page[page.length - 1];
      // The cursor follows the last row read, not the last one returned, so
      // skipped deleted messages never stall pagination. Short pages are fine.
      const nextCursor =
        rows.length > pageSize ? encodeSearchCursor(lastRead.created, lastRead.id) : null;
      // `deleted: { not: true }` would drop legacy messages that lack the field,
      // so deleted messages are filtered in code, as `messages` does.
      const live = page.filter(isLive);
      const authorIds = [...new Set(live.map((message) => message.userId))];
      const authors = authorIds.length
        ? await context.prisma.user.findMany({
            where: { id: { in: authorIds } },
            select: PUBLIC_USER_SELECT,
          })
        : [];
      const authorsById = new Map(authors.map((u) => [u.id, toPublicUser(u as PrismaUserRecord)]));

      return {
        results: live.map((message) => ({
          _id: message.id,
          messageRoomId: message.messageRoomId,
          created: message.created,
          snippet: buildSnippet(message.text, text),
          user: authorsById.get(message.userId) ?? null,
        })),
        nextCursor,
      };
    },
  },
  Mutation: {
    createMessage: async (
      _parent: unknown,
      args: {
        message: {
          messageRoomId?: string | null;
          componentId?: string | null;
          title?: string | null;
          text?: string | null;
          type?: string | null;
        };
      },
      context: GraphQLContext
    ): Promise<Common.MessageWithAuthor> => {
      const userId = requireUserId(context);
      const text = args.message.text?.trim();
      if (!text) throw badInput('Message text is required');
      try {
        checkRateLimit(userId, 'sendMessage', MESSAGE_RATE_LIMIT, MESSAGE_RATE_WINDOW_MS);
      } catch {
        throw new GraphQLError('Too many messages. Please try again later.', {
          extensions: { code: 'TOO_MANY_REQUESTS' },
        });
      }

      const room = await resolveRoomForMessage(context.prisma, userId, args.message);
      const now = new Date();
      // updateMany and deleteMany don't read the record back; legacy rooms have
      // no createdAt, so `update` would fail on them.
      await Promise.all([
        context.prisma.typing.deleteMany({ where: { messageRoomId: room.id, userId } }),
        context.prisma.messageRoom.updateMany({
          where: { id: room.id },
          data: { lastActivity: now },
        }),
      ]);
      const created = await context.prisma.message.create({
        data: {
          messageRoomId: room.id,
          userId,
          title: args.message.title ?? undefined,
          text,
          created: now,
        },
        select: MESSAGE_RECORD_SELECT,
      });

      const [message] = await attachMessageAuthors(
        context.prisma,
        [toMessageEntity(created)],
        room.messageType
      );
      // Legacy marks new-message events with mutation_type 'CREATED'.
      const event = { ...message, mutation_type: 'CREATED' };
      await context.pubsub.publish(SUBSCRIPTION_EVENTS.MESSAGE_CREATED, { message: event });
      return event;
    },

    deleteMessage: async (
      _parent: unknown,
      args: { messageId: string },
      context: GraphQLContext
    ): Promise<{ _id: string }> => {
      const userId = requireUserId(context);
      const { message, room } = await loadWritableMessage(context, args.messageId, userId);
      if (room.messageType !== 'POST') throw forbidden("Direct messages can't be deleted");
      if (message.userId !== userId) throw forbidden('Only the author can delete this message');

      await context.prisma.message.updateMany({
        where: { id: message.id },
        data: { deleted: true },
      });
      return { _id: message.id };
    },

    createPostMessageRoom: async (
      _parent: unknown,
      args: { postId: string },
      context: GraphQLContext
    ): Promise<Common.MessageRoom> => {
      const userId = requireUserId(context);
      if (!isObjectId(args.postId)) throw badInput('Invalid post id');
      await assertPostChatOpen(context.prisma, args.postId);
      return toMessageRoom(await addUserToPostRoom(context.prisma, args.postId, userId));
    },

    updateMessageReadBy: async (
      _parent: unknown,
      args: { messageRoomId: string },
      context: GraphQLContext
    ): Promise<Common.Message[]> => {
      const userId = requireUserId(context);
      const room = await findRoom(context.prisma, args.messageRoomId);
      if (!room || !room.userIds.includes(userId)) return [];

      const messages = (
        await context.prisma.message.findMany({
          where: { messageRoomId: room.id },
          orderBy: { created: 'asc' },
          select: MESSAGE_RECORD_SELECT,
        })
      ).filter(isLive);
      // Read state is checked in code: legacy messages may have no readBy.
      const unread = messages.filter(
        (message) => message.userId !== userId && !(message.readBy ?? []).includes(userId)
      );
      if (unread.length > 0) {
        await context.prisma.message.updateMany({
          where: { id: { in: unread.map((message) => message.id) } },
          data: { readBy: { push: userId } },
        });
      }

      const lastSeen = unread[unread.length - 1] ?? messages[messages.length - 1];
      if (lastSeen) {
        // lastSeenMessages is a map keyed by member id; legacy rooms may not have it.
        await context.prisma.$runCommandRaw({
          update: 'messagerooms',
          updates: [
            {
              q: { _id: { $oid: room.id } },
              u: [
                {
                  $set: {
                    lastSeenMessages: {
                      $mergeObjects: [
                        {
                          $cond: [
                            { $eq: [{ $type: '$lastSeenMessages' }, 'object'] },
                            '$lastSeenMessages',
                            {},
                          ],
                        },
                        { [userId]: { $oid: lastSeen.id } },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        });
      }

      return unread.map((message) => ({
        ...toMessageEntity(message),
        readBy: [...(message.readBy ?? []), userId],
      }));
    },

    addMessageReaction: async (
      _parent: unknown,
      args: { reaction: { messageId?: string | null; emoji?: string | null } },
      context: GraphQLContext
    ): Promise<Common.Reaction> => {
      const userId = requireUserId(context);
      const emoji = validEmoji(args.reaction.emoji);
      const { message } = await loadWritableMessage(context, args.reaction.messageId ?? '', userId);

      // One reaction per member per message: reacting again changes the emoji.
      const existing = await context.prisma.reaction.findFirst({
        where: { userId, messageId: message.id },
        select: REACTION_SELECT,
      });
      const reaction = existing
        ? await context.prisma.reaction.update({
            where: { id: existing.id },
            data: { emoji },
            select: REACTION_SELECT,
          })
        : await context.prisma.reaction.create({
            data: { userId, messageId: message.id, emoji },
            select: REACTION_SELECT,
          });
      return toReaction(reaction);
    },

    updateReaction: async (
      _parent: unknown,
      args: { _id: string; emoji: string },
      context: GraphQLContext
    ): Promise<Common.Reaction> => {
      const userId = requireUserId(context);
      const emoji = validEmoji(args.emoji);
      const existing = isObjectId(args._id)
        ? await context.prisma.reaction.findUnique({
            where: { id: args._id },
            select: REACTION_SELECT,
          })
        : null;
      if (!existing) throw notFound('Reaction not found');
      if (existing.userId !== userId) throw forbidden('Not authorized');
      if (existing.messageId) await loadWritableMessage(context, existing.messageId, userId);

      const reaction = await context.prisma.reaction.update({
        where: { id: existing.id },
        data: { emoji },
        select: REACTION_SELECT,
      });
      return toReaction(reaction);
    },
  },
  MessageRoom: {
    // The room queries load this in a batch; other parents load it here.
    postDetails: async (
      parent: Common.MessageRoom & { postDetails?: Common.MessageRoomPostDetails | null },
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.MessageRoomPostDetails | null> => {
      if (parent.postDetails !== undefined) return parent.postDetails;
      if (!parent.postId) return null;
      const post = await context.prisma.post.findUnique({
        where: { id: parent.postId },
        select: { id: true, title: true, text: true, userId: true, url: true },
      });
      if (!post) return null;
      return {
        _id: post.id,
        title: post.title ?? '',
        text: post.text ?? '',
        userId: post.userId,
        url: post.url ?? '',
      };
    },
    messages: async (
      parent: Common.MessageRoom,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.MessageWithAuthor[]> => {
      const room = await getReadableMessageRoom(context.prisma, parent._id, context.userId);
      if (!room) return [];
      // Legacy messages have no createdAt/updatedAt and may lack `deleted`, so read
      // the safe columns and check the flag in code.
      const messages = await context.prisma.message.findMany({
        where: { messageRoomId: parent._id },
        orderBy: { created: 'asc' },
        select: MESSAGE_RECORD_SELECT,
      });
      return attachMessageAuthors(
        context.prisma,
        visibleMessages(messages, room.messageType),
        room.messageType
      );
    },
  },
};
