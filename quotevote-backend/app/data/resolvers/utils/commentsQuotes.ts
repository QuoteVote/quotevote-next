import type { Prisma } from '@prisma/client';
import type * as Common from '~/types/common';

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
