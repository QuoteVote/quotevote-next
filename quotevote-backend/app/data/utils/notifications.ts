import mongoose from 'mongoose';
import type { NotificationType } from '~/types/common';
import { SUBSCRIPTION_EVENTS } from '~/types/graphql';
import { pubsub } from './pubsub';
import { logger } from './logger';

/**
 * Notification model — lazy-loaded to avoid circular imports.
 * Will be replaced with a direct import once the Notification model exists (Phase 1).
 */
type AnyModel = mongoose.Model<Record<string, unknown>>;
let NotificationModel: AnyModel | null = null;

function getNotificationModel(): AnyModel | null {
  if (!NotificationModel) {
    try {
      NotificationModel = mongoose.model('Notification') as AnyModel;
    } catch {
      logger.warn('[addNotification] Notification model not registered yet — skipping');
      return null;
    }
  }
  return NotificationModel;
}

interface AddNotificationParams {
  userId: string;
  userIdBy: string;
  notificationType: NotificationType;
  label: string;
  postId?: string;
}

/**
 * Create a notification and publish it via PubSub.
 * Skips if the notifying user is the same as the target user.
 */
export async function addNotification(params: AddNotificationParams): Promise<void> {
  const { userId, userIdBy, notificationType, label, postId } = params;

  // Don't notify yourself
  if (userId === userIdBy) return;

  try {
    const Notification = getNotificationModel();
    if (!Notification) return;

    const notification = await Notification.create({
      userId,
      userIdBy,
      notificationType,
      label,
      postId,
      status: 'unread',
    });

    await pubsub.publish(SUBSCRIPTION_EVENTS.NOTIFICATION_CREATED, {
      notification: notification.toObject(),
    });

    logger.debug(`[addNotification] ${notificationType} for user ${userId} by ${userIdBy}`);
  } catch (error) {
    logger.error('[addNotification] Failed to create notification', {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
  }
}
