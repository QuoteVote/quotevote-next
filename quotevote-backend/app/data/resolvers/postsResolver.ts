import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import Post from '../models/Post';
import User from '../models/User';
import { parseSearchQuery } from '../utils/parseSearchQuery';
import type { PostQueryArgs, GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';

/**
 * Build a Mongoose filter object from PostQueryArgs.
 *
 * Supports:
 *  - `@username`  → filter posts by the user's `_id`
 *  - `#hashtag`   → case-insensitive regex on `title` and `text`
 *  - plain text   → MongoDB `$text` full-text search
 *  - date range, friends-only, interactions, userId, groupId, approved filters
 */
async function buildPostFilter(
  args: PostQueryArgs,
): Promise<{ filter: Record<string, unknown>; sort: Record<string, unknown>; earlyEmpty: boolean }> {
  const filter: Record<string, unknown> = { deleted: { $ne: true } };
  let sort: Record<string, unknown> = { created: -1 };
  let earlyEmpty = false;

  const searchKey = args.searchKey?.trim() ?? '';

  if (searchKey) {
    const parsed = parseSearchQuery(searchKey);

    // ── @username filtering ───────────────────────────────────────────
    if (parsed.usernames.length > 0) {
      // Look up user IDs for all parsed usernames
      const userDocs = await User.find({
        username: { $in: parsed.usernames.map((u) => new RegExp(`^${u}$`, 'i')) },
      })
        .select('_id')
        .lean();

      if (userDocs.length === 0) {
        // No matching users → return empty immediately
        earlyEmpty = true;
        return { filter, sort, earlyEmpty };
      }

      const userIds = userDocs.map((u) => u._id);

      if (userIds.length === 1) {
        filter.userId = userIds[0];
      } else {
        filter.userId = { $in: userIds };
      }
    }

    // ── #hashtag filtering ────────────────────────────────────────────
    if (parsed.hashtags.length > 0) {
      // Build case-insensitive regex patterns for each hashtag
      const hashtagConditions = parsed.hashtags.map((tag) => {
        const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`#${escapedTag}\\b`, 'i');
        return {
          $or: [{ title: pattern }, { text: pattern }],
        };
      });

      if (hashtagConditions.length === 1) {
        Object.assign(filter, hashtagConditions[0]);
      } else {
        // All hashtags must match
        const existing = (filter.$and as Record<string, unknown>[] | undefined) ?? [];
        filter.$and = [...existing, ...hashtagConditions];
      }
    }

    // ── Plain text search ─────────────────────────────────────────────
    if (parsed.textQuery) {
      filter.$text = { $search: parsed.textQuery };
      sort = { score: { $meta: 'textScore' }, created: -1 };
    }
  }

  // ── Date range filters ────────────────────────────────────────────────
  if (args.startDateRange || args.endDateRange) {
    const dateFilter: Record<string, Date> = {};
    if (args.startDateRange) dateFilter.$gte = new Date(args.startDateRange);
    if (args.endDateRange) dateFilter.$lte = new Date(args.endDateRange);
    filter.created = dateFilter;
  }

  // ── userId filter (direct — from query args, separate from @username) ─
  if (args.userId) {
    if (!mongoose.Types.ObjectId.isValid(args.userId)) {
      throw new GraphQLError('Invalid userId format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    filter.userId = new mongoose.Types.ObjectId(args.userId);
  }

  // ── Group filter ──────────────────────────────────────────────────────
  if (args.groupId) {
    if (!mongoose.Types.ObjectId.isValid(args.groupId)) {
      throw new GraphQLError('Invalid groupId format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    filter.groupId = new mongoose.Types.ObjectId(args.groupId);
  }

  // ── Approved filter ───────────────────────────────────────────────────
  if (args.approved !== undefined) {
    filter.approved = args.approved ? { $gt: 0 } : { $exists: false };
  }

  // ── Sort order ────────────────────────────────────────────────────────
  if (args.sortOrder === 'asc') {
    sort = { created: 1 };
  } else if (args.sortOrder === 'desc') {
    sort = { created: -1 };
  }

  // ── Interactions (most popular) ───────────────────────────────────────
  if (args.interactions) {
    sort = { dayPoints: -1, created: -1 };
  }

  return { filter, sort, earlyEmpty };
}

export const postsResolver = {
  Query: {
    posts: async (
      _parent: unknown,
      args: PostQueryArgs,
    ): Promise<Common.PaginatedResult<Common.Post>> => {
      const limit = args.limit ?? 15;
      const offset = args.offset ?? 0;

      const { filter, sort, earlyEmpty } = await buildPostFilter(args);

      if (earlyEmpty) {
        return {
          entities: [],
          pagination: { total_count: 0, limit, offset },
        };
      }

      const [totalPosts, posts] = await Promise.all([
        Post.countDocuments(filter),
        Post.find(filter)
          .sort(sort as Record<string, 1 | -1>)
          .skip(offset)
          .limit(limit)
          .lean(),
      ]);

      if (posts.length === 0) {
        return {
          entities: [],
          pagination: { total_count: totalPosts, limit, offset },
        };
      }

      // Hydrate creator data for each post
      const uniqueUserIds = [
        ...new Set(posts.map((p) => p.userId.toString())),
      ].map((id) => new mongoose.Types.ObjectId(id));

      const creators = await User.find({ _id: { $in: uniqueUserIds } })
        .select('_id name username avatar')
        .lean();

      const creatorMap = new Map(creators.map((c) => [c._id.toString(), c]));

      const entities = posts.map((post) => ({
        ...post,
        _id: post._id.toString(),
        userId: post.userId.toString(),
        groupId: post.groupId.toString(),
        creator: creatorMap.get(post.userId.toString()) ?? null,
        votedBy: Array.isArray(post.votedBy) ? post.votedBy : [],
      }));

      return {
        entities: entities as unknown as Common.Post[],
        pagination: { total_count: totalPosts, limit, offset },
      };
    },
  },
  Mutation: {
    reportPost: async (
      _parent: unknown,
      args: { postId: string; userId: string },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      if (!context?.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!args.postId || !args.userId) {
        throw new GraphQLError('Post ID and User ID are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (
        !mongoose.Types.ObjectId.isValid(args.postId) ||
        !mongoose.Types.ObjectId.isValid(args.userId)
      ) {
        throw new GraphQLError('Invalid ID format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const actorId = context.user._id.toString();
      if (actorId !== args.userId) {
        throw new GraphQLError('Not authorized to report on behalf of another user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const post = await Post.findById(args.postId);
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (post.userId.toString() === args.userId) {
        throw new GraphQLError('Cannot report your own post', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const reportedBy = Array.isArray(post.reportedBy) ? post.reportedBy : [];
      if (reportedBy.includes(args.userId)) {
        throw new GraphQLError('You have already reported this post', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        args.postId,
        {
          $addToSet: { reportedBy: args.userId },
          $inc: { reported: 1 },
        },
        { new: true }
      ).lean();

      if (!updatedPost) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return {
        ...updatedPost,
        _id: updatedPost._id.toString(),
        userId: updatedPost.userId.toString(),
        groupId: updatedPost.groupId ? updatedPost.groupId.toString() : undefined,
        reportedBy: Array.isArray(updatedPost.reportedBy) ? updatedPost.reportedBy : [],
        reported: updatedPost.reported ?? 0,
        votedBy: Array.isArray(updatedPost.votedBy) ? updatedPost.votedBy : [],
      } as unknown as Common.Post;
    },
  },
};
