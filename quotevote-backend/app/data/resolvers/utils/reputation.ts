import type { PrismaClient } from '@prisma/client';
import { logger } from '~/data/utils/logger';
import type { Reputation, ReputationMetrics } from '~/types/common';

// ============================================================================
// Types
// ============================================================================

export type ReputationPrisma = Pick<PrismaClient, 'user' | 'post' | 'comment' | 'vote'>;

export interface ReputationData {
  _userId: string;
  overallScore: number;
  inviteNetworkScore: number;
  conductScore: number;
  activityScore: number;
  metrics: ReputationMetrics;
  lastCalculated: Date;
}

interface RecalculationResult {
  userId: string;
  success: boolean;
  reputation?: ReputationData;
  error?: string;
}

// ============================================================================
// Score Weights
// ============================================================================

const WEIGHTS = {
  INVITE_NETWORK: 0.4,
  CONDUCT: 0.4,
  ACTIVITY: 0.2,
} as const;

/** Legacy user docs lack createdAt/updatedAt — do not select those fields. */
const USER_AGE_SELECT = {
  id: true,
  joined: true,
} as const;

// ============================================================================
// Internal Helpers
// ============================================================================

const countVotesByType = async (
  prisma: ReputationPrisma,
  userId: string
): Promise<{ upvoteCount: number; downvoteCount: number; totalVotes: number }> => {
  const [upvoteCount, downvoteCount, totalVotes] = await Promise.all([
    prisma.vote.count({ where: { userId, type: 'up' } }),
    prisma.vote.count({ where: { userId, type: 'down' } }),
    prisma.vote.count({ where: { userId } }),
  ]);
  return { upvoteCount, downvoteCount, totalVotes };
};

const countUserContent = async (
  prisma: ReputationPrisma,
  userId: string
): Promise<{ postCount: number; commentCount: number }> => {
  const [postCount, commentCount] = await Promise.all([
    prisma.post.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
  ]);
  return { postCount, commentCount };
};

// ============================================================================
// Reputation Calculator
// ============================================================================

/**
 * Calculate reputation for a specific user.
 * Overall score = inviteNetwork (40%) + conduct (40%) + activity (20%)
 */
export const calculateUserReputation = async (
  prisma: ReputationPrisma,
  userId: string
): Promise<ReputationData> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new Error('User not found');
    }

    const inviteNetworkScore = await calculateInviteNetworkScore(userId);
    const conductScore = await calculateConductScore(prisma, userId);
    const activityScore = await calculateActivityScore(prisma, userId);

    const overallScore = Math.round(
      inviteNetworkScore * WEIGHTS.INVITE_NETWORK +
        conductScore * WEIGHTS.CONDUCT +
        activityScore * WEIGHTS.ACTIVITY
    );

    const metrics = await getDetailedMetrics(prisma, userId);

    return {
      _userId: userId,
      overallScore,
      inviteNetworkScore,
      conductScore,
      activityScore,
      metrics,
      lastCalculated: new Date(),
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error calculating user reputation', {
      error: err.message,
      stack: err.stack,
      userId,
    });
    throw err;
  }
};

/**
 * Calculate invite network score (0-500).
 * Based on invite acceptance rate, invitee quality, and network size.
 *
 * Note: UserInvite and UserReputation models needed for full implementation.
 * Returns 0 until those models are migrated (issues 7.19+).
 */
export const calculateInviteNetworkScore = async (_userId: string): Promise<number> => {
  // TODO: Implement when UserInviteModel and UserReputationModel are migrated
  void _userId;
  return 0;
};

/**
 * Calculate conduct score (0-500).
 * Based on reports received, voting behavior, and content quality.
 */
export const calculateConductScore = async (
  prisma: ReputationPrisma,
  userId: string
): Promise<number> => {
  let score = 300; // Neutral baseline

  const { upvoteCount, downvoteCount } = await countVotesByType(prisma, userId);

  if (upvoteCount > downvoteCount) {
    score += Math.min((upvoteCount - downvoteCount) * 2, 100);
  }

  const { postCount, commentCount } = await countUserContent(prisma, userId);

  score += Math.min(postCount * 5, 50);
  score += Math.min(commentCount * 2, 50);

  return Math.max(0, Math.min(score, 500));
};

/**
 * Calculate activity score (0-200).
 * Based on posts, comments, votes, and account age.
 */
export const calculateActivityScore = async (
  prisma: ReputationPrisma,
  userId: string
): Promise<number> => {
  let score = 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_AGE_SELECT,
  });
  if (!user) return 0;

  const [{ postCount, commentCount }, { totalVotes }] = await Promise.all([
    countUserContent(prisma, userId),
    countVotesByType(prisma, userId),
  ]);

  score += Math.min(postCount * 10, 100);
  score += Math.min(commentCount * 5, 50);
  score += Math.min(totalVotes * 2, 50);

  // Account age bonus (legacy users only have `joined`, not createdAt)
  const joined = user.joined;
  if (joined) {
    const daysSinceJoined = (Date.now() - new Date(joined).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(daysSinceJoined * 0.5, 20);
  }

  return Math.min(score, 200);
};

/**
 * Get detailed metrics for a user's reputation dashboard.
 */
