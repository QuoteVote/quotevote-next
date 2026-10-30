import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull } from 'graphql';

/**
 * Client creates send `groupId` (legacy / frontend). `tagId` is accepted as an
 * alias — the resolver resolves `tagId ?? groupId` into Prisma `tagId`.
 */
export const PostInput = new GraphQLInputObjectType({
  name: 'PostInput',
  fields: {
    userId: { type: new GraphQLNonNull(GraphQLString) },
    groupId: { type: GraphQLString },
    tagId: { type: GraphQLString },
    title: { type: new GraphQLNonNull(GraphQLString) },
    text: { type: new GraphQLNonNull(GraphQLString) },
    citationUrl: { type: GraphQLString },
    attribution: { type: GraphQLString },
  },
});
