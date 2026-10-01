import { commentResolver } from '~/data/resolvers/commentResolver';
import { toComment } from '~/data/resolvers/utils/commentsQuotes';
import type { GraphQLContext } from '~/types/graphql';

const date = new Date('2026-01-01T00:00:00.000Z');
const userId = '60d5ec49ad414d7a8d5464a0';
const postOwnerId = '60d5ec49ad414d7a8d546499';
const postId = '60d5ec49ad414d7a8d5464c2';
const commentId = '60d5ec49ad414d7a8d5464b1';

const COMMENT_SELECT = {
  id: true,
  userId: true,
  postId: true,
  content: true,
  startWordIndex: true,
  endWordIndex: true,
  url: true,
  reaction: true,
  deleted: true,
  created: true,
};

jest.mock('~/data/utils/pubsub', () => ({
  pubsub: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('~/data/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

function mockContext(user: GraphQLContext['user'] = null) {
  return {
    prisma: {
      comment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      post: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      messageRoom: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'room-1' }),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
      activity: {
        create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({
          id: 'notif-1',
          userId: postOwnerId,
          userIdBy: userId,
          label: 'note',
          status: 'new',
          notificationType: 'COMMENTED',
          postId,
          created: date,
        }),
      },
    },
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedUser(): NonNullable<GraphQLContext['user']> {
  return {
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
  } as NonNullable<GraphQLContext['user']>;
}

describe('commentResolver', () => {
  describe('Mutation.addComment', () => {
    it('requires authentication', async () => {
      await expect(
        commentResolver.Mutation.addComment(
          null,
          {
            comment: {
              userId,
              postId,
              content: 'hello',
              startWordIndex: 0,
              endWordIndex: 1,
            },
          },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('creates a comment with side effects and notifies the post author', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        userId: postOwnerId,
        deleted: false,
        pointTimestamp: date,
        dayPoints: 2,
      });
      context.prisma.comment.create.mockResolvedValue({
        id: commentId,
        userId,
        postId,
        content: 'hello',
        startWordIndex: 0,
        endWordIndex: 1,
        url: null,
        reaction: null,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});

      const result = await commentResolver.Mutation.addComment(
        null,
        {
          comment: {
            userId: 'ignored',
            postId,
            content: 'hello',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(context.prisma.comment.create).toHaveBeenCalledWith({
        data: {
          userId,
          postId,
          content: 'hello',
          startWordIndex: 0,
          endWordIndex: 1,
          url: undefined,
          reaction: undefined,
          created: expect.any(Date),
        },
        select: COMMENT_SELECT,
      });
      expect(context.prisma.messageRoom.create).toHaveBeenCalled();
      expect(context.prisma.activity.create).toHaveBeenCalled();
      expect(context.prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: postOwnerId,
            userIdBy: userId,
            notificationType: 'COMMENTED',
          }),
        })
      );
      expect(result._id).toBe(commentId);
    });

    it('still returns the comment when joining the post room fails', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        userId: postOwnerId,
        deleted: false,
        pointTimestamp: date,
        dayPoints: 0,
      });
      context.prisma.comment.create.mockResolvedValue({
        id: commentId,
        userId,
        postId,
        content: 'hello',
        startWordIndex: 0,
        endWordIndex: 1,
        url: null,
        reaction: null,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});
      context.prisma.messageRoom.findFirst.mockRejectedValue(new Error('room down'));

      const result = await commentResolver.Mutation.addComment(
        null,
        {
          comment: {
            userId,
            postId,
            content: 'hello',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(result._id).toBe(commentId);
      expect(context.prisma.notification.create).toHaveBeenCalled();
    });

    it('skips notification when commenting on own post', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        userId,
        deleted: false,
        pointTimestamp: date,
        dayPoints: 0,
      });
      context.prisma.comment.create.mockResolvedValue({
        id: commentId,
        userId,
        postId,
        content: 'hello',
        startWordIndex: 0,
        endWordIndex: 1,
        url: null,
        reaction: null,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});

      await commentResolver.Mutation.addComment(
        null,
        {
          comment: {
            userId,
            postId,
            content: 'hello',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(context.prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.deleteComment', () => {
    it('soft-deletes when the owner requests it', async () => {
      const context = mockContext(authedUser());
      context.prisma.comment.findUnique.mockResolvedValue({
        id: commentId,
        userId,
        deleted: false,
      });
      context.prisma.comment.update.mockResolvedValue({ id: commentId });

      const result = await commentResolver.Mutation.deleteComment(
        null,
        { commentId },
        context as never
      );

      expect(context.prisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { deleted: true },
        select: { id: true },
      });
      expect(result).toEqual({ _id: commentId });
    });

    it('forbids deleting another users comment', async () => {
      const context = mockContext(authedUser());
      context.prisma.comment.findUnique.mockResolvedValue({
        id: commentId,
        userId: postOwnerId,
        deleted: false,
      });

      await expect(
        commentResolver.Mutation.deleteComment(null, { commentId }, context as never)
      ).rejects.toThrow(/Not authorized/);
    });
  });

  describe('legacy-shaped documents', () => {
    it('maps a comment without timestamps through toComment', () => {
      const mapped = toComment({
        id: commentId,
        userId,
        postId,
        content: 'legacy note',
        startWordIndex: null,
        endWordIndex: null,
        url: null,
        reaction: null,
        deleted: false,
        created: date,
      });

      expect(mapped).toEqual({
        _id: commentId,
        userId,
        postId,
        content: 'legacy note',
        startWordIndex: 0,
        endWordIndex: 0,
        url: undefined,
        reaction: undefined,
        deleted: false,
        created: date,
      });
    });
  });
});
