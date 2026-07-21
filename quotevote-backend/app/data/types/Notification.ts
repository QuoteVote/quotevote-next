import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { UserType } from './User';
import { PostType } from './Post';
import { NotificationTypeEnum } from './enums';

import User from '../models/User';
import Post from '../models/Post';

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
      userBy: {
        type: UserType,
        resolve: (notif) => notif.userBy ?? User.findById(notif.userIdBy).lean(),
      },
      user: {
        type: UserType,
        resolve: (notif) => User.findById(notif.userId).lean(),
      },
      post: {
        type: PostType,
        resolve: (notif) => notif.post ?? (notif.postId ? Post.findById(notif.postId).lean() : null),
      },
      notificationType: { type: NotificationTypeEnum },
      label: { type: GraphQLString },
      status: { type: GraphQLString },
      created: { type: DateScalar },
    }),
  });

export const Notification = NotificationType;
