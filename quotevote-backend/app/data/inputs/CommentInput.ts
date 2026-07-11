import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull, GraphQLInt } from 'graphql';

export const CommentInput = new GraphQLInputObjectType({
  name: 'CommentInput',
  fields: {
    postId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    startWordIndex: { type: new GraphQLNonNull(GraphQLInt) },
    endWordIndex: { type: new GraphQLNonNull(GraphQLInt) },
    quote: { type: GraphQLString },
    url: { type: GraphQLString },
    reaction: { type: GraphQLString },
  },
});
