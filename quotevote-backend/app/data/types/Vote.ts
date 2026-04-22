import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';

export const VoteType: GraphQLObjectType<Common.Vote, GraphQLContext> = new GraphQLObjectType<
  Common.Vote,
  GraphQLContext
>({
  name: 'Vote',
  description: 'User vote (up/down) on a post, aligned with Prisma Vote.',
  fields: (): GraphQLFieldConfigMap<Common.Vote, GraphQLContext> => ({
    _id: { type: GraphQLString },
    created: { type: DateScalar },
    postId: { type: GraphQLString },
    userId: { type: GraphQLString },
    type: { type: GraphQLString },
    tags: {
      type: GraphQLString,
      resolve: (v) => (Array.isArray(v.tags) ? v.tags.join(',') : (v.tags ?? null)),
    },
    startWordIndex: { type: GraphQLInt },
    endWordIndex: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
    content: { type: GraphQLString },
    user: { type: UserType },
  }),
});

export const Vote = VoteType;
