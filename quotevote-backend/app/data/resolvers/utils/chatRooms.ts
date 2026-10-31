import type { Prisma, PrismaClient } from '@prisma/client';
import type * as Common from '~/types/common';
import { isLive, unique, whenAny } from '~/data/resolvers/utils/batchLoad';

type ChatRoomsPrisma = Pick<PrismaClient, 'user' | 'post' | 'message' | 'comment'>;

/**
 * Room columns safe to read from legacy rooms, which have no createdAt/updatedAt.
 * Reading the whole record fails on them.
 */
export const MESSAGE_ROOM_SELECT = {
  id: true,
  userIds: true,
  postId: true,
  messageType: true,
  isDirect: true,
  title: true,
  avatar: true,
  lastMessageTime: true,
  lastActivity: true,
  created: true,
} as const satisfies Prisma.MessageRoomSelect;

export type MessageRoomRecord = Prisma.MessageRoomGetPayload<{
  select: typeof MESSAGE_ROOM_SELECT;
}>;

const ROOM_USER_SELECT = { id: true, name: true, username: true, avatar: true } as const;
const ROOM_POST_SELECT = { id: true, title: true, text: true, userId: true, url: true } as const;

type RoomUser = Prisma.UserGetPayload<{ select: typeof ROOM_USER_SELECT }>;
type RoomAvatar = Common.MessageRoom['avatar'];

export function toMessageRoom(room: MessageRoomRecord): Common.MessageRoom {
  return {
    _id: room.id,
    users: room.userIds,
    postId: room.postId ?? undefined,
    messageType: room.messageType,
    title: room.title ?? undefined,
    avatar: room.avatar ?? undefined,
    isDirect: room.isDirect,
    lastMessageTime: room.lastMessageTime ?? undefined,
    lastActivity: room.lastActivity ?? undefined,
    created: room.created,
  };
}

/** The first member who isn't the viewer, or the viewer in a room with themselves. */
const otherMember = (room: MessageRoomRecord, viewerId: string): string | undefined =>
  room.userIds.find((id) => id !== viewerId) ?? room.userIds[0];

const time = (value: Date | string | undefined): number =>
  value ? new Date(value).getTime() : Number.NEGATIVE_INFINITY;

/** Newest message first, then most recent activity, as legacy sorts the chat list. */
export const byLatestMessage = (a: Common.MessageRoom, b: Common.MessageRoom): number =>
  time(b.lastMessageTime) - time(a.lastMessageTime) || time(b.lastActivity) - time(a.lastActivity);

/**
 * Keep the rooms legacy lists for a member: every direct room, and a post room
 * only when the member wrote the post, sent a message in it, or has a live
 * comment on the post.
 */
export async function filterListedRooms(
  prisma: ChatRoomsPrisma,
  rooms: MessageRoomRecord[],
  viewerId: string
): Promise<MessageRoomRecord[]> {
  const postRooms = rooms.filter((room) => room.messageType === 'POST' && room.postId);
  if (postRooms.length === 0) return rooms.filter((room) => room.messageType !== 'POST');

  const postIds = unique(postRooms.map((room) => room.postId));
  const [posts, sent, comments] = await Promise.all([
    prisma.post.findMany({ where: { id: { in: postIds } }, select: { id: true, userId: true } }),
    prisma.message.findMany({
      where: { messageRoomId: { in: postRooms.map((room) => room.id) }, userId: viewerId },
      select: { messageRoomId: true },
    }),
    prisma.comment.findMany({
      where: { postId: { in: postIds }, userId: viewerId },
      select: { postId: true, deleted: true },
    }),
  ]);

  const ownPosts = new Set(posts.filter((p) => p.userId === viewerId).map((p) => p.id));
  const roomsWithMessages = new Set(sent.map((m) => m.messageRoomId));
  const commentedPosts = new Set(comments.filter(isLive).map((c) => c.postId));

  return rooms.filter(
    (room) =>
      room.messageType !== 'POST' ||
      (room.postId !== null &&
        (ownPosts.has(room.postId) ||
          roomsWithMessages.has(room.id) ||
          commentedPosts.has(room.postId)))
  );
}

/**
 * Add what the chat list shows to each room, with a fixed number of queries:
 * - title: the other member's name for a direct room, the post title for a post room
 * - avatar: the other member's avatar, or the post author's for a post room
 * - unreadMessages: live messages from others the viewer hasn't read
 * - lastMessageTime: the newest message, or the room's last activity
 * - postDetails: the room's post
 */
export async function loadRoomViews(
  prisma: ChatRoomsPrisma,
  rooms: MessageRoomRecord[],
  viewerId: string
): Promise<Common.MessageRoomView[]> {
  if (rooms.length === 0) return [];
  const roomIds = rooms.map((room) => room.id);

  const [posts, unread, latest] = await Promise.all([
    whenAny(unique(rooms.map((room) => room.postId)), (ids) =>
      prisma.post.findMany({ where: { id: { in: ids } }, select: ROOM_POST_SELECT })
    ),
    // `deleted` is checked in code: legacy messages may not have the field.
    prisma.message.findMany({
      where: {
        messageRoomId: { in: roomIds },
        userId: { not: viewerId },
        NOT: { readBy: { has: viewerId } },
      },
      select: { messageRoomId: true, deleted: true },
    }),
    prisma.message.groupBy({
      by: ['messageRoomId'],
      where: { messageRoomId: { in: roomIds } },
      _max: { created: true },
    }),
  ]);

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const userIds = unique([
    ...rooms.map((room) => otherMember(room, viewerId)),
    ...posts.map((post) => post.userId),
  ]);
  const users = await whenAny(userIds, (ids) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: ROOM_USER_SELECT })
  );
  const usersById = new Map<string, RoomUser>(users.map((user) => [user.id, user]));

  const unreadByRoom = new Map<string, number>();
  for (const message of unread.filter(isLive)) {
    unreadByRoom.set(message.messageRoomId, (unreadByRoom.get(message.messageRoomId) ?? 0) + 1);
  }
  const latestByRoom = new Map(latest.map((row) => [row.messageRoomId, row._max.created]));

  return rooms.map((room) => {
    const post = room.postId ? postsById.get(room.postId) : undefined;
    const other = usersById.get(otherMember(room, viewerId) ?? '');
    const author = post ? usersById.get(post.userId) : undefined;

    let title: string | undefined;
    if (room.messageType === 'USER') {
      title = other?.name || other?.username || 'Unknown User';
    } else if (post) {
      title = post.title ?? undefined;
    }

    const avatar: RoomAvatar =
      (room.messageType === 'POST' ? (author?.avatar as RoomAvatar) : undefined) ??
      (other?.avatar as RoomAvatar) ??
      null;

    return {
      ...toMessageRoom(room),
      title: title ?? room.title ?? undefined,
      avatar,
      unreadMessages: unreadByRoom.get(room.id) ?? 0,
      lastMessageTime: latestByRoom.get(room.id) ?? room.lastActivity ?? undefined,
      postDetails: post
        ? {
            _id: post.id,
            title: post.title ?? '',
            text: post.text ?? '',
            userId: post.userId,
            url: post.url ?? '',
          }
        : null,
    };
  });
}
