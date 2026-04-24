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

export const CommentType: GraphQLObjectType<Common.Comment, GraphQLContext> = new GraphQLObjectType<
  Common.Comment,
  GraphQLContext
>({
  name: 'Comment',
  description: 'Comment attached to a post, aligned with Prisma Comment.',
  fields: (): GraphQLFieldConfigMap<Common.Comment, GraphQLContext> => ({
    _id: { type: GraphQLString },
    created: { type: DateScalar },
    content: { type: GraphQLString },
    userId: { type: GraphQLString },
    startWordIndex: { type: GraphQLInt },
    endWordIndex: { type: GraphQLInt },
    postId: { type: GraphQLString },
    url: { type: GraphQLString },
    reaction: { type: GraphQLString },
    deleted: { type: GraphQLBoolean },
    user: { type: UserType },
  }),
});

export const Comment = CommentType;
