import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';
import { getReadableMessageRoom } from './utils/messages';

function toMessageRoom(room: {
  id: string;
  userIds: string[];
  postId: string | null;
  messageType: Common.MessageType;
  title: string | null;
  avatar: unknown;
  isDirect: boolean;
  lastMessageTime: Date | null;
  lastActivity: Date | null;
  lastSeenMessages: unknown;
  unreadMessages: number;
  created: Date;
  updatedAt: Date;
}): Common.MessageRoom {
  return {
    _id: room.id,
    users: room.userIds,
    postId: room.postId ?? undefined,
    messageType: room.messageType,
    title: room.title ?? undefined,
    avatar: room.avatar as string | undefined,
    isDirect: room.isDirect,
    lastMessageTime: room.lastMessageTime ?? undefined,
    lastActivity: room.lastActivity ?? undefined,
    lastSeenMessages: room.lastSeenMessages as Record<string, string> | undefined,
    unreadMessages: room.unreadMessages,
    created: room.created,
    updatedAt: room.updatedAt,
  };
}

function toMessage(message: {
  id: string;
  messageRoomId: string;
  userId: string;
  userName: string | null;
  title: string | null;
  text: string;
  type: string | null;
  mutationType: string | null;
  deleted: boolean;
  readBy: string[];
  readByDetailed: Array<{ userId: string; readAt: Date }>;
  deliveredTo: Array<{ userId: string; deliveredAt: Date }>;
  created: Date;
  updatedAt: Date;
}): Common.Message {
  return {
    _id: message.id,
    messageRoomId: message.messageRoomId,
    userId: message.userId,
    userName: message.userName ?? undefined,
    title: message.title ?? undefined,
    text: message.text,
    type: (message.type as Common.MessageType | undefined) ?? undefined,
    mutation_type: message.mutationType ?? undefined,
    deleted: message.deleted,
    readBy: message.readBy,
    readByDetailed: message.readByDetailed,
    deliveredTo: message.deliveredTo,
    created: message.created,
    updatedAt: message.updatedAt,
  };
}

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
    ): Promise<Common.MessageRoom | null> => {
      if (!context.userId) return null;
      const room = await context.prisma.messageRoom.findFirst({
        where: {
          userIds: { hasEvery: [context.userId, args.otherUserId] },
          isDirect: true,
        },
      });
      return room ? toMessageRoom(room) : null;
    },

    messageRooms: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.MessageRoom[]> => {
      if (!context.userId) return [];
      const rooms = await context.prisma.messageRoom.findMany({
        where: { userIds: { has: context.userId } },
        orderBy: { lastActivity: 'desc' },
      });
      return rooms.map(toMessageRoom);
    },

    messages: async (
      _parent: unknown,
      args: { messageRoomId: string },
      context: GraphQLContext
    ): Promise<Common.Message[]> => {
      const room = await getReadableMessageRoom(context.prisma, args.messageRoomId, context.userId);
      if (!room) return [];
      const messages = await context.prisma.message.findMany({
        where: { messageRoomId: args.messageRoomId, deleted: false },
        orderBy: { created: 'asc' },
      });
      return messages.filter((message) => !message.deleted).map((message) => toMessage(message));
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
  },

  MessageRoom: {
    postDetails: async (parent: Common.MessageRoom, _args: unknown, context: GraphQLContext) => {
      if (!parent.postId) return null;
      const post = await context.prisma.post.findUnique({
        where: { id: parent.postId },
      });
      if (!post) return null;
      return {
        title: post.title,
        text: post.text,
      };
    },
    messages: async (
      parent: Common.MessageRoom,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.Message[]> => {
      const room = await getReadableMessageRoom(context.prisma, parent._id, context.userId);
      if (!room) return [];
      const messages = await context.prisma.message.findMany({
        where: { messageRoomId: parent._id, deleted: false },
        orderBy: { created: 'asc' },
      });
      return messages.filter((message) => !message.deleted).map((message) => toMessage(message));
    },
  },
};
