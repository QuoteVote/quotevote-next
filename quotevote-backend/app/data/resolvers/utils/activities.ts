import Activity from '~/data/models/Activity';
import { logger } from '~/data/utils/logger';
import type { ActivityEventType } from '~/types/common';

export interface ActivityIds {
  userId: string;
  postId?: string;
  voteId?: string;
  commentId?: string;
  quoteId?: string;
}

/**
 * Log a user activity event (POSTED, COMMENTED, VOTED, QUOTED, etc.)
 */
export const logActivity = async (
  activityType: ActivityEventType,
  ids: ActivityIds,
  content?: string
): Promise<void> => {
  const newActivity = {
    activityType,
    ...ids,
    content,
    created: new Date(),
  };
  await new Activity(newActivity).save();
  logger.debug('Added new activity', { activityType, ids, content });
};
