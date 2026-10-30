import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { ActivityEventTypeValues } from '~/data/utils/constants';
import { POST_RECORD_SELECT } from '~/data/utils/postPrismaMapper';
import { TAG_RECORD_SELECT } from '~/data/utils/tagPrismaMapper';
import { parseSearchQuery } from '../utils/parseSearchQuery';
import { escapeRegExp, isObjectId } from './utils/common';
import type { GraphQLContext, PostDetail, PostQueryArgs } from '~/types/graphql';
import { attachPostDetail, attachPostRelations, updateTrending } from './utils/posts';
import { addUserToPostRoom } from './utils/messages';
import { logActivity } from './utils/activities';
import { logger } from '~/data/utils/logger';
import type * as Common from '~/types/common';

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

function requireAdmin(context: GraphQLContext): void {
  if (context.user?.admin !== true) {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

function assertActorMatches(actorId: string, userId: string, action: string): void {
  if (actorId !== userId) {
    throw new GraphQLError(`Not authorized to ${action} on behalf of another user`, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

function toggleUserOnList(list: string[], userId: string, remove?: boolean | null): string[] {
  if (remove) {
    return list.filter((id) => id !== userId);
  }
  return list.includes(userId) ? list : [...list, userId];
}

function buildPostUrl(tagUrl: string | null | undefined, title: string, postId: string): string {
  const slug = title.replace(/ /g, '-').toLowerCase();
  return `/post${tagUrl ?? ''}/${slug}/${postId}`;
}

async function returnPostEntity(
  prisma: GraphQLContext['prisma'],
  postId: string
): Promise<Common.Post> {
  const updatedPost = await prisma.post.findUniqueOrThrow({
    where: { id: postId },
    select: POST_RECORD_SELECT,
  });
  const [entity] = await attachPostRelations(prisma, [updatedPost]);
  return entity;
}

/**
 * Build a Prisma where/orderBy from PostQueryArgs.
 *
 * Supports:
 *  - `@username`  → filter posts by the user's id
 *  - `#hashtag`   → case-insensitive contains on `title` and `text`, then a
 *    `#tag\\b` boundary check so `#foo` does not match `#foobar`
 *    (Prisma Mongo has no regex operator)
 *  - plain text   → case-insensitive contains on `title` and `text`, ordered
 *    by `created`. Mongo `$text` / `textScore` ranking is not available
 *    through Prisma (same tradeoff as user search).
 *  - date range, interactions, userId, tagId, approved filters
 */
async function buildPostQuery(
  args: PostQueryArgs,
  prisma: GraphQLContext['prisma'],
  followingIds: readonly string[] = []
): Promise<{
  where: Prisma.PostWhereInput;
  orderBy: Prisma.PostOrderByWithRelationInput[];
  earlyEmpty: boolean;
  hashtags: readonly string[];
}> {
  const where: Prisma.PostWhereInput = { deleted: { not: true } };
  let orderBy: Prisma.PostOrderByWithRelationInput[] = [{ created: 'desc' }];
  const andConditions: Prisma.PostWhereInput[] = [];

  const searchKey = args.searchKey?.trim() ?? '';
  let hashtags: readonly string[] = [];

  if (searchKey) {
    const parsed = parseSearchQuery(searchKey);

    if (parsed.usernames.length > 0) {
      const userDocs = await prisma.user.findMany({
        where: {
          OR: parsed.usernames.map((username) => ({
            username: { equals: username, mode: 'insensitive' },
          })),
        },
        select: { id: true },
      });

      if (userDocs.length === 0) {
        return { where, orderBy, earlyEmpty: true, hashtags };
      }

      const userIds = userDocs.map((u) => u.id);
      where.userId = userIds.length === 1 ? userIds[0] : { in: userIds };
    }

    if (parsed.hashtags.length > 0) {
      hashtags = parsed.hashtags;
      for (const tag of parsed.hashtags) {
        andConditions.push({
          OR: [
            { title: { contains: `#${tag}`, mode: 'insensitive' } },
            { text: { contains: `#${tag}`, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (parsed.textQuery) {
      andConditions.push({
        OR: [
          { title: { contains: parsed.textQuery, mode: 'insensitive' } },
          { text: { contains: parsed.textQuery, mode: 'insensitive' } },
        ],
      });
    }
  }

  if (args.startDateRange || args.endDateRange) {
    where.created = {
      ...(args.startDateRange ? { gte: new Date(args.startDateRange) } : {}),
      ...(args.endDateRange ? { lte: new Date(args.endDateRange) } : {}),
    };
  }

  if (args.userId) {
    if (!isObjectId(args.userId)) {
      throw new GraphQLError('Invalid userId format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    where.userId = args.userId;
  }

  if (args.tagId) {
    if (!isObjectId(args.tagId)) {
      throw new GraphQLError('Invalid tagId format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    where.tagId = args.tagId;
  }

  if (args.approved !== undefined) {
    where.approved = args.approved ? { gt: 0 } : null;
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  if (args.sortOrder === 'asc') {
    orderBy = [{ created: 'asc' }];
  } else if (args.sortOrder === 'desc') {
    orderBy = [{ created: 'desc' }];
  }

  if (args.interactions) {
    orderBy = [{ dayPoints: 'desc' }, { created: 'desc' }];
  }

  // Following filter: only posts from users the signed-in user follows.
  if (args.friendsOnly) {
    if (followingIds.length === 0) {
      return { where, orderBy, earlyEmpty: true, hashtags };
    }
    andConditions.push({ userId: { in: [...followingIds] } });
    where.AND = andConditions;
  }

  return { where, orderBy, earlyEmpty: false, hashtags };
}

/** Prisma `contains` cannot express `#tag\\b`, so apply the boundary after the query. */
function matchesHashtagBoundary(title: string, text: string, tag: string): boolean {
  const pattern = new RegExp(`#${escapeRegExp(tag)}\\b`, 'i');
  return pattern.test(title) || pattern.test(text);
}

export const postsResolver = {
  Query: {
    posts: async (
      _parent: unknown,
      args: PostQueryArgs,
      context: GraphQLContext
    ): Promise<Common.PaginatedResult<Common.Post>> => {
      const limit = args.limit ?? 15;
      const offset = args.offset ?? 0;

      const { where, orderBy, earlyEmpty, hashtags } = await buildPostQuery(
        args,
        context.prisma,
        context.user?._followingId ?? []
      );

      if (earlyEmpty) {
        return {
          entities: [],
          pagination: { total_count: 0, limit, offset },
        };
      }

      // `contains` is a superset of `#tag\\b`. Filter before paging so `#foo`
      // does not return `#foobar` and limit/offset still describe that set.
      if (hashtags.length > 0) {
        const candidates = await context.prisma.post.findMany({
          where,
          orderBy,
          select: POST_RECORD_SELECT,
        });
        const matched = candidates.filter((post) =>
          hashtags.every((tag) => matchesHashtagBoundary(post.title, post.text, tag))
        );
        const page = matched.slice(offset, offset + limit);

        if (page.length === 0) {
          return {
            entities: [],
            pagination: { total_count: matched.length, limit, offset },
          };
        }

        const entities = await attachPostRelations(context.prisma, page);

        return {
          entities,
          pagination: { total_count: matched.length, limit, offset },
        };
      }

      const [totalPosts, posts] = await Promise.all([
        context.prisma.post.count({ where }),
        context.prisma.post.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
          select: POST_RECORD_SELECT,
        }),
      ]);

      if (posts.length === 0) {
        return {
          entities: [],
          pagination: { total_count: totalPosts, limit, offset },
        };
      }

      const entities = await attachPostRelations(context.prisma, posts);

      return {
        entities,
        pagination: { total_count: totalPosts, limit, offset },
      };
    },

    // The schema keeps `topPosts` as an alias for `posts`.
    topPosts: (
      parent: unknown,
      args: PostQueryArgs,
      context: GraphQLContext
    ): Promise<Common.PaginatedResult<Common.Post>> =>
      postsResolver.Query.posts(parent, args, context),

    // Like legacy, a deleted or unknown post returns null rather than an error.
    post: async (
      _parent: unknown,
      args: { postId: string },
      context: GraphQLContext
    ): Promise<PostDetail | null> => {
      if (!isObjectId(args.postId)) return null;

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: POST_RECORD_SELECT,
      });
      if (!post || post.deleted === true) return null;

      return attachPostDetail(context.prisma, post);
    },
  },
  Mutation: {
    addPost: async (
      _parent: unknown,
      args: { post: Common.PostInput },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      const actorId = requireUserId(context);
      const { post } = args;

      if (!post?.title?.trim() || !post?.text?.trim()) {
        throw new GraphQLError('Post title and text are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const tagId = post.tagId ?? post.groupId;
      if (!tagId || !isObjectId(tagId)) {
        throw new GraphQLError('Valid groupId or tagId is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Prefer the session user; reject spoofed authors (hardening vs legacy).
      if (post.userId && isObjectId(post.userId) && post.userId !== actorId) {
        throw new GraphQLError('Not authorized to create a post as another user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const tag = await context.prisma.tag.findUnique({
        where: { id: tagId },
        select: TAG_RECORD_SELECT,
      });
      if (!tag) {
        throw new GraphQLError('Tag not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const title = post.title.trim();
      const text = post.text.trim();
      const created = await context.prisma.post.create({
        data: {
          userId: actorId,
          tagId,
          title,
          text,
          url: '',
          citationUrl: post.citationUrl?.trim() || undefined,
          attribution: post.attribution?.trim() || undefined,
          created: new Date(),
          pointTimestamp: new Date(),
        },
        select: { id: true },
      });

      const url = buildPostUrl(tag.url, title, created.id);

      let messageRoomId: string | undefined;
      try {
        const room = await addUserToPostRoom(context.prisma, created.id, actorId);
        messageRoomId = room.id;
      } catch (err) {
        logger.warn('addPost: failed to create post message room', {
          postId: created.id,
          userId: actorId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await context.prisma.post.update({
        where: { id: created.id },
        data: {
          url,
          ...(messageRoomId ? { messageRoomId } : {}),
        },
        select: { id: true },
      });

      await logActivity(
        context.prisma,
        ActivityEventTypeValues.POSTED,
        { userId: actorId, postId: created.id },
        title
      );

      return returnPostEntity(context.prisma, created.id);
    },

    deletePost: async (
      _parent: unknown,
      args: { postId: string },
      context: GraphQLContext
    ): Promise<{ _id: string }> => {
      const userId = requireUserId(context);
      const isAdmin = context.user?.admin === true;

      if (!isObjectId(args.postId)) {
        return { _id: args.postId };
      }

      const existing = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { id: true, userId: true, deleted: true },
      });
      if (!existing) {
        return { _id: args.postId };
      }

      if (existing.userId !== userId && !isAdmin) {
        throw new GraphQLError('Not authorized to delete this post', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!existing.deleted) {
        await context.prisma.post.update({
          where: { id: args.postId },
          data: { deleted: true },
          select: { id: true },
        });
      }

      return { _id: args.postId };
    },

    approvePost: async (
      _parent: unknown,
      args: { postId: string; userId: string; remove?: boolean | null },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      const actorId = requireUserId(context);

      if (!args.postId || !args.userId) {
        throw new GraphQLError('Post ID and User ID are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!isObjectId(args.postId) || !isObjectId(args.userId)) {
        throw new GraphQLError('Invalid ID format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      assertActorMatches(actorId, args.userId, 'approve');

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { deleted: true, approvedBy: true, rejectedBy: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.post.update({
        where: { id: args.postId },
        data: {
          approvedBy: toggleUserOnList(post.approvedBy ?? [], args.userId, args.remove),
          rejectedBy: (post.rejectedBy ?? []).filter((id) => id !== args.userId),
        },
        select: { id: true },
      });

      return returnPostEntity(context.prisma, args.postId);
    },

    rejectPost: async (
      _parent: unknown,
      args: { postId: string; userId: string; remove?: boolean | null },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      const actorId = requireUserId(context);

      if (!args.postId || !args.userId) {
        throw new GraphQLError('Post ID and User ID are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!isObjectId(args.postId) || !isObjectId(args.userId)) {
        throw new GraphQLError('Invalid ID format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      assertActorMatches(actorId, args.userId, 'reject');

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { deleted: true, approvedBy: true, rejectedBy: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      await context.prisma.post.update({
        where: { id: args.postId },
        data: {
          rejectedBy: toggleUserOnList(post.rejectedBy ?? [], args.userId, args.remove),
          approvedBy: (post.approvedBy ?? []).filter((id) => id !== args.userId),
        },
        select: { id: true },
      });

      return returnPostEntity(context.prisma, args.postId);
    },

    updatePostBookmark: async (
      _parent: unknown,
      args: { postId: string; userId: string },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      const actorId = requireUserId(context);

      if (!args.postId || !args.userId) {
        throw new GraphQLError('Post ID and User ID are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!isObjectId(args.postId) || !isObjectId(args.userId)) {
        throw new GraphQLError('Invalid ID format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      assertActorMatches(actorId, args.userId, 'bookmark');

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { deleted: true, bookmarkedBy: true, dayPoints: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const bookmarkedBy = post.bookmarkedBy ?? [];
      const alreadyBookmarked = bookmarkedBy.includes(args.userId);

      if (alreadyBookmarked) {
        await context.prisma.post.update({
          where: { id: args.postId },
          data: {
            bookmarkedBy: bookmarkedBy.filter((id) => id !== args.userId),
            dayPoints: Math.max((post.dayPoints ?? 0) - 1, 0),
          },
          select: { id: true },
        });
      } else {
        await context.prisma.post.update({
          where: { id: args.postId },
          data: { bookmarkedBy: [...bookmarkedBy, args.userId] },
          select: { id: true },
        });
        await updateTrending(context.prisma, args.postId);
      }

      return returnPostEntity(context.prisma, args.postId);
    },

    updateFeaturedSlot: async (
      _parent: unknown,
      args: { postId: string; featuredSlot?: number | null },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      requireUserId(context);
      requireAdmin(context);

      if (!args.postId || !isObjectId(args.postId)) {
        throw new GraphQLError('Invalid postId', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const slot = args.featuredSlot ?? null;
      if (slot !== null && (slot < 1 || slot > 12 || !Number.isInteger(slot))) {
        throw new GraphQLError('featuredSlot must be between 1 and 12', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { deleted: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (slot !== null) {
        // Application-enforced exclusivity (Prisma has no unique on featuredSlot).
        await context.prisma.post.updateMany({
          where: { featuredSlot: slot },
          data: { featuredSlot: null },
        });
      }

      await context.prisma.post.update({
        where: { id: args.postId },
        data: { featuredSlot: slot },
        select: { id: true },
      });

      return returnPostEntity(context.prisma, args.postId);
    },

    toggleVoting: async (
      _parent: unknown,
      args: { postId: string },
      context: GraphQLContext
    ): Promise<Common.Post> => {
      const userId = requireUserId(context);
      const isAdmin = context.user?.admin === true;

      if (!args.postId || !isObjectId(args.postId)) {
        throw new GraphQLError('Invalid postId', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { userId: true, deleted: true, enableVoting: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (post.userId !== userId && !isAdmin) {
        throw new GraphQLError('Not authorized to toggle voting on this post', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await context.prisma.post.update({
        where: { id: args.postId },
        data: { enableVoting: !post.enableVoting },
        select: { id: true },
      });

      return returnPostEntity(context.prisma, args.postId);
    },

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

      if (!isObjectId(args.postId) || !isObjectId(args.userId)) {
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

      const post = await context.prisma.post.findUnique({
        where: { id: args.postId },
        select: { userId: true, deleted: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (post.userId === args.userId) {
        throw new GraphQLError('Cannot report your own post', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // The NOT filter makes the update its own dedupe, so concurrent requests
      // from the same user can't double count `reported`.
      const { count } = await context.prisma.post.updateMany({
        where: { id: args.postId, NOT: { reportedBy: { has: args.userId } } },
        data: {
          reportedBy: { push: args.userId },
          reported: { increment: 1 },
        },
      });
      if (count === 0) {
        const latest = await context.prisma.post.findUnique({
          where: { id: args.postId },
          select: { reportedBy: true },
        });
        if (latest?.reportedBy?.includes(args.userId)) {
          throw new GraphQLError('You have already reported this post', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return returnPostEntity(context.prisma, args.postId);
    },
  },
};
