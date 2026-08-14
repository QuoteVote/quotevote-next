import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLScalarType, Kind } from 'graphql';
import mongoose from 'mongoose';
import { typeDefs } from './type_definition';
import { JSONScalar, DateScalar } from './types';

// Import all resolvers
import { solidResolvers } from './resolvers/solidResolvers';
import { postsResolver } from './resolvers/postsResolver';
import { userResolver } from './resolvers/userResolver';
import { groupResolver } from './resolvers/groupResolver';
import { chatResolver } from './resolvers/chatResolver';
import { rosterResolver } from './resolvers/rosterResolver';
import { quoteResolver } from './resolvers/quoteResolver';
import { notificationResolver } from './resolvers/notificationResolver';
import { activityResolver } from './resolvers/activityResolver';
import { heartbeatResolver } from './resolvers/heartbeatResolver';
import { reactionResolver } from './resolvers/reactionResolver';

// Define DateTime scalar resolver
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime scalar type',
  serialize(value: any) {
    if (value instanceof Date) {
      return value.toISOString();
    }
    if (typeof value === 'number') {
      return new Date(value).toISOString();
    }
    if (typeof value === 'string') {
      return new Date(value).toISOString();
    }
    return null;
  },
  parseValue(value: any) {
    return value ? new Date(value as string) : null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

// Define ObjectId scalar resolver
const ObjectIdScalar = new GraphQLScalarType({
  name: 'ObjectId',
  description: 'Mongoose ObjectId scalar type',
  serialize(value: any) {
    if (value instanceof mongoose.Types.ObjectId) {
      return value.toHexString();
    }
    if (typeof value === 'string') {
      return value;
    }
    return null;
  },
  parseValue(value: any) {
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
      return new mongoose.Types.ObjectId(value);
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING && mongoose.Types.ObjectId.isValid(ast.value)) {
      return new mongoose.Types.ObjectId(ast.value);
    }
    return null;
  },
});

export const schema = makeExecutableSchema({
  typeDefs,
  resolvers: [
    {
      JSON: JSONScalar,
      Date: DateScalar,
      DateTime: DateTimeScalar,
      ObjectId: ObjectIdScalar,
      Query: {
        hello: () => 'Hello from TypeScript Backend! 🚀',
        status: () => 'Active',
      },
    },
    solidResolvers,
    postsResolver,
    userResolver,
    groupResolver,
    chatResolver,
    rosterResolver,
    quoteResolver,
    notificationResolver,
    activityResolver,
    heartbeatResolver,
    reactionResolver,
  ],
});
