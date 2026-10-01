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
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import { POST_RECORD_SELECT, toGraphQLPost } from '~/data/utils/postPrismaMapper';

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
    user: {
      type: UserType,
      resolve: async (comment, _args, context) => {
        const preloaded = (comment as Common.Comment & { user?: Common.User }).user;
        if (preloaded) return preloaded;
        const user = await context.prisma.user.findUnique({
          where: { id: comment.userId },
          select: PUBLIC_USER_SELECT,
        });
        return user ? toPublicUser(user as PrismaUserRecord) : null;
      },
    },
    post: {
      type: PostType,
      resolve: async (comment, _args, context) => {
        if (!comment.postId) return null;
        const post = await context.prisma.post.findUnique({
          where: { id: comment.postId },
          select: POST_RECORD_SELECT,
        });
        return post ? toGraphQLPost(post, null) : null;
      },
    },
  }),
});

export const Comment = CommentType;
