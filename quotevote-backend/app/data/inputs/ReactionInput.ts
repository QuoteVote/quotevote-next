import { GraphQLInputObjectType, GraphQLString } from 'graphql';

export const ReactionInput = new GraphQLInputObjectType({
  name: 'ReactionInput',
  fields: {
    userId: { type: GraphQLString },
    messageId: { type: GraphQLString },
    actionId: { type: GraphQLString },
    emoji: { type: GraphQLString },
  },
});
