import { GraphQLError } from 'graphql';
import Notification from '../models/Notification';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

export const notificationResolver = {
  Query: {
    /**
     * Returns unread notifications for the authenticated user.
     * Matches legacy getNotifications behavior (status: 'new', newest first).
     */
    notifications: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.Notification[]> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = context.user._id.toString();
      const notifications = await Notification.find({
        userId,
        status: 'new',
      })
        .sort({ created: -1 })
        .lean();

      return notifications.map((n) => ({
        ...n,
        _id: n._id.toString(),
        userId: n.userId?.toString?.() ?? String(n.userId),
        userIdBy: n.userIdBy?.toString?.() ?? String(n.userIdBy),
        postId: n.postId ? n.postId.toString() : undefined,
      })) as unknown as Common.Notification[];
    },
  },
};
