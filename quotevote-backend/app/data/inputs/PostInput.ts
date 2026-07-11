import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull } from 'graphql';

export const PostInput = new GraphQLInputObjectType({
  name: 'PostInput',
  fields: {
    userId: { type: new GraphQLNonNull(GraphQLString) },
    groupId: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    text: { type: new GraphQLNonNull(GraphQLString) },
    citationUrl: { type: GraphQLString },
    attribution: { type: GraphQLString },
    attributionType: { type: GraphQLString },
  },
});
