import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Post model — lazy-loaded to avoid circular imports.
 * Will be replaced with a direct import once the Post model exists (Phase 1).
 */
type AnyModel = mongoose.Model<Record<string, unknown>>;
let PostModel: AnyModel | null = null;

function getPostModel(): AnyModel | null {
  if (!PostModel) {
    try {
      PostModel = mongoose.model('Post') as AnyModel;
    } catch {
      logger.warn('[scoring] Post model not registered yet — skipping');
      return null;
    }
  }
  return PostModel;
}

interface VoteInfo {
  postId: string;
  userId: string;
  type: 'up' | 'down';
}

/**
 * Update post score when a vote is added.
 * Manages the votedBy array, upvotes, and downvotes counts.
 * Calls updateTrending for new voters.
 */
export async function updateScore(vote: VoteInfo): Promise<void> {
  try {
    const Post = getPostModel();
    if (!Post) return;

    const post = await Post.findById(vote.postId);
    if (!post) {
      logger.warn(`[updateScore] Post ${vote.postId} not found`);
      return;
    }

    const votedBy = (post.get('votedBy') as Array<{ userId: string; type: string }>) || [];
    const existingIndex = votedBy.findIndex(
      (v) => v.userId.toString() === vote.userId.toString()
    );

    const upvotes = (post.get('upvotes') as number) || 0;
    const downvotes = (post.get('downvotes') as number) || 0;

    if (existingIndex !== -1) {
      // User changing their vote
      votedBy[existingIndex].type = vote.type;
      await Post.updateOne(
        { _id: vote.postId },
        {
          $set: {
            votedBy,
            upvotes: vote.type === 'up' ? upvotes + 1 : upvotes,
            downvotes: vote.type === 'down' ? downvotes + 1 : downvotes,
          },
        }
      );
    } else {
      // New voter
      votedBy.push({ type: vote.type, userId: vote.userId });
      await Post.updateOne(
        { _id: vote.postId },
        {
          $set: {
            votedBy,
            upvotes: vote.type === 'up' ? upvotes + 1 : upvotes,
            downvotes: vote.type === 'down' ? downvotes + 1 : downvotes,
          },
        }
      );
      await updateTrending(vote.postId);
    }

    logger.debug(`[updateScore] Updated score for post ${vote.postId}`);
  } catch (error) {
    logger.error('[updateScore] Failed to update score', {
      error: error instanceof Error ? error.message : String(error),
      vote,
    });
  }
}

/**
 * Update the trending metrics for a post.
 * dayPoints tracks activity within a 24-hour sliding window.
 * If the post hasn't been active in 24 hours, dayPoints resets to 1.
 * Otherwise, dayPoints increments.
 */
export async function updateTrending(postId: string): Promise<void> {
  try {
    const Post = getPostModel();
    if (!Post) return;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Check if post's pointTimestamp is within 24 hours
    const recentPost = await Post.findOne({
      _id: postId,
      pointTimestamp: { $gte: twentyFourHoursAgo, $lt: now },
    });

    if (!recentPost) {
      // Outside 24-hour window — reset
      await Post.updateOne(
        { _id: postId },
        { $set: { pointTimestamp: now, dayPoints: 1 } }
      );
    } else {
      // Within 24-hour window — increment
      const currentDayPoints = (recentPost.get('dayPoints') as number) || 0;
      await Post.updateOne(
        { _id: postId },
        { $set: { pointTimestamp: now, dayPoints: currentDayPoints + 1 } }
      );
    }

    logger.debug(`[updateTrending] Updated trending for post ${postId}`);
  } catch (error) {
    logger.error('[updateTrending] Failed to update trending', {
      error: error instanceof Error ? error.message : String(error),
      postId,
    });
  }
}
