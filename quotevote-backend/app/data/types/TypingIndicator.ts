import {
  GraphQLBoolean,
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

interface TypingIndicatorShape extends Common.Typing {
  user?: Common.User;
}

export const TypingIndicatorType: GraphQLObjectType<TypingIndicatorShape, GraphQLContext> =
  new GraphQLObjectType<TypingIndicatorShape, GraphQLContext>({
    name: 'TypingIndicator',
    description: 'Live typing indicator broadcast within a message room.',
    fields: (): GraphQLFieldConfigMap<TypingIndicatorShape, GraphQLContext> => ({
      messageRoomId: { type: new GraphQLNonNull(GraphQLString) },
      userId: { type: new GraphQLNonNull(GraphQLString) },
      user: {
        type: UserType,
        resolve: async (typing, _args, context) => {
          if (typing.user) return typing.user;
          const user = await context.prisma.user.findUnique({ where: { id: typing.userId } });
          return user
            ? {
                _id: user.id,
                username: user.username,
                name: user.name ?? undefined,
                email: user.email,
                avatar: user.avatar as Common.User['avatar'],
                joined: user.joined,
              }
            : null;
        },
      },
      messageRoom: {
        type: MessageRoomType,
        resolve: async (typing, _args, context) => {
          const room = await context.prisma.messageRoom.findUnique({
            where: { id: typing.messageRoomId },
          });
          return room
            ? {
                _id: room.id,
                users: room.userIds,
                postId: room.postId ?? undefined,
                messageType: room.messageType,
                created: room.created,
                lastActivity: room.lastActivity ?? undefined,
                lastMessageTime: room.lastMessageTime ?? undefined,
                title: room.title ?? undefined,
                avatar: room.avatar as string | undefined,
                isDirect: room.isDirect,
                unreadMessages: room.unreadMessages,
                updatedAt: room.updatedAt,
              }
            : null;
        },
      },
      isTyping: { type: new GraphQLNonNull(GraphQLBoolean) },
      timestamp: { type: new GraphQLNonNull(DateScalar) },
    }),
  });

interface TypingResponseShape {
  success: boolean;
}

export const TypingResponseType: GraphQLObjectType<TypingResponseShape, GraphQLContext> =
  new GraphQLObjectType<TypingResponseShape, GraphQLContext>({
    name: 'TypingResponse',
    description: 'Response payload for updateTyping mutation.',
    fields: (): GraphQLFieldConfigMap<TypingResponseShape, GraphQLContext> => ({
      success: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
  });

export const TypingIndicator = TypingIndicatorType;
