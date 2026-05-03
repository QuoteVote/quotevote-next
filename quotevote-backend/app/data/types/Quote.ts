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
    postId: {
      type: GraphQLInt,
      resolve: (q) => {
        const n = Number(q.postId);
        return Number.isFinite(n) ? n : null;
      },
    },
    quote: { type: GraphQLString },
    quoted: { type: GraphQLString },
    quoter: { type: GraphQLString },
    startWordIndex: { type: GraphQLInt },
    endWordIndex: { type: GraphQLInt },
    deleted: { type: GraphQLBoolean },
    user: { type: UserType },
  }),
});

export const Quote = QuoteType;
