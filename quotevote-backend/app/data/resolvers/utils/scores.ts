import Vote from '~/data/models/Vote';
import User from '~/data/models/User';
import { logger } from '~/data/utils/logger';
import type { VoteDocument } from '~/types/mongoose';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Internal Helpers
// ============================================================================

const buildFilter = (args: ScoreFilterArgs): Record<string, unknown> => {
  const filter: Record<string, unknown> = {};
  if (args.user_id) filter.userId = args.user_id;
  if (args.song_id) filter._songId = args.song_id;
  if (args.artist_id) filter._artistId = args.artist_id;
  return filter;
};

const voteReducer = (total: number, vote: VoteDocument): number => {
  const polar = vote.type === 'up' ? 1 : -1;
  return total + polar;
};

// ============================================================================
// Score Utilities
// ============================================================================

/**
 * Calculate the net score for votes matching the given filter.
 */
export const scoreUtil = async (args: ScoreFilterArgs): Promise<number> => {
  const votes = await Vote.find({ ...buildFilter(args) });
  return (votes as VoteDocument[]).reduce(voteReducer, 0);
};

/**
 * Calculate the score for a specific vote type (up or down).
 */
export const voteTypeUtil = async (args: VoteFilterArgs): Promise<number> => {
  const votes = await Vote.find({
    ...buildFilter(args),
    type: args.vote_type ? 'up' : 'down',
  });
  return (votes as VoteDocument[]).reduce(voteReducer, 0);
};

/**
 * Count upvotes matching the given filter.
 */
export const upvotes = async (args: ScoreFilterArgs): Promise<number> => {
  logger.debug('Function: upvotes', { args });
  const votes = await Vote.find({ ...buildFilter(args), type: 'up' });
  return votes.length;
};

/**
 * Count downvotes matching the given filter.
 */
export const downvotes = async (args: ScoreFilterArgs): Promise<number> => {
  logger.debug('Function: downvotes', { args });
  const votes = await Vote.find({ ...buildFilter(args), type: 'down' });
  return votes.length;
};

/**
 * Get top users by net vote score.
 */
export const topUsers = async (limit: number): Promise<LeaderboardEntry[]> => {
  const users = await User.find({});
  const userIds = users.map((u) => u._id);

  const entries = await Promise.all(
    userIds.map(async (id) => {
      const userVotes = await Vote.find({ userId: id });
      const score = (userVotes as VoteDocument[]).reduce(voteReducer, 0);
      const user = await User.findById(id);
      return {
        score,
        userId: id.toString(),
        user: user?.username ?? 'unknown',
      };
    })
  );

  entries.sort((a, b) => b.score - a.score);
  return entries.slice(0, limit);
};
