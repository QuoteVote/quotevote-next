/**
 * Prisma → legacy-shape mapper for the Post entity.
 *
 * Prisma's generated Post record uses `id` and `enableVoting`; GraphQL Post
 * and Common.Post expect `_id` and `enable_voting`. `tagId` already matches
 * the GraphQL field (Mongo still stores `groupId` via @map).
 *
 * @see prisma/schema/post.prisma
 * @see app/types/common.ts — Common.Post target shape
 */

import type * as Common from '~/types/common';

export interface PrismaPostCreator {
  id: string;
  name?: string | null;
  username?: string | null;
  avatar?: unknown;
  contributorBadge?: boolean | null;
}

export interface PrismaPostRecord {
  id: string;
  userId: string;
  tagId: string;
  title: string;
  text: string;
  url?: string | null;
  citationUrl?: string | null;
  attribution?: string | null;
  upvotes?: number;
  downvotes?: number;
  reported?: number;
  approved?: number | null;
  /** Stored as Json: user ids, or legacy `{ type, userId }` objects. */
  votedBy?: unknown;
  dayPoints?: number;
  pointTimestamp?: Date | string;
  approvedBy?: string[];
  rejectedBy?: string[];
  reportedBy?: string[];
  bookmarkedBy?: string[];
  enableVoting?: boolean;
  messageRoomId?: string | null;
  urlId?: string | null;
  featuredSlot?: number | null;
  deleted?: boolean;
  created: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type GraphQLPost = Common.Post & {
  creator?: Common.User | null;
  votedBy: string[];
  votes?: Common.Vote[];
  comments?: { _id: string }[];
  quotes?: { _id: string }[];
  messageRoom?: { _id: string; postId: string } | null;
  dayPoints?: number;
  pointTimestamp?: Date | string;
};

export const POST_CREATOR_SELECT = {
  id: true,
  name: true,
  username: true,
  avatar: true,
  contributorBadge: true,
} as const;

/**
 * Columns safe to read from legacy posts.
 * `createdAt` and `updatedAt` are required in the Prisma model, but legacy
 * Mongoose posts have no timestamps. Selecting them throws P2032 when the
 * stored value is null, so they stay out of this select.
 */
export const POST_RECORD_SELECT = {
  id: true,
  userId: true,
  tagId: true,
  title: true,
  text: true,
  url: true,
  citationUrl: true,
  attribution: true,
  upvotes: true,
  downvotes: true,
  reported: true,
  approved: true,
  votedBy: true,
  dayPoints: true,
  pointTimestamp: true,
  approvedBy: true,
  rejectedBy: true,
  reportedBy: true,
  bookmarkedBy: true,
  enableVoting: true,
  messageRoomId: true,
  urlId: true,
  featuredSlot: true,
  deleted: true,
  created: true,
} as const;

const idString = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid: unknown }).$oid;
    return typeof oid === 'string' ? oid : null;
  }
  return null;
};

/**
 * Read `votedBy` as a list of user ids, the way the legacy API returns it.
 * Legacy writes `{ type, userId }` objects; older posts hold plain ids. Json
 * reads ObjectIds as `{ $oid }`.
 */
export function normalizeVotedBy(votedBy: unknown): string[] {
  if (!Array.isArray(votedBy)) return [];
  return votedBy
    .map((entry: unknown) =>
      entry && typeof entry === 'object' && 'userId' in entry
        ? idString((entry as { userId: unknown }).userId)
        : idString(entry)
    )
    .filter((id): id is string => Boolean(id));
}

/**
 * Translate a Prisma Post record into the GraphQL / Common.Post shape.
 */
export function toGraphQLPost(
  post: PrismaPostRecord,
  creator?: PrismaPostCreator | null
): GraphQLPost {
  return {
    _id: post.id,
    userId: post.userId,
    tagId: post.tagId,
    title: post.title,
    text: post.text,
    url: post.url ?? undefined,
    citationUrl: post.citationUrl ?? undefined,
    attribution: post.attribution ?? undefined,
    upvotes: post.upvotes ?? 0,
    downvotes: post.downvotes ?? 0,
    reported: post.reported ?? 0,
    approved: post.approved ?? undefined,
    approvedBy: Array.isArray(post.approvedBy) ? post.approvedBy : [],
    rejectedBy: Array.isArray(post.rejectedBy) ? post.rejectedBy : [],
    reportedBy: Array.isArray(post.reportedBy) ? post.reportedBy : [],
    bookmarkedBy: Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy : [],
    votedBy: normalizeVotedBy(post.votedBy),
    enable_voting: post.enableVoting ?? false,
    featuredSlot: post.featuredSlot ?? undefined,
    messageRoomId: post.messageRoomId ?? undefined,
    urlId: post.urlId ?? undefined,
    deleted: post.deleted ?? false,
    created: post.created,
    updatedAt: post.updatedAt ?? undefined,
    dayPoints: post.dayPoints,
    pointTimestamp: post.pointTimestamp,
    creator: creator
      ? ({
          _id: creator.id,
          name: creator.name ?? undefined,
          username: creator.username ?? undefined,
          avatar: (creator.avatar as string | Record<string, unknown> | undefined) ?? undefined,
          contributorBadge: creator.contributorBadge ?? false,
        } as Common.User)
      : null,
  };
}
