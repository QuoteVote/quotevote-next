import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar, JSONScalar } from './scalars';
import { MessageType } from './Message';
import { UserType } from './User';
import { TypingIndicatorType } from './TypingIndicator';
import { PostType } from './Post';
import { MessageTypeEnum } from './enums';

interface PostDetailsShape {
  _id?: string;
  title?: string;
  text?: string;
  userId?: string;
  url?: string;
}

export const PostDetailsType: GraphQLObjectType<PostDetailsShape, GraphQLContext> =
  new GraphQLObjectType<PostDetailsShape, GraphQLContext>({
    name: 'PostDetails',
    description: 'Inlined Post snapshot displayed with the MessageRoom that wraps it.',
    fields: (): GraphQLFieldConfigMap<PostDetailsShape, GraphQLContext> => ({
      _id: { type: GraphQLID },
      title: { type: GraphQLString },
      text: { type: GraphQLString },
      userId: { type: GraphQLID },
      url: { type: GraphQLString },
    }),
  });

interface MessageRoomShape extends Common.MessageRoom {
  messages?: Common.Message[];
  postDetails?: PostDetailsShape;
}

export const MessageRoomType: GraphQLObjectType<MessageRoomShape, GraphQLContext> =
  new GraphQLObjectType<MessageRoomShape, GraphQLContext>({
    name: 'MessageRoom',
    description: 'Chat room (direct or group), aligned with Prisma MessageRoom.',
    fields: (): GraphQLFieldConfigMap<MessageRoomShape, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLID) },
      users: { type: new GraphQLList(GraphQLString), resolve: (r) => r.users ?? [] },
      messageType: { type: MessageTypeEnum },
      created: { type: DateScalar },
      lastActivity: { type: DateScalar },
      lastMessageTime: { type: DateScalar },
      title: { type: GraphQLString },
      avatar: { type: JSONScalar },
      unreadMessages: { type: GraphQLInt },
      postId: { type: GraphQLString },
      messages: {
        type: new GraphQLList(MessageType),
        resolve: async (r, _args, context) => {
          if (!context.userId) return [];
          const room = await context.prisma.messageRoom.findFirst({
            where: {
              id: r._id,
              userIds: { has: context.userId },
            },
            select: { id: true },
          });
          if (!room) return [];
          if (r.messages) return r.messages;
          const messages = await context.prisma.message.findMany({
            where: { messageRoomId: r._id },
            orderBy: { created: 'asc' },
          });
          return messages.map((message) => ({
            _id: message.id,
            messageRoomId: message.messageRoomId,
            userId: message.userId,
            userName: message.userName ?? undefined,
            title: message.title ?? undefined,
            text: message.text,
            type: (message.type as Common.MessageType | null) ?? undefined,
            mutation_type: message.mutationType ?? undefined,
            deleted: message.deleted,
            readBy: message.readBy,
            readByDetailed: message.readByDetailed,
            deliveredTo: message.deliveredTo,
            created: message.created,
            updatedAt: message.updatedAt,
          }));
        },
      },
      postDetails: { type: PostDetailsType },
      usersData: {
        type: new GraphQLList(UserType),
        resolve: async (r, _args, context) => {
          const users = await context.prisma.user.findMany({
            where: { id: { in: r.users ?? [] } },
          });
          return users.map((user) => ({
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
          }));
        },
      },
      typingIndicators: {
        type: new GraphQLList(TypingIndicatorType),
        resolve: async (r, _args, context) => {
          const typing = await context.prisma.typing.findMany({
            where: { messageRoomId: r._id },
          });
          return typing.map((entry) => ({
            messageRoomId: entry.messageRoomId,
            userId: entry.userId,
            isTyping: entry.isTyping,
            timestamp: entry.timestamp,
          }));
        },
      },
      post: {
        type: PostType,
        resolve: (_r, _args, context) =>
          _r.postId ? context.prisma.post.findUnique({ where: { id: _r.postId } }) : null,
      },
    }),
  });

export const MessageRoom = MessageRoomType;
