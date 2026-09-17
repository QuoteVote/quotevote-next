import { GraphQLError } from 'graphql';
import { logger } from '~/data/utils';
import { ActivityEventTypeValues } from '../utils/constants';
import type { Prisma } from '@prisma/client';
import type * as Common from '~/types/common';
import type { ActivityQueryArgs, GraphQLContext } from '~/types/graphql';

const ALLOWED_ACTIVITY_EVENTS = new Set<string>(Object.values(ActivityEventTypeValues));

/**
 * Normalize activityEvent filter from GraphQL.
 * Prefer `[ActivityEventType!]`; still accepts a legacy JSON-encoded array string.
 */
export function normalizeActivityEvents(
  activityEvent: ActivityQueryArgs['activityEvent'] | string | string[] | null | undefined
): Common.ActivityEventType[] {
  if (activityEvent == null) return [];

  let parsed: unknown = activityEvent;
  if (typeof activityEvent === 'string') {
    try {
      parsed = JSON.parse(activityEvent);
    } catch (err) {
      logger.warn('activities.activityEvent JSON parse failed; ignoring filter', {
        raw: activityEvent.slice(0, 200),
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  }

  if (!Array.isArray(parsed)) {
    logger.warn('activities.activityEvent is not an array; ignoring filter', {
      receivedType: typeof parsed,
    });
    return [];
  }

  return parsed.filter(
    (v): v is Common.ActivityEventType => typeof v === 'string' && ALLOWED_ACTIVITY_EVENTS.has(v)
  );
}

function toActivityEntity(doc: {
  id: string;
  userId?: string | null;
  postId?: string | null;
  voteId?: string | null;
  commentId?: string | null;
  quoteId?: string | null;
  activityType: string;
  content?: string | null;
  created?: Date | string | null;
}): Common.Activity {
  const userId = doc.userId ?? undefined;

  if (!userId) {
    throw new GraphQLError('Activity document is missing required userId', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        activityId: doc.id,
      },
    });
  }

  const { id, ...activity } = doc;

  return {
    ...activity,
    _id: id,
    userId,
    postId: activity.postId ?? undefined,
    voteId: activity.voteId ?? undefined,
    commentId: activity.commentId ?? undefined,
    quoteId: activity.quoteId ?? undefined,
    content: activity.content ?? undefined,
    created: activity.created ?? new Date(),
  } as Common.Activity;
}

export const activityResolver = {
  Query: {
    /**
     * Paginated activity feed for a user (or the caller's following list).
     * Matches legacy getUserActivities return shape: { entities, pagination }.
     */
    activities: async (
      _parent: unknown,
      args: ActivityQueryArgs,
      context: GraphQLContext
    ): Promise<Common.PaginatedResult<Common.Activity>> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 10;
      const offset = typeof args.offset === 'number' && args.offset >= 0 ? args.offset : 0;

      const searchArgs: Prisma.ActivityWhereInput = {};

      const searchKey = args.searchKey?.trim();
      if (searchKey) {
        searchArgs.content = {
          contains: searchKey,
          mode: 'insensitive',
        };
      }

      const events = normalizeActivityEvents(args.activityEvent);
      if (events.length > 0) {
        searchArgs.activityType = { in: events };
      }

      if (args.user_id) {
        searchArgs.userId = args.user_id;
      } else {
        const viewer = await context.prisma.user.findUnique({
          where: { id: context.user._id.toString() },
          select: { followingIds: true },
        });
        searchArgs.userId = { in: viewer?.followingIds ?? [] };
      }

      if (args.startDateRange && args.endDateRange) {
        searchArgs.created = {
          gte: new Date(args.startDateRange),
          lte: new Date(args.endDateRange),
        };
      }

      const [total, activitiesResult] = await Promise.all([
        context.prisma.activity.count({ where: searchArgs }),
        context.prisma.activity.findMany({
          where: searchArgs,
          orderBy: { created: 'desc' },
          skip: offset,
          take: limit,
        }),
      ]);

      return {
        entities: activitiesResult.map((doc) => toActivityEntity(doc)),
        pagination: {
          total_count: total,
          limit,
          offset,
        },
      };
    },
  },
};
