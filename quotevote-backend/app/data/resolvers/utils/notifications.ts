import Notification from '~/data/models/Notification';
import { pubsub } from '~/data/utils/pubsub';
import { NOTIFICATION_CREATED } from '~/data/utils/constants';
import type { NotificationType } from '~/types/common';

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
export const addNotification = async (input: AddNotificationInput) => {
  const { userId, userIdBy, notificationType, label, postId } = input;

  const notification = await new Notification({
    userId,
    userIdBy,
    postId,
    notificationType,
    label,
    status: 'new',
    created: new Date(),
  }).save();

  await pubsub.publish(NOTIFICATION_CREATED, { notification });

  return notification;
};
