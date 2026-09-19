import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';
import { MessageRoomType } from './MessageRoom';
import { ReactionType } from './Reaction';
import { PresenceType } from './Presence';
import { MessageTypeEnum } from './enums';

interface MessageShape extends Common.Message {
  userAvatar?: string;
}

const toUser = (user: {
  id: string;
  username: string;
  name: string | null;
  email: string;
  avatar: unknown;
  bio: string | null;
  contributorBadge: boolean;
  upvotes: number;
  downvotes: number;
  isAdmin: boolean;
  accountStatus: Common.AccountStatus;
  joined: Date;
}): Common.User => ({
  _id: user.id,
  username: user.username,
  name: user.name ?? undefined,
  email: user.email,
  avatar: user.avatar as Common.User['avatar'],
  bio: user.bio ?? undefined,
  contributorBadge: user.contributorBadge,
  upvotes: user.upvotes,
  downvotes: user.downvotes,
  admin: user.isAdmin,
  accountStatus: user.accountStatus,
  joined: user.joined,
});

export const ReadByDetailedEntryType: GraphQLObjectType<
  Common.ReadByDetailedEntry,
  GraphQLContext
> = new GraphQLObjectType<Common.ReadByDetailedEntry, GraphQLContext>({
  name: 'ReadByDetailedEntry',
  description: 'Per-user read receipt for a message.',
  fields: (): GraphQLFieldConfigMap<Common.ReadByDetailedEntry, GraphQLContext> => ({
    userId: { type: GraphQLString },
    readAt: { type: DateScalar },
  }),
});

export const MessageType: GraphQLObjectType<MessageShape, GraphQLContext> = new GraphQLObjectType<
  MessageShape,
  GraphQLContext
>({
  name: 'Message',
  description: 'Chat / direct-message entry.',
  fields: (): GraphQLFieldConfigMap<MessageShape, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLID) },
    messageRoomId: { type: GraphQLString },
    userAvatar: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (m) => m.userAvatar ?? '',
    },
    userName: { type: GraphQLString },
    userId: { type: GraphQLString },
    title: { type: GraphQLString },
    text: { type: GraphQLString },
    created: { type: DateScalar },
    type: { type: MessageTypeEnum },
    mutation_type: { type: GraphQLString },
    deleted: { type: GraphQLBoolean },
    user: {
      type: UserType,
      resolve: async (msg, _args, context) => {
        const embedded = (msg as Common.Message & { user?: Common.User }).user;
        if (embedded) return embedded;
        const user = await context.prisma.user.findUnique({ where: { id: msg.userId } });
        return user ? toUser(user) : null;
      },
    },
    messageRoom: {
      type: MessageRoomType,
      resolve: async (msg, _args, context) => {
        const room = await context.prisma.messageRoom.findUnique({
          where: { id: msg.messageRoomId },
        });
        if (!room) return null;
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
          unreadMessages: room.unreadMessages,
          created: room.created,
          updatedAt: room.updatedAt,
        };
      },
    },
    reactions: {
      type: new GraphQLList(ReactionType),
      resolve: async (msg, _args, context) => {
        const reactions = await context.prisma.reaction.findMany({
          where: { messageId: msg._id },
        });
        return reactions.map((reaction) => ({
          _id: reaction.id,
          userId: reaction.userId,
          messageId: reaction.messageId ?? undefined,
          actionId: reaction.actionId ?? undefined,
          emoji: reaction.emoji,
          created: reaction.created,
        }));
      },
    },
    presence: {
      type: PresenceType,
      resolve: async (msg, _args, context) => {
        const presence = await context.prisma.presence.findUnique({
          where: { userId: msg.userId },
        });
        return presence
          ? {
              _id: presence.id,
              userId: presence.userId,
              status: presence.status,
              statusMessage: presence.statusMessage ?? undefined,
              lastHeartbeat: presence.lastHeartbeat ?? undefined,
              lastSeen: presence.lastSeen ?? undefined,
            }
          : null;
      },
    },
    readBy: { type: new GraphQLList(GraphQLString), resolve: (m) => m.readBy ?? [] },
    readByDetailed: {
      type: new GraphQLList(ReadByDetailedEntryType),
      resolve: (m) => m.readByDetailed ?? [],
    },
  }),
});

export const Message = MessageType;
