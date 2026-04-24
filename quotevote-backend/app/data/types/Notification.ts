import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';
import { PostType } from './Post';

interface NotificationShape extends Common.Notification {
  userBy?: Common.User;
  post?: Common.Post;
}

export const NotificationType: GraphQLObjectType<NotificationShape, GraphQLContext> =
  new GraphQLObjectType<NotificationShape, GraphQLContext>({
    name: 'Notification',
    description: 'User-facing notification (follow / upvote / comment / etc).',
    fields: (): GraphQLFieldConfigMap<NotificationShape, GraphQLContext> => ({
      _id: { type: GraphQLString },
      userId: { type: GraphQLString },
      userIdBy: { type: GraphQLString },
      userBy: { type: UserType },
      post: { type: PostType },
      notificationType: { type: GraphQLString },
      label: { type: GraphQLString },
      status: { type: GraphQLString },
      created: { type: DateScalar },
    }),
  });

export const Notification = NotificationType;
