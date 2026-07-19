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
import { PostType } from './Post';
import { VoteTypeEnum } from './enums';

import User from '../models/User';
import Post from '../models/Post';

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
    type: { type: VoteTypeEnum },
    tags: {
      type: GraphQLString,
      resolve: (v) => (Array.isArray(v.tags) ? v.tags.join(',') : (v.tags ?? null)),
    },
    startWordIndex: { type: GraphQLInt },
    endWordIndex: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
    content: { type: GraphQLString },
    user: {
      type: UserType,
      resolve: (vote) => (vote as any).user ?? User.findById(vote.userId).lean(),
    },
    post: {
      type: PostType,
      resolve: (vote) => Post.findById(vote.postId).lean(),
    },
  }),
});

export const Vote = VoteType;
