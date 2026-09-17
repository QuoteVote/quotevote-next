import { GraphQLError } from 'graphql';
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
        typeof args.limit === 'number' && Number.isFinite(args.limit)
          ? Math.floor(args.limit)
          : DEFAULT_NOTIFICATION_LIMIT;
      const limit = Math.min(Math.max(requested, 1), MAX_NOTIFICATION_LIMIT);

      const userId = context.user._id.toString();
      const notifications = await context.prisma.notification.findMany({
        where: { userId, status: 'new' },
        orderBy: { created: 'desc' },
        take: limit,
      });

      return notifications.map(({ id, postId, notificationType, ...rest }) => ({
        ...rest,
        _id: id,
        notificationType: notificationType as Common.NotificationType,
        postId: postId ?? undefined,
      }));
    },
  },
};
