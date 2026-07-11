import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull, GraphQLInt } from 'graphql';

export const VoteInput = new GraphQLInputObjectType({
  name: 'VoteInput',
  fields: {
    postId: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: GraphQLString },
    type: { type: new GraphQLNonNull(GraphQLString) },
    tags: { type: new GraphQLNonNull(GraphQLString) },
    startWordIndex: { type: new GraphQLNonNull(GraphQLInt) },
    endWordIndex: { type: new GraphQLNonNull(GraphQLInt) },
    content: { type: GraphQLString },
  },
});
