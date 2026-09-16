import type { PrismaClient } from '@prisma/client';
import type { Notification, NotificationType } from '~/types/common';
import { pubsub } from '~/data/utils/pubsub';
import { NOTIFICATION_CREATED } from '~/data/utils/constants';

export interface AddNotificationInput {
  userId: string;
  userIdBy: string;
  notificationType: NotificationType;
  label: string;
  postId?: string;
}

/**
 * Create a notification and publish it via PubSub for real-time delivery.
 */
export const addNotification = async (
  input: AddNotificationInput,
  prisma: PrismaClient
): Promise<Notification> => {
  const { userId, userIdBy, notificationType, label, postId } = input;

  const notification = await prisma.notification.create({
    data: {
      userId,
      userIdBy,
      postId,
      notificationType,
      label,
      status: 'new',
      created: new Date(),
    },
  });

  const {
    id,
    postId: notificationPostId,
    notificationType: resultNotificationType,
    ...rest
  } = notification;

  const result: Notification = {
    ...rest,
    _id: id,
    notificationType: resultNotificationType as NotificationType,
    postId: notificationPostId ?? undefined,
  };

  await pubsub.publish(NOTIFICATION_CREATED, { notification: result });

  return result;
};
