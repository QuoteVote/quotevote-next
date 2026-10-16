import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext, UserBlockStatusResult } from '~/types/graphql';

export const UserBlockStatusType: GraphQLObjectType<UserBlockStatusResult, GraphQLContext> =
  new GraphQLObjectType<UserBlockStatusResult, GraphQLContext>({
    name: 'UserBlockStatus',
    description: 'Block state between the current user and another user.',
    fields: (): GraphQLFieldConfigMap<UserBlockStatusResult, GraphQLContext> => ({
      userId: { type: new GraphQLNonNull(GraphQLString) },
      blockedByMe: { type: new GraphQLNonNull(GraphQLBoolean) },
      blockedMe: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
  });
