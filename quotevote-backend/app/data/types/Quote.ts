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

import User from '../models/User';
import Post from '../models/Post';

interface QuoteShape extends Common.Quote {
  quoted?: string;
  quoter?: string;
  deleted?: boolean;
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
    quoter: { type: GraphQLString },
    startWordIndex: { type: GraphQLInt },
    endWordIndex: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
    user: {
      type: UserType,
      resolve: (quote) => (quote as any).user ?? User.findById(quote.userId).lean(),
    },
    post: {
      type: PostType,
      resolve: (quote) => Post.findById(quote.postId).lean(),
    },
  }),
});

export const Quote = QuoteType;
