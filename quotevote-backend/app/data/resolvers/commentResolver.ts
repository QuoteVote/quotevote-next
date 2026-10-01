import { GraphQLError } from 'graphql';
import { ActivityEventTypeValues } from '~/data/utils/constants';
import { logger } from '~/data/utils/logger';
import { logActivity } from '~/data/resolvers/utils/activities';
import { addNotification } from '~/data/resolvers/utils/notifications';
import { updateTrending } from '~/data/resolvers/utils/posts';
import { addUserToPostRoom } from '~/data/resolvers/utils/messages';
import { COMMENT_SELECT, toComment } from '~/data/resolvers/utils/commentsQuotes';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

export const commentResolver = {
  Mutation: {
    addComment: async (
      _parent: unknown,
      args: { comment: Common.CommentInput },
      context: GraphQLContext
    ): Promise<Common.Comment> => {
      const userId = requireUserId(context);
      const { postId, content, startWordIndex, endWordIndex, url, reaction } = args.comment;

      if (!isObjectId(postId)) {
        throw new GraphQLError('Invalid postId', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (!content?.trim()) {
        throw new GraphQLError('Comment content is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const post = await context.prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, userId: true, deleted: true },
      });
      if (!post || post.deleted) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const created = await context.prisma.comment.create({
        data: {
          userId,
          postId,
          content: content.trim(),
          startWordIndex: startWordIndex ?? undefined,
          endWordIndex: endWordIndex ?? undefined,
          url: url ?? undefined,
          reaction: reaction ?? undefined,
          created: new Date(),
        },
        select: COMMENT_SELECT,
      });

      await updateTrending(context.prisma, postId);

      // Legacy addComment joins the commenter to the post chat room. A room
      // failure must not fail the comment itself.
      try {
        await addUserToPostRoom(context.prisma, postId, userId);
      } catch (err) {
        logger.warn('addComment: failed to add user to post message room', {
          postId,
          userId,
          error: err instanceof Error ? err.message : String(err),
        });
      }

      await logActivity(
        context.prisma,
        ActivityEventTypeValues.COMMENTED,
        { userId, postId, commentId: created.id },
        `Commented on '${post.title}' post.`
      );

      // Skip self-notifications (deliberate improvement over legacy, which
      // notified the author even on their own comment). Write COMMENTED so the
      // frontend NotificationLists switch and legacy rows stay consistent.
      if (post.userId !== userId) {
        await addNotification(context.prisma, {
          userId: post.userId,
          userIdBy: userId,
          notificationType: 'COMMENTED',
          label: created.content,
          postId,
        });
      }

      return toComment(created);
    },

    deleteComment: async (
      _parent: unknown,
      args: { commentId: string },
      context: GraphQLContext
    ): Promise<{ _id: string }> => {
      const userId = requireUserId(context);
      const isAdmin = context.user?.admin === true;

      if (!isObjectId(args.commentId)) {
        return { _id: args.commentId };
      }

      const existing = await context.prisma.comment.findUnique({
        where: { id: args.commentId },
        select: { id: true, userId: true, deleted: true },
      });
      if (!existing) {
        return { _id: args.commentId };
      }

      if (existing.userId !== userId && !isAdmin) {
        throw new GraphQLError('Not authorized to delete this comment', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!existing.deleted) {
        await context.prisma.comment.update({
          where: { id: args.commentId },
          data: { deleted: true },
          select: { id: true },
        });
      }

      return { _id: args.commentId };
    },
  },
};
