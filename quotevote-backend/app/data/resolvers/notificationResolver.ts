import { GraphQLError } from 'graphql';
import { isObjectId } from '~/data/resolvers/utils/common';
import {
  NOTIFICATION_SELECT,
  attachNotificationRelations,
  loadNotificationPost,
  loadNotificationSender,
  toNotificationEntity,
} from '~/data/resolvers/utils/notifications';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const DEFAULT_NOTIFICATION_LIMIT = 50;
const MAX_NOTIFICATION_LIMIT = 100;

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

function clampNotificationLimit(limit?: number | null): number {
  const requested =
    typeof limit === 'number' && Number.isFinite(limit)
      ? Math.floor(limit)
      : DEFAULT_NOTIFICATION_LIMIT;
  return Math.min(Math.max(requested, 1), MAX_NOTIFICATION_LIMIT);
}

async function listNotificationsForStatus(
  context: GraphQLContext,
  userId: string,
  status: 'new' | 'deleted',
  limit?: number | null
): Promise<Common.NotificationWithRelations[]> {
  const notifications = await context.prisma.notification.findMany({
    where: { userId, status },
    orderBy: { created: 'desc' },
    take: clampNotificationLimit(limit),
    select: NOTIFICATION_SELECT,
  });

  return attachNotificationRelations(context.prisma, notifications.map(toNotificationEntity));
}

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
    ): Promise<Common.NotificationWithRelations[]> => {
      const userId = requireUserId(context);
      return listNotificationsForStatus(context, userId, 'new', args.limit);
    },

    /**
     * Returns cleared notifications (status: `deleted`) for Notification History (#464).
     */
    notificationHistory: async (
      _parent: unknown,
      args: { limit?: number | null },
      context: GraphQLContext
    ): Promise<Common.NotificationWithRelations[]> => {
      const userId = requireUserId(context);
      return listNotificationsForStatus(context, userId, 'deleted', args.limit);
    },
  },
  Mutation: {
    /**
     * Soft-deletes a notification (status → `deleted`), matching legacy.
     * Only the recipient may remove their own notification.
     */
    removeNotification: async (
      _parent: unknown,
      args: { notificationId: string },
      context: GraphQLContext
    ): Promise<Common.Notification> => {
      const userId = requireUserId(context);

      if (!args.notificationId || !isObjectId(args.notificationId)) {
        throw new GraphQLError('Invalid notificationId', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const existing = await context.prisma.notification.findUnique({
        where: { id: args.notificationId },
        select: NOTIFICATION_SELECT,
      });
      if (!existing) {
        throw new GraphQLError('Notification not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.userId !== userId) {
        throw new GraphQLError('Not authorized to remove this notification', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (existing.status === 'deleted') {
        return toNotificationEntity(existing);
      }

      const updated = await context.prisma.notification.update({
        where: { id: args.notificationId },
        data: { status: 'deleted' },
        select: NOTIFICATION_SELECT,
      });

      return toNotificationEntity(updated);
    },

    /**
     * Soft-deletes every active (`new`) notification for the signed-in user (#464).
     * Returns how many rows were updated.
     */
    clearAllNotifications: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<number> => {
      const userId = requireUserId(context);

      const result = await context.prisma.notification.updateMany({
        where: { userId, status: 'new' },
        data: { status: 'deleted' },
      });

      return result.count;
    },
  },
  // The query loads these in a batch. The live notification subscription
  // publishes a bare notification, so they're loaded here for it.
  Notification: {
    userBy: async (
      parent: Common.Notification & { userBy?: Common.User | null },
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.User | null> =>
      parent.userBy !== undefined
        ? parent.userBy
        : loadNotificationSender(context.prisma, parent.userIdBy),
    post: async (
      parent: Common.Notification & { post?: Common.NotificationPost | null },
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.NotificationPost | null> =>
      parent.post !== undefined ? parent.post : loadNotificationPost(context.prisma, parent.postId),
  },
};
