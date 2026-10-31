import { GraphQLError } from 'graphql';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';
import type { MessageSearchResult } from '~/data/types/MessageSearch';
import { attachMessageAuthors, getReadableMessageRoom } from './utils/messages';
import { isLive } from '~/data/resolvers/utils/batchLoad';
import {
  MESSAGE_ROOM_SELECT,
  byLatestMessage,
  filterListedRooms,
  loadRoomViews,
} from '~/data/resolvers/utils/chatRooms';
import { MESSAGE_RECORD_SELECT, toMessageEntity } from '~/data/resolvers/utils/commentsQuotes';
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

function toReaction(reaction: {
  id: string;
  userId: string;
  messageId: string | null;
  actionId: string | null;
  emoji: string;
  created: Date;
  updatedAt: Date;
}): Common.Reaction {
  return {
    _id: reaction.id,
    userId: reaction.userId,
    messageId: reaction.messageId ?? undefined,
    actionId: reaction.actionId ?? undefined,
    emoji: reaction.emoji,
    created: reaction.created,
  };
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
        messages.filter(isLive).map(toMessageEntity),
        room.messageType
      );
    },

    messageReactions: async (
      _parent: unknown,
      args: { messageId: string },
      context: GraphQLContext
    ): Promise<Common.Reaction[]> => {
      const reactions = await context.prisma.reaction.findMany({
        where: { messageId: args.messageId },
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
        messages.filter(isLive).map(toMessageEntity),
        room.messageType
      );
    },
  },
};
