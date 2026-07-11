import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull, GraphQLInt } from 'graphql';

export const QuoteInput = new GraphQLInputObjectType({
  name: 'QuoteInput',
  fields: {
    postId: { type: new GraphQLNonNull(GraphQLString) },
    quoter: { type: new GraphQLNonNull(GraphQLString) },
    quoted: { type: new GraphQLNonNull(GraphQLString) },
    quote: { type: new GraphQLNonNull(GraphQLString) },
    startWordIndex: { type: new GraphQLNonNull(GraphQLInt) },
    endWordIndex: { type: new GraphQLNonNull(GraphQLInt) },
  },
});
