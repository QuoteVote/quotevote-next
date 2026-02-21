import User from '~/data/models/User';
import Post from '~/data/models/Post';
import Comment from '~/data/models/Comment';
import Vote from '~/data/models/Vote';
import { logger } from '~/data/utils/logger';
import type { ReputationMetrics } from '~/types/common';
import type { UserDocument, VoteDocument } from '~/types/mongoose';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Reputation Calculator
// ============================================================================

/**
 * Calculate reputation for a specific user.
 * Overall score = inviteNetwork (40%) + conduct (40%) + activity (20%)
 */
export const calculateUserReputation = async (userId: string): Promise<ReputationData> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const inviteNetworkScore = await calculateInviteNetworkScore(userId);
    const conductScore = await calculateConductScore(userId);
    const activityScore = await calculateActivityScore(userId);

    const overallScore = Math.round(
      inviteNetworkScore * WEIGHTS.INVITE_NETWORK +
      conductScore * WEIGHTS.CONDUCT +
      activityScore * WEIGHTS.ACTIVITY
    );

    const metrics = await getDetailedMetrics(userId);

    const reputationData: ReputationData = {
      _userId: userId,
      overallScore,
      inviteNetworkScore,
      conductScore,
      activityScore,
      metrics,
      lastCalculated: new Date(),
    };

    return reputationData;
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
  return 0;
};

/**
 * Calculate conduct score (0-500).
 * Based on reports received, voting behavior, and content quality.
 */
export const calculateConductScore = async (userId: string): Promise<number> => {
  let score = 300; // Neutral baseline

  // Voting behavior
  const userVotes = await Vote.find({ userId });
  const upvoteCount = (userVotes as VoteDocument[]).filter((v) => v.type === 'up').length;
  const downvoteCount = (userVotes as VoteDocument[]).filter((v) => v.type === 'down').length;

  if (upvoteCount > downvoteCount) {
    score += Math.min((upvoteCount - downvoteCount) * 2, 100);
  }

  // Content creation bonus
  const userPosts = await Post.find({ userId });
  const userComments = await Comment.find({ userId });

  score += Math.min(userPosts.length * 5, 50);
  score += Math.min(userComments.length * 2, 50);

  return Math.max(0, Math.min(score, 500));
};

/**
 * Calculate activity score (0-200).
 * Based on posts, comments, votes, and account age.
 */
export const calculateActivityScore = async (userId: string): Promise<number> => {
  let score = 0;

  const user = await User.findById(userId) as UserDocument | null;
  if (!user) return 0;

  const userPosts = await Post.find({ userId });
  const userComments = await Comment.find({ userId });
  const userVotes = await Vote.find({ userId });

  score += Math.min(userPosts.length * 10, 100);
  score += Math.min(userComments.length * 5, 50);
  score += Math.min(userVotes.length * 2, 50);

  // Account age bonus
  const joined = user.joined ? new Date(user.joined as string | Date) : user.createdAt;
  if (joined) {
    const daysSinceJoined = (Date.now() - new Date(joined).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(daysSinceJoined * 0.5, 20);
  }

  return Math.min(score, 200);
};

/**
 * Get detailed metrics for a user's reputation dashboard.
 */
export const getDetailedMetrics = async (userId: string): Promise<ReputationMetrics> => {
  const userPosts = await Post.find({ userId });
  const userComments = await Comment.find({ userId });
  const userVotes = await Vote.find({ userId });
  const upvoteCount = (userVotes as VoteDocument[]).filter((v) => v.type === 'up').length;
  const downvoteCount = (userVotes as VoteDocument[]).filter((v) => v.type === 'down').length;

  return {
    totalInvitesSent: 0,       // TODO: Implement with UserInviteModel
    totalInvitesAccepted: 0,   // TODO: Implement with UserInviteModel
    totalInvitesDeclined: 0,   // TODO: Implement with UserInviteModel
    averageInviteeReputation: 0, // TODO: Implement with UserReputationModel
    totalReportsReceived: 0,   // TODO: Implement with UserReportModel
    totalReportsResolved: 0,   // TODO: Implement with UserReportModel
    totalUpvotes: upvoteCount,
    totalDownvotes: downvoteCount,
    totalPosts: userPosts.length,
    totalComments: userComments.length,
  };
};

/**
 * Recalculate reputation for all users (admin function).
 */
export const recalculateAllReputations = async (): Promise<RecalculationResult[]> => {
  const users = await User.find({});
  const results: RecalculationResult[] = [];

  for (const user of users) {
    try {
      const reputation = await calculateUserReputation(user._id.toString());
      results.push({ userId: user._id.toString(), success: true, reputation });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      results.push({ userId: user._id.toString(), success: false, error: err.message });
    }
  }

  return results;
};
