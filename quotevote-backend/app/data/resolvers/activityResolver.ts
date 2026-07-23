import { GraphQLError } from 'graphql';
import Activity from '../models/Activity';
import User from '../models/User';
import type * as Common from '~/types/common';
import type { ActivityQueryArgs, GraphQLContext } from '~/types/graphql';

type ActivityFilter = Record<string, unknown>;

function normalizeActivityEvents(
  activityEvent: ActivityQueryArgs['activityEvent'] | string | null | undefined
): Common.ActivityEventType[] {
  if (activityEvent == null) return [];

  let parsed: unknown = activityEvent;
  if (typeof activityEvent === 'string') {
    try {
      parsed = JSON.parse(activityEvent);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];
  return parsed.filter((v): v is Common.ActivityEventType => typeof v === 'string');
}

function toActivityEntity(doc: {
  _id: { toString(): string };
  userId?: { toString(): string } | string | null;
  postId?: { toString(): string } | string | null;
  voteId?: { toString(): string } | string | null;
  commentId?: { toString(): string } | string | null;
  quoteId?: { toString(): string } | string | null;
  activityType: string;
  content?: string | null;
  created?: Date | string | null;
}): Common.Activity {
  const toId = (value: { toString(): string } | string | null | undefined): string | undefined => {
    if (value == null) return undefined;
    return typeof value === 'string' ? value : value.toString();
  };

  return {
    _id: doc._id.toString(),
    userId: toId(doc.userId) ?? '',
    postId: toId(doc.postId),
    voteId: toId(doc.voteId),
    commentId: toId(doc.commentId),
    quoteId: toId(doc.quoteId),
    activityType: doc.activityType as Common.ActivityEventType,
    content: doc.content ?? undefined,
    created: doc.created ?? new Date(),
  };
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

      const searchArgs: ActivityFilter = {};

      const searchKey = args.searchKey?.trim();
      if (searchKey) {
        searchArgs.$text = {
          $search: searchKey,
          $caseSensitive: false,
        };
      }

      const events = normalizeActivityEvents(args.activityEvent);
      if (events.length > 0) {
        searchArgs.activityType = { $in: events };
      }

      if (args.user_id) {
        searchArgs.userId = args.user_id;
      } else {
        const viewer = await User.findById(context.user._id).select('_followingId').lean();
        const followingIds = (viewer?._followingId ?? []).map((id) => id.toString());
        searchArgs.userId = { $in: followingIds };
      }

      if (args.startDateRange && args.endDateRange) {
        searchArgs.created = {
          $gte: new Date(args.startDateRange),
          $lte: new Date(args.endDateRange),
        };
      }

      const [total, activitiesResult] = await Promise.all([
        Activity.countDocuments(searchArgs),
        Activity.find(searchArgs).sort({ created: -1 }).skip(offset).limit(limit).lean(),
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
