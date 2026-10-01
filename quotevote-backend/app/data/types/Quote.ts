import {
  GraphQLBoolean,
  GraphQLID,
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

interface QuoteShape extends Common.Quote {
  quoter?: string;
}

export const QuoteType: GraphQLObjectType<QuoteShape, GraphQLContext> = new GraphQLObjectType<
  QuoteShape,
  GraphQLContext
>({
  name: 'Quote',
  description: 'A quoted excerpt of a post.',
  fields: (): GraphQLFieldConfigMap<QuoteShape, GraphQLContext> => ({
    _id: { type: GraphQLString },
    created: { type: DateScalar },
    postId: { type: GraphQLID },
    quote: { type: GraphQLString },
    quoted: { type: GraphQLString },
    quoter: {
      type: GraphQLString,
      resolve: (quote) => quote.quoter ?? quote.userId,
    },
    startWordIndex: { type: GraphQLInt },
    endWordIndex: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
    user: {
      type: UserType,
      resolve: async (quote, _args, context) => {
        const preloaded = (quote as Common.Quote & { user?: Common.User }).user;
        if (preloaded) return preloaded;
        const user = await context.prisma.user.findUnique({
          where: { id: quote.userId },
          select: PUBLIC_USER_SELECT,
        });
        return user ? toPublicUser(user as PrismaUserRecord) : null;
      },
    },
    post: {
      type: PostType,
      resolve: async (quote, _args, context) => {
        const post = await context.prisma.post.findUnique({
          where: { id: quote.postId },
          select: POST_RECORD_SELECT,
        });
        return post ? toGraphQLPost(post, null) : null;
      },
    },
  }),
});

export const Quote = QuoteType;
