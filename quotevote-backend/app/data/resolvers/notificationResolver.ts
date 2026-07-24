import { GraphQLError } from 'graphql';
import Notification from '../models/Notification';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const DEFAULT_NOTIFICATION_LIMIT = 50;
const MAX_NOTIFICATION_LIMIT = 100;

export const notificationResolver = {
  Query: {
    /**
     * Returns unread notifications for the authenticated user.
     * Matches legacy getNotifications behavior (status: 'new', newest first),
     * with an optional limit to avoid unbounded reads.
     */
    notifications: async (
      _parent: unknown,
      args: { limit?: number | null },
      context: GraphQLContext
    ): Promise<Common.Notification[]> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const requested =
        typeof args.limit === 'number' && Number.isFinite(args.limit) ? Math.floor(args.limit) : DEFAULT_NOTIFICATION_LIMIT;
      const limit = Math.min(Math.max(requested, 1), MAX_NOTIFICATION_LIMIT);

      const userId = context.user._id.toString();
      const notifications = await Notification.find({
        userId,
        status: 'new',
      })
        .sort({ created: -1 })
        .limit(limit)
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
