import { notificationResolver } from '~/data/resolvers/notificationResolver';
import {
  NOTIFICATION_POST_SELECT,
  NOTIFICATION_SELECT,
} from '~/data/resolvers/utils/notifications';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';
import type { GraphQLContext } from '~/types/graphql';

const userId = '60d5ec49ad414d7a8d5464a0';

const notificationId = '60d5ec49ad414d7a8d5464b1';
const otherUserId = '60d5ec49ad414d7a8d546499';

function mockContext(user: GraphQLContext['user'] = null): GraphQLContext {
  return {
    prisma: {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
      post: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as GraphQLContext['prisma'],
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedContext(): GraphQLContext {
  return mockContext({
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
  } as NonNullable<GraphQLContext['user']>);
}

describe('notificationResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.notifications', () => {
    it('requires authentication', async () => {
      const ctx = mockContext(null);

      await expect(notificationResolver.Query.notifications(null, {}, ctx)).rejects.toMatchObject({
        message: 'Authentication required',
        extensions: { code: 'UNAUTHENTICATED' },
      });
      expect(ctx.prisma.notification.findMany).not.toHaveBeenCalled();
    });

    it('queries new notifications for the user, newest first, default limit 50', async () => {
      const ctx = authedContext();

      const result = await notificationResolver.Query.notifications(null, {}, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, status: 'new' },
        orderBy: { created: 'desc' },
        take: 50,
        select: NOTIFICATION_SELECT,
      });
      expect(result).toEqual([]);
    });

    it('clamps limit to a maximum of 100', async () => {
      const ctx = authedContext();

      await notificationResolver.Query.notifications(null, { limit: 500 }, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('clamps limit to a minimum of 1', async () => {
      const ctx = authedContext();

      await notificationResolver.Query.notifications(null, { limit: 0 }, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );
    });

    it('returns legacy rows missing userIdBy, notificationType and label', async () => {
      const ctx = authedContext();
      const created = new Date('2020-01-01T00:00:00.000Z');
      (ctx.prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n3',
          userId,
          userIdBy: null,
          label: null,
          status: 'new',
          notificationType: null,
          postId: null,
          created,
        },
      ]);

      const result = await notificationResolver.Query.notifications(null, {}, ctx);

      expect(result).toEqual([
        {
          _id: 'n3',
          userId,
          userIdBy: undefined,
          label: undefined,
          status: 'new',
          notificationType: undefined,
          postId: undefined,
          created,
          userBy: null,
          post: null,
        },
      ]);
      expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('floors a fractional limit', async () => {
      const ctx = authedContext();

      await notificationResolver.Query.notifications(null, { limit: 2.7 }, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 })
      );
    });

    it('maps rows to the GraphQL shape, keeping legacy COMMENTED values', async () => {
      const ctx = authedContext();
      const created = new Date('2026-01-01T00:00:00.000Z');
      (ctx.prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n1',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'nice point',
          status: 'new',
          notificationType: 'COMMENTED',
          postId: '60d5ec49ad414d7a8d5464a2',
          created,
        },
        {
          id: 'n2',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'Bob has started following you.',
          status: 'new',
          notificationType: 'FOLLOW',
          postId: null,
          created,
        },
      ]);

      const result = await notificationResolver.Query.notifications(null, {}, ctx);

      expect(result).toEqual([
        {
          _id: 'n1',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'nice point',
          status: 'new',
          notificationType: 'COMMENTED',
          postId: '60d5ec49ad414d7a8d5464a2',
          created,
          userBy: null,
          post: null,
        },
        {
          _id: 'n2',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'Bob has started following you.',
          status: 'new',
          notificationType: 'FOLLOW',
          postId: undefined,
          created,
          userBy: null,
          post: null,
        },
      ]);
    });

    it('attaches the sender with public fields and the post, deleted or not, in one query each', async () => {
      const ctx = authedContext();
      const created = new Date('2026-01-01T00:00:00.000Z');
      const senderId = '60d5ec49ad414d7a8d5464a1';
      const postId = '60d5ec49ad414d7a8d5464a2';
      const row = (id: string, overrides: Record<string, unknown> = {}) => ({
        id,
        userId,
        userIdBy: senderId,
        label: 'voted',
        status: 'new',
        notificationType: 'UPVOTED',
        postId,
        created,
        ...overrides,
      });
      (ctx.prisma.notification.findMany as jest.Mock).mockResolvedValue([
        row('n1'),
        row('n2'),
        row('n3', { userIdBy: '60d5ec49ad414d7a8d5464a9', postId: null }),
      ]);
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: senderId, username: 'bob', name: 'Bob', avatar: 'bob.png', contributorBadge: true },
      ]);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([
        { id: postId, url: '/post/a/b/' + postId, deleted: true },
      ]);

      const result = await notificationResolver.Query.notifications(null, {}, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: [senderId, '60d5ec49ad414d7a8d5464a9'] } },
        select: PUBLIC_USER_SELECT,
      });
      expect(ctx.prisma.post.findMany).toHaveBeenCalledTimes(1);
      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith({
        where: { id: { in: [postId] } },
        select: NOTIFICATION_POST_SELECT,
      });
      expect(result[0].userBy).toMatchObject({
        _id: senderId,
        username: 'bob',
        name: 'Bob',
        avatar: 'bob.png',
        contributorBadge: true,
        email: '',
      });
      expect(result[1].post).toEqual({ _id: postId, url: '/post/a/b/' + postId, deleted: true });
      // An unknown sender and a notification with no post come back as null.
      expect(result[2].userBy).toBeNull();
      expect(result[2].post).toBeNull();
    });
  });

  describe('Notification field resolvers', () => {
    const base = {
      _id: 'n1',
      userId,
      userIdBy: '60d5ec49ad414d7a8d5464a1',
      postId: '60d5ec49ad414d7a8d5464a2',
      status: 'new',
      created: new Date(),
    };

    it('use the values the query already loaded', async () => {
      const ctx = authedContext();
      const sender = { _id: '60d5ec49ad414d7a8d5464a1', username: 'bob', email: '' };

      await expect(
        notificationResolver.Notification.userBy({ ...base, userBy: sender }, {}, ctx)
      ).resolves.toBe(sender);
      await expect(
        notificationResolver.Notification.post({ ...base, post: null }, {}, ctx)
      ).resolves.toBeNull();
      expect(ctx.prisma.user.findUnique).not.toHaveBeenCalled();
      expect(ctx.prisma.post.findUnique).not.toHaveBeenCalled();
    });

    it('load the sender and post for a notification from the live subscription', async () => {
      const ctx = authedContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: '60d5ec49ad414d7a8d5464a1',
        username: 'bob',
        name: 'Bob',
      });
      (ctx.prisma.post.findUnique as jest.Mock).mockResolvedValue({
        id: '60d5ec49ad414d7a8d5464a2',
        url: '/post/x',
        deleted: false,
      });

      await expect(notificationResolver.Notification.userBy(base, {}, ctx)).resolves.toMatchObject({
        _id: '60d5ec49ad414d7a8d5464a1',
        username: 'bob',
      });
      await expect(notificationResolver.Notification.post(base, {}, ctx)).resolves.toEqual({
        _id: '60d5ec49ad414d7a8d5464a2',
        url: '/post/x',
        deleted: false,
      });
      expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '60d5ec49ad414d7a8d5464a1' },
        select: PUBLIC_USER_SELECT,
      });
      expect(ctx.prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: '60d5ec49ad414d7a8d5464a2' },
        select: NOTIFICATION_POST_SELECT,
      });
    });

    it('return null without querying when there is no sender or post', async () => {
      const ctx = authedContext();
      const bare = { ...base, userIdBy: undefined, postId: undefined };

      await expect(notificationResolver.Notification.userBy(bare, {}, ctx)).resolves.toBeNull();
      await expect(notificationResolver.Notification.post(bare, {}, ctx)).resolves.toBeNull();
      expect(ctx.prisma.user.findUnique).not.toHaveBeenCalled();
      expect(ctx.prisma.post.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.removeNotification', () => {
    const created = new Date('2026-01-01T00:00:00.000Z');
    const liveNotification = {
      id: notificationId,
      userId,
      userIdBy: otherUserId,
      label: 'nice point',
      status: 'new',
      notificationType: 'COMMENTED',
      postId: '60d5ec49ad414d7a8d5464a2',
      created,
    };

    it('requires authentication', async () => {
      await expect(
        notificationResolver.Mutation.removeNotification(
          null,
          { notificationId },
          mockContext(null)
        )
      ).rejects.toMatchObject({
        message: 'Authentication required',
        extensions: { code: 'UNAUTHENTICATED' },
      });
    });

    it('rejects invalid notificationId', async () => {
      const ctx = authedContext();

      await expect(
        notificationResolver.Mutation.removeNotification(
          null,
          { notificationId: 'not-an-id' },
          ctx
        )
      ).rejects.toMatchObject({
        message: 'Invalid notificationId',
        extensions: { code: 'BAD_USER_INPUT' },
      });
    });

    it('soft-deletes when the recipient requests it', async () => {
      const ctx = authedContext();
      (ctx.prisma.notification.findUnique as jest.Mock).mockResolvedValue(liveNotification);
      (ctx.prisma.notification.update as jest.Mock).mockResolvedValue({
        ...liveNotification,
        status: 'deleted',
      });

      const result = await notificationResolver.Mutation.removeNotification(
        null,
        { notificationId },
        ctx
      );

      expect(ctx.prisma.notification.update).toHaveBeenCalledWith({
        where: { id: notificationId },
        data: { status: 'deleted' },
        select: NOTIFICATION_SELECT,
      });
      expect(result).toEqual({
        _id: notificationId,
        userId,
        userIdBy: otherUserId,
        label: 'nice point',
        status: 'deleted',
        notificationType: 'COMMENTED',
        postId: '60d5ec49ad414d7a8d5464a2',
        created,
      });
    });

    it('is idempotent when already deleted', async () => {
      const ctx = authedContext();
      (ctx.prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        ...liveNotification,
        status: 'deleted',
      });

      const result = await notificationResolver.Mutation.removeNotification(
        null,
        { notificationId },
        ctx
      );

      expect(ctx.prisma.notification.update).not.toHaveBeenCalled();
      expect(result.status).toBe('deleted');
    });

    it('forbids removing another users notification', async () => {
      const ctx = authedContext();
      (ctx.prisma.notification.findUnique as jest.Mock).mockResolvedValue({
        ...liveNotification,
        userId: otherUserId,
      });

      await expect(
        notificationResolver.Mutation.removeNotification(null, { notificationId }, ctx)
      ).rejects.toMatchObject({
        message: 'Not authorized to remove this notification',
        extensions: { code: 'FORBIDDEN' },
      });
      expect(ctx.prisma.notification.update).not.toHaveBeenCalled();
    });

    it('throws NOT_FOUND when the notification is missing', async () => {
      const ctx = authedContext();
      (ctx.prisma.notification.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        notificationResolver.Mutation.removeNotification(null, { notificationId }, ctx)
      ).rejects.toMatchObject({
        message: 'Notification not found',
        extensions: { code: 'NOT_FOUND' },
      });
    });
  });
});
