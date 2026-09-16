import type { PrismaClient } from '@prisma/client';
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
  content: string | undefined,
  prisma: PrismaClient
): Promise<void> => {
  await prisma.activity.create({
    data: {
      activityType,
      ...ids,
      content,
      created: new Date(),
    },
  });
  logger.debug('Added new activity', { activityType, ids, content });
};
