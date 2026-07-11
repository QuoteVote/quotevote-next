import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull } from 'graphql';

export const RequestUserAccessInput = new GraphQLInputObjectType({
  name: 'RequestUserAccessInput',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLString) },
  },
});
