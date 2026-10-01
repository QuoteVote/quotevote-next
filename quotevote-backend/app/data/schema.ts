import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './type_definition';
import { JSONScalar, DateScalar, DateTimeScalar, ObjectIdScalar } from './types';

// Import all resolvers
import { solidResolvers } from './resolvers/solidResolvers';
import { postsResolver } from './resolvers/postsResolver';
import { featuredPostsResolver } from './resolvers/featuredPostsResolver';
import { userResolver } from './resolvers/userResolver';
import { tagResolver } from './resolvers/tagResolver';
import { chatResolver } from './resolvers/chatResolver';
import { rosterResolver } from './resolvers/rosterResolver';
import { quoteResolver } from './resolvers/quoteResolver';
import { commentResolver } from './resolvers/commentResolver';
import { notificationResolver } from './resolvers/notificationResolver';
import { activityResolver } from './resolvers/activityResolver';
import { heartbeatResolver } from './resolvers/heartbeatResolver';
import { typingResolver } from './resolvers/typingResolver';
import { reactionResolver } from './resolvers/reactionResolver';

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
    featuredPostsResolver,
    userResolver,
    tagResolver,
    chatResolver,
    rosterResolver,
    quoteResolver,
    commentResolver,
    notificationResolver,
    activityResolver,
    heartbeatResolver,
    typingResolver,
    reactionResolver,
  ],
});
