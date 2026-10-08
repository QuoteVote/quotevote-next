import type { Prisma, PrismaClient, VoteType } from '@prisma/client';
import { logger } from '~/data/utils/logger';

// ============================================================================
// Types
// ============================================================================

export type ScoresPrisma = Pick<PrismaClient, 'vote' | 'user'>;

interface ScoreFilterArgs {
  user_id?: string;
  song_id?: string;
  artist_id?: string;
}

interface VoteFilterArgs extends ScoreFilterArgs {
  vote_type?: boolean;
}

interface LeaderboardEntry {
  score: number;
  userId: string;
  user: string;
}

const VOTE_TYPE_SELECT = {
  type: true,
} as const;

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Build a Prisma vote filter from legacy score args.
 * `song_id` / `artist_id` have no Prisma Vote columns (and were never on the
 * Mongoose Vote schema). Callers that pass them get an empty result without querying.
 */
const buildWhere = (args: ScoreFilterArgs): Prisma.VoteWhereInput | null => {
  if (args.song_id || args.artist_id) {
    return null;
  }

  const where: Prisma.VoteWhereInput = {};
  if (args.user_id) where.userId = args.user_id;
  return where;
};

const votePolarity = (type: VoteType): number => (type === 'up' ? 1 : -1);

const sumVoteScore = (votes: Array<{ type: VoteType }>): number =>
  votes.reduce((total, vote) => total + votePolarity(vote.type), 0);

// ============================================================================
// Score Utilities
// ============================================================================

/**
 * Calculate the net score for votes matching the given filter.
 */
export const scoreUtil = async (
  prisma: ScoresPrisma,
  args: ScoreFilterArgs
): Promise<number> => {
  const where = buildWhere(args);
  if (where === null) return 0;

  const votes = await prisma.vote.findMany({
    where,
    select: VOTE_TYPE_SELECT,
  });
  return sumVoteScore(votes);
};

/**
 * Calculate the score for a specific vote type (up or down).
 */
export const voteTypeUtil = async (
  prisma: ScoresPrisma,
  args: VoteFilterArgs
): Promise<number> => {
  const where = buildWhere(args);
  if (where === null) return 0;

  const votes = await prisma.vote.findMany({
    where: {
      ...where,
      type: args.vote_type ? 'up' : 'down',
    },
    select: VOTE_TYPE_SELECT,
  });
  return sumVoteScore(votes);
};

/**
 * Count upvotes matching the given filter.
 */
export const upvotes = async (prisma: ScoresPrisma, args: ScoreFilterArgs): Promise<number> => {
  logger.debug('Function: upvotes', { args });
  const where = buildWhere(args);
  if (where === null) return 0;

  return prisma.vote.count({
    where: { ...where, type: 'up' },
  });
};

/**
 * Count downvotes matching the given filter.
 */
export const downvotes = async (
  prisma: ScoresPrisma,
  args: ScoreFilterArgs
): Promise<number> => {
  logger.debug('Function: downvotes', { args });
  const where = buildWhere(args);
  if (where === null) return 0;

  return prisma.vote.count({
    where: { ...where, type: 'down' },
  });
};

/**
 * Get top users by net vote score.
 */
export const topUsers = async (
  prisma: ScoresPrisma,
  limit: number
): Promise<LeaderboardEntry[]> => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  const entries = await Promise.all(
    users.map(async (user) => {
      const userVotes = await prisma.vote.findMany({
        where: { userId: user.id },
        select: VOTE_TYPE_SELECT,
      });
      return {
        score: sumVoteScore(userVotes),
        userId: user.id,
        user: user.username ?? 'unknown',
      };
    })
  );

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
};
