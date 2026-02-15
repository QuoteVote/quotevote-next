import mongoose from 'mongoose';
import type { ActivityEventType } from '~/types/common';
import { logger } from './logger';

/**
 * Activity model — lazy-loaded to avoid circular imports.
 * Will be replaced with a direct import once the Activity model exists (Phase 1).
 */
type AnyModel = mongoose.Model<Record<string, unknown>>;
let ActivityModel: AnyModel | null = null;

function getActivityModel(): AnyModel | null {
  if (!ActivityModel) {
    try {
      ActivityModel = mongoose.model('Activity') as AnyModel;
    } catch {
      logger.warn('[logActivity] Activity model not registered yet — skipping');
      return null;
    }
  }
  return ActivityModel;
}

interface LogActivityParams {
  userId: string;
  activityType: ActivityEventType;
  postId?: string;
  voteId?: string;
  commentId?: string;
  quoteId?: string;
  content?: string;
}

/**
 * Log a user activity (POSTED, COMMENTED, VOTED, QUOTED).
 * Creates an Activity document in MongoDB.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  const { userId, activityType, postId, voteId, commentId, quoteId, content } = params;

  try {
    const Activity = getActivityModel();
    if (!Activity) return;

    await Activity.create({
      userId,
      activityType,
      postId,
      voteId,
      commentId,
      quoteId,
      content,
    });

    logger.debug(`[logActivity] ${activityType} by user ${userId}`);
  } catch (error) {
    logger.error('[logActivity] Failed to log activity', {
      error: error instanceof Error ? error.message : String(error),
      params,
    });
  }
}