export const getDetailedMetrics = async (
  prisma: ReputationPrisma,
  userId: string
): Promise<ReputationMetrics> => {
  const [{ postCount, commentCount }, { upvoteCount, downvoteCount }] = await Promise.all([
    countUserContent(prisma, userId),
    countVotesByType(prisma, userId),
  ]);

  return {
    totalInvitesSent: 0, // TODO: Implement with UserInviteModel
    totalInvitesAccepted: 0, // TODO: Implement with UserInviteModel
    totalInvitesDeclined: 0, // TODO: Implement with UserInviteModel
    averageInviteeReputation: 0, // TODO: Implement with UserReputationModel
    totalReportsReceived: 0, // TODO: Implement with UserReportModel
    totalReportsResolved: 0, // TODO: Implement with UserReportModel
    totalUpvotes: upvoteCount,
    totalDownvotes: downvoteCount,
    totalPosts: postCount,
    totalComments: commentCount,
  };
};

/**
 * Recalculate reputation for all users (admin function).
 */
export const recalculateAllReputations = async (
  prisma: ReputationPrisma
): Promise<RecalculationResult[]> => {
  const users = await prisma.user.findMany({
    select: { id: true },
  });
  const results: RecalculationResult[] = [];

  for (const user of users) {
    try {
      const reputation = await calculateUserReputation(prisma, user.id);
      results.push({ userId: user.id, success: true, reputation });
    } catch (error: unknown) {
      // calculateUserReputation always wraps non-Error throws into Error
      const err = error as Error;
      results.push({ userId: user.id, success: false, error: err.message });
    }
  }

  return results;
};

// ============================================================================
// Profile Reputation
// ============================================================================

export type ProfileReputationPrisma = ReputationPrisma & Pick<PrismaClient, 'userReputation'>;

interface RawReputation {
  _id?: unknown;
  overallScore?: unknown;
  inviteNetworkScore?: unknown;
  conductScore?: unknown;
  activityScore?: unknown;
  metrics?: Record<string, unknown>;
  lastCalculated?: unknown;
}

const METRIC_KEYS = [
  'totalInvitesSent',
  'totalInvitesAccepted',
  'totalInvitesDeclined',
  'averageInviteeReputation',
  'totalReportsReceived',
  'totalReportsResolved',
  'totalUpvotes',
  'totalDownvotes',
  'totalPosts',
  'totalComments',
] as const satisfies readonly (keyof ReputationMetrics)[];

/** Raw reads return Extended JSON, so numbers may arrive wrapped, e.g. `{ $numberDouble }`. */
const rawNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const wrapped = Object.values(value)[0];
    const parsed = Number(wrapped);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const rawDate = (value: unknown): Date | null => {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const inner =
    value && typeof value === 'object' && '$date' in value
      ? (value as { $date: unknown }).$date
      : value;
  const date =
    inner && typeof inner === 'object'
      ? new Date(rawNumber(inner))
      : new Date(inner as string | number);
  return Number.isNaN(date.getTime()) ? null : date;
};

const rawId = (value: unknown): string | null => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '$oid' in value) {
    const oid = (value as { $oid: unknown }).$oid;
    return typeof oid === 'string' ? oid : null;
  }
  return null;
};

export type ProfileReputation = Reputation & { _userId: string };

// Field resolvers on the UserReputation type don't run, so the shape is final
// here. The schema declares scores and metrics as Int, and legacy stores fractions.
const toProfileReputation = (
  id: string,
  userId: string,
  source: RawReputation | ReputationData
): ProfileReputation => ({
  _id: id,
  _userId: userId,
  userId,
  overallScore: Math.round(rawNumber(source.overallScore)),
  inviteNetworkScore: Math.round(rawNumber(source.inviteNetworkScore)),
  conductScore: Math.round(rawNumber(source.conductScore)),
  activityScore: Math.round(rawNumber(source.activityScore)),
  metrics: Object.fromEntries(
    METRIC_KEYS.map((key) => [
      key,
      Math.round(rawNumber((source.metrics as Record<string, unknown> | undefined)?.[key])),
    ])
  ) as unknown as ReputationMetrics,
  lastCalculated: (rawDate(source.lastCalculated) ?? new Date()).toISOString(),
});

/**
 * Reputation shown on a profile. Legacy keeps one stored row per user and
 * refreshes it daily; its owner field is `_userId`, which the Prisma model
 * reads as `userId`, so the row is read raw. A user with no stored row gets a
 * calculated one, which is not saved. Null when the user doesn't exist.
 */
export const loadUserReputation = async (
  prisma: ProfileReputationPrisma,
  userId: string
): Promise<ProfileReputation | null> => {
  try {
    const rows = (await prisma.userReputation.findRaw({
      filter: { $or: [{ _userId: { $oid: userId } }, { userId: { $oid: userId } }] },
      options: { limit: 1 },
    })) as unknown as RawReputation[];
    const stored = rows[0];
    if (stored) {
      return toProfileReputation(rawId(stored._id) ?? userId, userId, stored);
    }
    return toProfileReputation(userId, userId, await calculateUserReputation(prisma, userId));
  } catch (error: unknown) {
    logger.error('Error loading user reputation', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    return null;
  }
};
