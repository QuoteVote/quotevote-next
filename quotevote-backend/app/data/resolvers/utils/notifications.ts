import type { Prisma, PrismaClient } from '@prisma/client';
import { pubsub } from '~/data/utils/pubsub';
import { NOTIFICATION_CREATED } from '~/data/utils/constants';
import { unique, whenAny } from '~/data/resolvers/utils/batchLoad';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import type {
  Notification,
  NotificationPost,
  NotificationType,
  NotificationWithRelations,
  User,
} from '~/types/common';

type NotificationsPrisma = Pick<PrismaClient, 'notification'>;

/**
 * Fields read for a notification. Selected explicitly because legacy documents
 * have no createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
export const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  userIdBy: true,
  label: true,
  status: true,
  notificationType: true,
  postId: true,
  created: true,
} as const satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof NOTIFICATION_SELECT }>;

/**
 * Map a Prisma notification row to the GraphQL shape (`id` → `_id`, null → undefined).
 */
export const toNotificationEntity = (record: NotificationRecord): Notification => ({
  _id: record.id,
  userId: record.userId,
  userIdBy: record.userIdBy ?? undefined,
  label: record.label ?? undefined,
  status: record.status,
  notificationType: record.notificationType ?? undefined,
  postId: record.postId ?? undefined,
  created: record.created,
});

/** Post columns a notification links to; deleted posts are kept so the UI can say so. */
export const NOTIFICATION_POST_SELECT = { id: true, url: true, deleted: true } as const;

type NotificationRelationsPrisma = Pick<PrismaClient, 'user' | 'post'>;

const toNotificationPost = (post: {
  id: string;
  url: string | null;
  deleted: boolean;
}): NotificationPost => ({ _id: post.id, url: post.url, deleted: post.deleted });

/**
 * Add who sent each notification and the post it points to, with two queries for
 * the whole list. Senders are read with public fields only.
 */
export async function attachNotificationRelations(
  prisma: NotificationRelationsPrisma,
  notifications: Notification[]
): Promise<NotificationWithRelations[]> {
  const [users, posts] = await Promise.all([
    whenAny(unique(notifications.map((n) => n.userIdBy)), (ids) =>
      prisma.user.findMany({ where: { id: { in: ids } }, select: PUBLIC_USER_SELECT })
    ),
    whenAny(unique(notifications.map((n) => n.postId)), (ids) =>
      prisma.post.findMany({ where: { id: { in: ids } }, select: NOTIFICATION_POST_SELECT })
    ),
  ]);
  const usersById = new Map(users.map((u) => [u.id, toPublicUser(u as PrismaUserRecord)]));
  const postsById = new Map(posts.map((p) => [p.id, toNotificationPost(p)]));

  return notifications.map((n) => ({
    ...n,
    userBy: (n.userIdBy && usersById.get(n.userIdBy)) || null,
    post: (n.postId && postsById.get(n.postId)) || null,
  }));
}

/** Load the sender of one notification, for a parent that wasn't loaded in a batch. */
export async function loadNotificationSender(
  prisma: Pick<PrismaClient, 'user'>,
  userIdBy: string | undefined
): Promise<User | null> {
  if (!userIdBy) return null;
  const user = await prisma.user.findUnique({
    where: { id: userIdBy },
    select: PUBLIC_USER_SELECT,
  });
  return user ? toPublicUser(user as PrismaUserRecord) : null;
}

/** Load the post of one notification, for a parent that wasn't loaded in a batch. */
export async function loadNotificationPost(
  prisma: Pick<PrismaClient, 'post'>,
  postId: string | undefined
): Promise<NotificationPost | null> {
  if (!postId) return null;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: NOTIFICATION_POST_SELECT,
  });
  return post ? toNotificationPost(post) : null;
}

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
  prisma: NotificationsPrisma,
  input: AddNotificationInput
): Promise<Notification> => {
  const { userId, userIdBy, notificationType, label, postId } = input;

  const record = await prisma.notification.create({
    data: {
      userId,
      userIdBy,
      postId,
      notificationType,
      label,
      status: 'new',
      created: new Date(),
    },
    select: NOTIFICATION_SELECT,
  });
  const notification = toNotificationEntity(record);

  await pubsub.publish(NOTIFICATION_CREATED, { notification });

  return notification;
};
