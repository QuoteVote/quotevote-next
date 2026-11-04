import type { Prisma, PrismaClient } from '@prisma/client';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import { unique, whenAny } from '~/data/resolvers/utils/batchLoad';
import type * as Common from '~/types/common';

/**
 * Matches Mongo `$ne: true` for soft-delete filters. Prisma's `{ not: true }`
 * only keeps `deleted: false` and drops legacy docs that never received the
 * field (pre-Aug 2025). Include unset fields via `isSet: false`.
 */
export const NOT_DELETED: Prisma.CommentWhereInput & Prisma.QuoteWhereInput = {
  OR: [{ deleted: false }, { deleted: { isSet: false } }],
};

/**
 * Fields read for a comment. Selected explicitly because legacy documents may
 * lack createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
export const COMMENT_SELECT = {
  id: true,
  userId: true,
  postId: true,
  content: true,
  startWordIndex: true,
  endWordIndex: true,
  url: true,
  reaction: true,
  deleted: true,
  created: true,
} as const satisfies Prisma.CommentSelect;

export type CommentRecord = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>;

export function toComment(record: CommentRecord): Common.Comment {
  return {
    _id: record.id,
    userId: record.userId,
    postId: record.postId ?? undefined,
    content: record.content,
    startWordIndex: record.startWordIndex ?? 0,
    endWordIndex: record.endWordIndex ?? 0,
    url: record.url ?? undefined,
    reaction: record.reaction ?? undefined,
    deleted: record.deleted,
    created: record.created,
  };
}

/**
 * Fields read for a quote. Selected explicitly for the same legacy-doc reasons
 * as COMMENT_SELECT. `userId` is mapped from Mongo `quoter`.
 */
export const QUOTE_SELECT = {
  id: true,
  userId: true,
  quoted: true,
  postId: true,
  quote: true,
  startWordIndex: true,
  endWordIndex: true,
  deleted: true,
  created: true,
} as const satisfies Prisma.QuoteSelect;

export type QuoteRecord = Prisma.QuoteGetPayload<{ select: typeof QUOTE_SELECT }>;

export function toQuote(record: QuoteRecord): Common.Quote {
  return {
    _id: record.id,
    userId: record.userId,
    quoted: record.quoted ?? undefined,
    postId: record.postId,
    quote: record.quote,
    startWordIndex: record.startWordIndex ?? undefined,
    endWordIndex: record.endWordIndex ?? undefined,
    deleted: record.deleted,
    created: record.created,
  };
}

/**
 * Load the author of one comment or quote with public fields only, for a
 * parent that wasn't loaded with its author, such as a mutation result.
 */
export async function loadAuthor(
  prisma: Pick<PrismaClient, 'user'>,
  userId: string | undefined
): Promise<Common.User | null> {
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });
  return user ? toPublicUser(user as PrismaUserRecord) : null;
}

/** Attach authors with public fields to a list of comments or quotes in one query. */
export async function attachAuthors<T extends { userId: string }>(
  prisma: Pick<PrismaClient, 'user'>,
  rows: T[]
): Promise<(T & { user: Common.User | null })[]> {
  const users = await whenAny(unique(rows.map((row) => row.userId)), (ids) =>
    prisma.user.findMany({ where: { id: { in: ids } }, select: PUBLIC_USER_SELECT })
  );
  const byId = new Map(users.map((u) => [u.id, toPublicUser(u as PrismaUserRecord)]));
  return rows.map((row) => ({ ...row, user: byId.get(row.userId) ?? null }));
}

/**
 * Fields read for a reaction. Legacy ReactionModel has no createdAt/updatedAt.
 */
export const REACTION_SELECT = {
  id: true,
  userId: true,
  actionId: true,
  messageId: true,
  emoji: true,
  created: true,
} as const satisfies Prisma.ReactionSelect;

export type ReactionRecord = Prisma.ReactionGetPayload<{ select: typeof REACTION_SELECT }>;

export function toReaction(record: ReactionRecord): Common.Reaction {
  return {
    _id: record.id,
    userId: record.userId,
    actionId: record.actionId ?? undefined,
    messageId: record.messageId ?? undefined,
    emoji: record.emoji,
    created: record.created,
  };
}

/**
 * Fields read for a message when nested under Reaction. Legacy MessageModel
 * has no createdAt/updatedAt.
 */
export const MESSAGE_RECORD_SELECT = {
  id: true,
  messageRoomId: true,
  userId: true,
  userName: true,
  title: true,
  text: true,
  type: true,
  mutationType: true,
  deleted: true,
  readBy: true,
  readByDetailed: true,
  deliveredTo: true,
  created: true,
} as const satisfies Prisma.MessageSelect;

export type MessageRecord = Prisma.MessageGetPayload<{ select: typeof MESSAGE_RECORD_SELECT }>;

export function toMessageEntity(record: MessageRecord): Common.Message {
  return {
    _id: record.id,
    messageRoomId: record.messageRoomId,
    userId: record.userId,
    userName: record.userName ?? undefined,
    title: record.title ?? undefined,
    text: record.text,
    type: (record.type as Common.MessageType | undefined) ?? undefined,
    mutation_type: record.mutationType ?? undefined,
    deleted: record.deleted,
    readBy: record.readBy,
    readByDetailed: record.readByDetailed,
    deliveredTo: record.deliveredTo,
    created: record.created,
  };
}
