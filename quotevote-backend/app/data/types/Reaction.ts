import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';

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
    }),
  });

export const Reaction = ReactionType;
