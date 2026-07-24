import { GraphQLInputObjectType, GraphQLString, GraphQLNonNull, GraphQLList, GraphQLBoolean } from 'graphql';

export const UserInput = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: {
    _id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    email: { type: GraphQLString },
    password: { type: GraphQLString },
    quotes: { type: new GraphQLList(GraphQLString) },
    avatar: { type: GraphQLString },
    bio: { type: GraphQLString },
    contributorBadge: { type: GraphQLBoolean },
    themePreference: { type: GraphQLString },
  },
});
