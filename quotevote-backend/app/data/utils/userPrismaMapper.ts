/**
 * Prisma → legacy-shape mapper for the User entity.
 *
 * Prisma's generated `User` record uses different field names than the legacy
 * Mongoose-backed shape the rest of the app (GraphQL `UserType`, `Common.User`,
 * JWT payload, authz checks) expects. This module is the single translation
 * boundary — resolvers, the context factory, and REST auth handlers all pipe
 * Prisma records through `toPublicUser` before exposing them.
 *
 * Field mapping (source: prisma/schema/user.prisma):
 *   id             -> _id
 *   isAdmin        -> admin           (Prisma field @map("admin"))
 *   wallet         -> _wallet         (Prisma field @map("_wallet"))
 *   votesId        -> _votesId        (Prisma field @map("_votesId"))
 *   followingIds   -> _followingId    (Prisma field @map("_followingId"))
 *   followerIds    -> _followersId    (Prisma field @map("_followersId"))
 *   reputation     -> reputation      (embedded, with _id backfill)
 *
 * @see prisma/schema/user.prisma
 * @see app/types/common.ts — Common.User target shape
 */

import type * as Common from '~/types/common';

/**
 * Explicit input shape describing the fields a Prisma User record carries.
 * Defined locally rather than importing `User` from `@prisma/client` so this
 * module's contract is readable without resolving Prisma's opaque
 * `$Result.DefaultSelection` wrapper. Consumers pass a real Prisma record;
 * TypeScript verifies the shape structurally.
 */
export interface PrismaUserRecord {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  password?: string | null;
  avatar?: unknown;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  companyName?: string | null;
  plan?: string | null;
  stripeCustomerId?: string | null;
  tokens?: number;
  wallet?: string | null;
  votesId?: string | null;
  favorited?: unknown;
  status?: number | null;
  contributorBadge?: boolean;
  accountStatus?: Common.AccountStatus;
  emailVerified?: boolean;
  isAdmin?: boolean;
  isModerator?: boolean;
  botReports?: number;
  lastBotReportDate?: Date | string | null;
  upvotes?: number;
  downvotes?: number;
  followingIds?: string[];
  followerIds?: string[];
  blockedUserIds?: string[];
  settings?: unknown;
  lastLogin?: Date | string | null;
  joined?: Date | string;
  reputation?: EmbeddedReputationRecord | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

/**
 * Embedded reputation sub-document, mirroring the `EmbeddedReputation`
 * composite type in prisma/schema/social.prisma. The legacy shape adds an
 * `_id` backfill (same as the Mongoose path did) because the GraphQL
 * `UserReputation` type expects `_id` to be present.
 */
export interface EmbeddedReputationRecord {
  overallScore?: number;
  inviteNetworkScore?: number;
  conductScore?: number;
  activityScore?: number;
  metrics?: Common.ReputationMetrics;
  lastCalculated?: Date | string | number;
}

function toStringOrNull(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  return typeof value === 'string' ? value : String(value);
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

/**
 * Translate a Prisma User record into the legacy `Common.User` shape.
 *
 * Preserves all original fields by spread, then applies the id/relation
 * renames. Callers must not rely on fields this mapper omits — if a new
 * GraphQL consumer needs a Prisma-only field, add it here and to Common.User.
 */
export function toPublicUser(u: PrismaUserRecord): Common.User {
  return {
    ...u,
    _id: u.id,
    name: u.name ?? undefined,
    password: u.password ?? undefined,
    bio: u.bio ?? undefined,
    location: u.location ?? undefined,
    website: u.website ?? undefined,
    companyName: u.companyName ?? undefined,
    plan: u.plan ?? undefined,
    stripeCustomerId: u.stripeCustomerId ?? undefined,
    _wallet: toStringOrNull(u.wallet),
    _votesId: toStringOrNull(u.votesId),
    favorited: Array.isArray(u.favorited) ? u.favorited : undefined,
    admin: u.isAdmin ?? false,
    emailVerified: u.emailVerified ?? false,
    isModerator: u.isModerator ?? false,
    contributorBadge: u.contributorBadge ?? false,
    _followingId: toStringArray(u.followingIds),
    _followersId: toStringArray(u.followerIds),
    blockedUserIds: toStringArray(u.blockedUserIds),
    lastBotReportDate: u.lastBotReportDate ?? undefined,
    lastLogin: u.lastLogin ?? undefined,
    joined: u.joined ?? new Date(),
    reputation: u.reputation
      ? {
          _id: u.id,
          overallScore: u.reputation.overallScore ?? 0,
          inviteNetworkScore: u.reputation.inviteNetworkScore ?? 0,
          conductScore: u.reputation.conductScore ?? 0,
          activityScore: u.reputation.activityScore ?? 0,
          metrics: u.reputation.metrics ?? {
            totalInvitesSent: 0,
            totalInvitesAccepted: 0,
            totalInvitesDeclined: 0,
            averageInviteeReputation: 0,
            totalReportsReceived: 0,
            totalReportsResolved: 0,
            totalUpvotes: 0,
            totalDownvotes: 0,
            totalPosts: 0,
            totalComments: 0,
          },
          lastCalculated: u.reputation.lastCalculated ?? new Date(),
        }
      : undefined,
  } as Common.User;
}
