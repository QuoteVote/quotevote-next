import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { UserType } from './User';
import { MessageType } from './Message';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import { MESSAGE_RECORD_SELECT, toMessageEntity } from '~/data/resolvers/utils/commentsQuotes';

export const ReactionType: GraphQLObjectType<Common.Reaction, GraphQLContext> =
  new GraphQLObjectType<Common.Reaction, GraphQLContext>({
    name: 'Reaction',
    description: 'Emoji reaction on a message or action (vote/comment/etc).',
    fields: (): GraphQLFieldConfigMap<Common.Reaction, GraphQLContext> => ({
      _id: { type: GraphQLString },
      created: { type: GraphQLString },
      userId: { type: GraphQLString },
      messageId: { type: GraphQLString },
      actionId: { type: GraphQLString },
      emoji: { type: GraphQLString },
      user: {
        type: UserType,
        resolve: async (rxn, _args, context) => {
          const user = await context.prisma.user.findUnique({
            where: { id: rxn.userId },
            select: PUBLIC_USER_SELECT,
          });
          return user ? toPublicUser(user as PrismaUserRecord) : null;
        },
      },
      message: {
        type: MessageType,
        resolve: async (rxn, _args, context) => {
          if (!rxn.messageId) return null;
          const message = await context.prisma.message.findUnique({
            where: { id: rxn.messageId },
            select: MESSAGE_RECORD_SELECT,
          });
          return message ? toMessageEntity(message) : null;
        },
      },
    }),
  });

export const Reaction = ReactionType;
