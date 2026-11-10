import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { userResolver } from '~/data/resolvers/userResolver';
import type { GraphQLContext } from '~/types/graphql';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';
import { loadUserReputation } from '~/data/resolvers/utils/reputation';

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

jest.mock('~/data/utils/pubsub', () => ({
  pubsub: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('~/data/resolvers/utils/reputation', () => ({
  calculateUserReputation: jest.fn().mockResolvedValue({}),
  loadUserReputation: jest.fn(),
}));

const actorId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';

function mockContext(overrides: Partial<GraphQLContext['user']> = {}): GraphQLContext {
  return {
    prisma: {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      botReport: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      userReport: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'notif-1',
          userId: otherId,
          userIdBy: actorId,
          label: 'followed',
          status: 'new',
          notificationType: 'FOLLOW',
          postId: null,
          created: new Date(),
        }),
      },
    } as unknown as GraphQLContext['prisma'],
    user: {
      _id: actorId,
      admin: false,
      ...overrides,
    },
  } as GraphQLContext;
}

describe('userResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.user', () => {
    it('returns null when user not found', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await userResolver.Query.user(null, { username: 'alice' }, ctx);

      expect(result).toBeNull();
      expect(ctx.prisma.user.findFirst).toHaveBeenCalledWith({
        where: { username: 'alice' },
        select: { ...PUBLIC_USER_SELECT, accountStatus: true },
      });
    });

    it('returns null for a disabled account', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
        accountStatus: 'disabled',
      });

      await expect(userResolver.Query.user(null, { username: 'alice' }, ctx)).resolves.toBeNull();
    });

    it('returns public user profile when found', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
        name: 'Alice',
        accountStatus: 'active',
      });

      const result = await userResolver.Query.user(null, { username: 'alice' }, ctx);

      expect(result).toMatchObject({
        _id: actorId,
        username: 'alice',
        name: 'Alice',
      });
    });
  });

  describe('Query.searchUser', () => {
    it('returns empty array when queryName is empty', async () => {
      const ctx = mockContext();
      const result = await userResolver.Query.searchUser(null, { queryName: '' }, ctx);

      expect(result).toEqual([]);
      expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('uses Prisma contains with mode insensitive for safe search', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: actorId, username: 'alice', accountStatus: 'active' },
      ]);

      // Attempt injection — Prisma parameterizes this safely
      const result = await userResolver.Query.searchUser(null, { queryName: '@.*' }, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: '@.*', mode: 'insensitive' } },
            { username: { contains: '@.*', mode: 'insensitive' } },
          ],
        },
        select: { ...PUBLIC_USER_SELECT, accountStatus: true },
        take: 20,
      });
      expect(result).toHaveLength(1);
    });

    it('leaves out disabled accounts in code and returns at most 10', async () => {
      const ctx = mockContext();
      const rows = Array.from({ length: 14 }, (_, i) => ({
        id: `507f1f77bcf86cd7994390${String(i).padStart(2, '0')}`,
        username: `user${i}`,
        accountStatus: i < 3 ? 'disabled' : 'active',
      }));
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue(rows);

      const result = await userResolver.Query.searchUser(null, { queryName: 'user' }, ctx);

      expect(result).toHaveLength(10);
      expect(result.map((u) => u.username)).not.toContain('user0');
      expect(result[0].username).toBe('user3');
    });
  });

  describe('Mutation.updateUser', () => {
    it('requires authentication', async () => {
      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: actorId, bio: 'Hello' } },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('updates own bio as plain text', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
        bio: 'Thoughtful dialogue',
      });

      const result = await userResolver.Mutation.updateUser(
        null,
        { user: { _id: actorId, bio: '  Thoughtful dialogue  ' } },
        ctx
      );

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: actorId },
        data: { bio: 'Thoughtful dialogue' },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          contributorBadge: true,
          upvotes: true,
          downvotes: true,
          followingIds: true,
          followerIds: true,
          reputation: true,
        },
      });
      expect(result.bio).toBe('Thoughtful dialogue');
    });

    it('rejects HTML in bio', async () => {
      const ctx = mockContext();
      await expect(
        userResolver.Mutation.updateUser(null, { user: { _id: actorId, bio: '<b>nope</b>' } }, ctx)
      ).rejects.toThrow(/plain text/);
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });

    it('forbids non-admin from updating another user', async () => {
      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: otherId, bio: 'Nope' } },
          mockContext({ admin: false })
        )
      ).rejects.toThrow(/Not authorized/);
    });

    it('allows admin to update contributorBadge on another user', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: otherId,
        username: 'bob',
        contributorBadge: true,
      });

      const result = await userResolver.Mutation.updateUser(
        null,
        { user: { _id: otherId, contributorBadge: true } },
        ctx
      );

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: otherId },
        data: { contributorBadge: true },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          contributorBadge: true,
          upvotes: true,
          downvotes: true,
          followingIds: true,
          followerIds: true,
          reputation: true,
        },
      });
      expect(result.contributorBadge).toBe(true);
    });

    it('throws NOT_FOUND when Prisma P2025 error occurs', async () => {
      const ctx = mockContext();
      const prismaError = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });
      (ctx.prisma.user.update as jest.Mock).mockRejectedValue(prismaError);

      await expect(
        userResolver.Mutation.updateUser(null, { user: { _id: actorId, bio: 'Test' } }, ctx)
      ).rejects.toThrow(/User not found/);
    });

    it('hashes password changes for completed accounts', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: actorId,
        password: 'already-set',
        status: null,
      });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
      });

      await userResolver.Mutation.updateUser(
        null,
        { user: { _id: actorId, password: 'NewPassword1' } },
        ctx
      );

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword1', 'salt');
      expect(ctx.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: actorId },
          data: { password: 'hashed-password' },
        })
      );
    });

    it('rejects unfinished invite accounts from updateUser', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: actorId,
        password: null,
        status: 4,
      });

      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: actorId, password: 'NewPassword1' } },
          ctx
        )
      ).rejects.toThrow(/complete signup via completeSignup/);
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.updateUserAvatar', () => {
    const avatarQualities = {
      topType: 'LongHairStraight',
      hairColor: 'Brown',
      clotheType: 'Hoodie',
    };

    it('requires authentication', async () => {
      await expect(
        userResolver.Mutation.updateUserAvatar(
          null,
          { user_id: actorId, avatarQualities },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('updates own avatar qualities', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
        avatar: avatarQualities,
      });

      const result = await userResolver.Mutation.updateUserAvatar(
        null,
        { user_id: actorId, avatarQualities },
        ctx
      );

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: actorId },
        data: { avatar: avatarQualities },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          bio: true,
          contributorBadge: true,
          upvotes: true,
          downvotes: true,
          followingIds: true,
          followerIds: true,
          reputation: true,
        },
      });
      expect(result.avatar).toEqual(avatarQualities);
    });

    it('forbids updating another user avatar', async () => {
      await expect(
        userResolver.Mutation.updateUserAvatar(
          null,
          { user_id: otherId, avatarQualities },
          mockContext({ admin: false })
        )
      ).rejects.toThrow(/Not authorized/);
    });

    it('rejects non-object avatarQualities', async () => {
      await expect(
        userResolver.Mutation.updateUserAvatar(
          null,
          { user_id: actorId, avatarQualities: null },
          mockContext()
        )
      ).rejects.toThrow(/avatarQualities/);
    });
  });

  describe('Mutation.reportBot', () => {
    const validUserId = otherId;
    const validReporterId = actorId;

    it('throws UNAUTHENTICATED GraphQLError when user is not authenticated', async () => {
      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: validUserId, reporterId: validReporterId },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Authentication required',
          extensions: expect.objectContaining({ code: 'UNAUTHENTICATED' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when userId or reporterId is missing', async () => {
      const ctx = mockContext();

      await expect(
        userResolver.Mutation.reportBot(null, { userId: '', reporterId: validReporterId }, ctx)
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User ID and Reporter ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );

      await expect(
        userResolver.Mutation.reportBot(null, { userId: validUserId, reporterId: '' }, ctx)
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User ID and Reporter ID are required',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when userId or reporterId has invalid ObjectId format', async () => {
      const ctx = mockContext();

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: 'invalid-id', reporterId: validReporterId },
          ctx
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid ID format',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: validUserId, reporterId: 'invalid-id' },
          ctx
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Invalid ID format',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws FORBIDDEN GraphQLError when reporting on behalf of another user', async () => {
      const ctx = mockContext();

      await expect(
        userResolver.Mutation.reportBot(null, { userId: validUserId, reporterId: otherId }, ctx)
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Not authorized to report on behalf of another user',
          extensions: expect.objectContaining({ code: 'FORBIDDEN' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when user attempts to report themself', async () => {
      const ctx = mockContext();

      await expect(
        userResolver.Mutation.reportBot(null, { userId: actorId, reporterId: actorId }, ctx)
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'Cannot report yourself as a bot',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws NOT_FOUND GraphQLError when target user does not exist', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: validUserId, reporterId: validReporterId },
          ctx
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'User not found',
          extensions: expect.objectContaining({ code: 'NOT_FOUND' }),
        })
      );

      expect(ctx.prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: validUserId },
        select: { id: true },
      });
    });

    it('returns ALREADY_REPORTED instead of throwing when the user already reported this target', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUserId });
      (ctx.prisma.botReport.findFirst as jest.Mock).mockResolvedValue({ id: 'report-id-123' });

      const result = await userResolver.Mutation.reportBot(
        null,
        { userId: validUserId, reporterId: validReporterId },
        ctx
      );

      expect(result).toEqual({
        code: 'ALREADY_REPORTED',
        message: 'You have already reported this user as a bot',
      });
      // A repeat report is not a failure, and it must not count twice.
      expect(ctx.prisma.botReport.create).not.toHaveBeenCalled();
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });

    it('returns ALREADY_REPORTED instead of throwing when a duplicate report race occurs (P2002)', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUserId });
      (ctx.prisma.botReport.findFirst as jest.Mock).mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      (ctx.prisma.botReport.create as jest.Mock).mockRejectedValue(p2002Error);

      const result = await userResolver.Mutation.reportBot(
        null,
        { userId: validUserId, reporterId: validReporterId },
        ctx
      );

      expect(result).toEqual({
        code: 'ALREADY_REPORTED',
        message: 'You have already reported this user as a bot',
      });
      // The racing request lost: it must not bump the target's botReports counter.
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });

    it('re-throws unexpected database errors', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUserId });
      (ctx.prisma.botReport.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.botReport.create as jest.Mock).mockRejectedValue(new Error('DB failure'));

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: validUserId, reporterId: validReporterId },
          ctx
        )
      ).rejects.toThrow('DB failure');
    });

    it('successfully reports bot, updates target user, and returns { code, message }', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUserId });
      (ctx.prisma.botReport.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.botReport.create as jest.Mock).mockResolvedValue({
        id: 'new-report-id',
        reporterId: validReporterId,
        userId: validUserId,
      });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({ id: validUserId });

      const result = await userResolver.Mutation.reportBot(
        null,
        { userId: validUserId, reporterId: validReporterId },
        ctx
      );

      expect(ctx.prisma.botReport.create).toHaveBeenCalledWith({
        data: {
          reporterId: validReporterId,
          userId: validUserId,
        },
      });

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: validUserId },
        data: {
          botReports: { increment: 1 },
          lastBotReportDate: expect.any(Date),
        },
        select: { id: true },
      });

      expect(result).toEqual({
        code: 'SUCCESS',
        message: 'Bot report submitted successfully',
      });
    });
  });

  describe('Query.getUserReports', () => {
    const targetId = '507f1f77bcf86cd799439013';
    const created = new Date('2026-01-01T00:00:00.000Z');
    const record = {
      id: 'report-1',
      reporterId: otherId,
      reportedUserId: targetId,
      reason: 'spam',
      description: 'Spam',
      status: 'pending',
      severity: 'medium',
      adminNotes: 'checked',
      created,
      createdAt: created,
      updatedAt: created,
    };
    const reporter = { id: otherId, username: 'bob', name: 'Bob' };
    const reportedUser = { id: targetId, username: 'carol', name: 'Carol' };

    it('requires authentication', async () => {
      await expect(
        userResolver.Query.getUserReports(
          null,
          { userId: targetId },
          { ...mockContext(), user: null }
        )
      ).rejects.toMatchObject({ extensions: { code: 'UNAUTHENTICATED' } });
    });

    it('rejects a non-admin and never queries reports', async () => {
      const ctx = mockContext({ admin: false });

      await expect(
        userResolver.Query.getUserReports(null, { userId: targetId }, ctx)
      ).rejects.toMatchObject({ extensions: { code: 'FORBIDDEN' } });
      expect(ctx.prisma.userReport.findMany).not.toHaveBeenCalled();
    });

    it('rejects a malformed userId', async () => {
      const ctx = mockContext({ admin: true });

      await expect(
        userResolver.Query.getUserReports(null, { userId: 'nope' }, ctx)
      ).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
      expect(ctx.prisma.userReport.findMany).not.toHaveBeenCalled();
    });

    it('rejects an unknown status', async () => {
      const ctx = mockContext({ admin: true });

      await expect(
        userResolver.Query.getUserReports(null, { userId: targetId, status: 'bogus' }, ctx)
      ).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
      expect(ctx.prisma.userReport.findMany).not.toHaveBeenCalled();
    });

    it('queries with a status filter and a cap', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([]);

      await userResolver.Query.getUserReports(null, { userId: targetId, status: 'pending' }, ctx);

      expect(ctx.prisma.userReport.findMany).toHaveBeenCalledWith({
        where: { reportedUserId: targetId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });

    it('maps Prisma fields to the GraphQL shape', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([record]);
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([reporter, reportedUser]);
    
      const [report] = await userResolver.Query.getUserReports(null, { userId: targetId }, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: [otherId, targetId] } },
        select: PUBLIC_USER_SELECT,
      });

      expect(report).toMatchObject({
        _id: 'report-1',
        _reporterId: otherId,
        _reportedUserId: targetId,
        reason: 'spam',
        adminNotes: 'checked',
        createdAt: created.toISOString(),
        updatedAt: created.toISOString(),
      });
      expect(report.reporter).toMatchObject({ _id: otherId, username: 'bob' });
      expect(report.reportedUser).toMatchObject({ _id: targetId, username: 'carol' });
    });

      it('returns null for a reporter whose account no longer exists', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([record]);
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([reportedUser]);

      const [report] = await userResolver.Query.getUserReports(null, { userId: targetId }, ctx);

      expect(report.reporter).toBeNull();
      expect(report.reportedUser).toMatchObject({ username: 'carol' });
    });

    it('never returns null timestamps for legacy records', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([
        { ...record, createdAt: null, updatedAt: null },
      ]);
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const [report] = await userResolver.Query.getUserReports(null, { userId: targetId }, ctx);

      expect(report.createdAt).toBe(created.toISOString());
      expect(report.updatedAt).toBe(created.toISOString());
    });
  });
    describe('Query.getBotReportedUsers', () => {
    const joined = new Date('2025-01-01T00:00:00.000Z');
    const lastReport = new Date('2026-02-01T00:00:00.000Z');

        it.each([
      { label: 'a signed-out caller', user: null, code: 'UNAUTHENTICATED' },
      { label: 'a non-admin member', user: { _id: actorId, admin: false }, code: 'FORBIDDEN' },
    ])('rejects $label and never queries users', async ({ user, code }) => {
      const ctx = { ...mockContext(), user } as GraphQLContext;

      await expect(userResolver.Query.getBotReportedUsers(null, {}, ctx)).rejects.toMatchObject({
        extensions: { code },
      });
      expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('rejects an unknown sortBy', async () => {
      const ctx = mockContext({ admin: true });

      await expect(
        userResolver.Query.getBotReportedUsers(null, { sortBy: 'joined' }, ctx)
      ).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
      expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('rejects a non-positive limit', async () => {
      const ctx = mockContext({ admin: true });

      await expect(
        userResolver.Query.getBotReportedUsers(null, { limit: 0 }, ctx)
      ).rejects.toMatchObject({ extensions: { code: 'BAD_USER_INPUT' } });
      expect(ctx.prisma.user.findMany).not.toHaveBeenCalled();
    });

    it('defaults to botReports ordering, limit 100, and users with reports only', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await userResolver.Query.getBotReportedUsers(null, {}, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        where: { botReports: { gt: 0 } },
        orderBy: [{ botReports: 'desc' }, { lastBotReportDate: 'desc' }],
        take: 100,
        select: expect.objectContaining({ email: true, botReports: true, joined: true }),
      });
    });

    it('orders by last report date first for sortBy lastReportDate', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await userResolver.Query.getBotReportedUsers(null, { sortBy: 'lastReportDate' }, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ lastBotReportDate: 'desc' }, { botReports: 'desc' }],
        })
      );
    });

    it('caps limit at 500', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      await userResolver.Query.getBotReportedUsers(null, { limit: 10000 }, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 500 })
      );
    });

    it('maps the fields the admin bot list shows', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: otherId,
          username: 'bot1',
          name: 'Bot One',
          email: 'bot1@example.com',
          botReports: 3,
          accountStatus: 'active',
          lastBotReportDate: lastReport,
          joined,
          contributorBadge: true,
        },
      ]);

      const [user] = await userResolver.Query.getBotReportedUsers(null, {}, ctx);

      expect(user).toMatchObject({
        _id: otherId,
        username: 'bot1',
        email: 'bot1@example.com',
        botReports: 3,
        accountStatus: 'active',
        contributorBadge: true,
      });
    });
  });

  describe('Mutation.followUser', () => {
    it('requires authentication', async () => {
      await expect(
        userResolver.Mutation.followUser(
          null,
          { user_id: otherId, action: 'follow' },
          { ...mockContext(), user: null }
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('rejects self-follow', async () => {
      await expect(
        userResolver.Mutation.followUser(null, { user_id: actorId, action: 'follow' }, mockContext())
      ).rejects.toThrow(/Can't follow the same user/);
    });

    it('follows a user, updates both arrays, and notifies once', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: actorId,
          name: 'Alice',
          username: 'alice',
          followingIds: [],
          accountStatus: 'active',
        })
        .mockResolvedValueOnce({
          id: otherId,
          followerIds: [],
          accountStatus: 'active',
        });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({ id: actorId });
      (ctx.prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
        name: 'Alice',
        followingIds: [otherId],
        followerIds: [],
      });

      const result = await userResolver.Mutation.followUser(
        null,
        { user_id: otherId, action: 'follow' },
        ctx
      );

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: actorId },
        data: { followingIds: [otherId] },
        select: { id: true },
      });
      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: otherId },
        data: { followerIds: [actorId] },
        select: { id: true },
      });
      expect(ctx.prisma.notification.create).toHaveBeenCalled();
      expect(result._id).toBe(actorId);
      expect(result._followingId).toEqual([otherId]);
    });

    it('unfollows without creating a notification', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: actorId,
          name: 'Alice',
          username: 'alice',
          followingIds: [otherId],
          accountStatus: 'active',
        })
        .mockResolvedValueOnce({
          id: otherId,
          followerIds: [actorId],
          accountStatus: 'active',
        });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({ id: actorId });
      (ctx.prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        id: actorId,
        username: 'alice',
        followingIds: [],
        followerIds: [],
      });

      await userResolver.Mutation.followUser(null, { user_id: otherId, action: 'un-follow' }, ctx);

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: actorId },
        data: { followingIds: [] },
        select: { id: true },
      });
      expect(ctx.prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.reportUser', () => {
    it('creates a report and returns SUCCESS', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: otherId });
      (ctx.prisma.userReport.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.userReport.create as jest.Mock).mockResolvedValue({ id: 'report-1' });

      const result = await userResolver.Mutation.reportUser(
        null,
        {
          reportUserInput: {
            _reportedUserId: otherId,
            reason: 'spam',
            description: 'lots of spam',
            severity: 'high',
          },
        },
        ctx
      );

      expect(ctx.prisma.userReport.create).toHaveBeenCalledWith({
        data: {
          reporterId: actorId,
          reportedUserId: otherId,
          reason: 'spam',
          description: 'lots of spam',
          severity: 'high',
          status: 'pending',
        },
        select: { id: true },
      });
      expect(result).toEqual({
        code: 'SUCCESS',
        message: 'User report submitted successfully',
      });
    });

    it('rejects self-reports and duplicates', async () => {
      const ctx = mockContext();

      await expect(
        userResolver.Mutation.reportUser(
          null,
          { reportUserInput: { _reportedUserId: actorId, reason: 'spam' } },
          ctx
        )
      ).rejects.toThrow(/Cannot report yourself/);

      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: otherId });
      (ctx.prisma.userReport.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        userResolver.Mutation.reportUser(
          null,
          { reportUserInput: { _reportedUserId: otherId, reason: 'spam' } },
          ctx
        )
      ).rejects.toThrow(/already reported/);
    });
  });

  describe('Mutation.disableUser / enableUser', () => {
    it('requires admin for disable and enable', async () => {
      const ctx = mockContext({ admin: false });

      await expect(
        userResolver.Mutation.disableUser(null, { userId: otherId }, ctx)
      ).rejects.toThrow(/Admin access required/);
      await expect(
        userResolver.Mutation.enableUser(null, { userId: otherId }, ctx)
      ).rejects.toThrow(/Admin access required/);
    });

    it('disables and enables a user', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: otherId,
        isAdmin: false,
      });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: otherId,
        username: 'bob',
        accountStatus: 'disabled',
      });

      const disabled = await userResolver.Mutation.disableUser(null, { userId: otherId }, ctx);
      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: otherId },
        data: { accountStatus: 'disabled' },
        select: expect.objectContaining({ accountStatus: true }),
      });
      expect(disabled.accountStatus).toBe('disabled');

      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: otherId,
        username: 'bob',
        accountStatus: 'active',
      });
      const enabled = await userResolver.Mutation.enableUser(null, { userId: otherId }, ctx);
      expect(enabled.accountStatus).toBe('active');
    });

    it('refuses to disable an admin account', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: otherId,
        isAdmin: true,
      });

      await expect(
        userResolver.Mutation.disableUser(null, { userId: otherId }, ctx)
      ).rejects.toThrow(/Cannot disable admin accounts/);
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });
  });
});

describe('User.reputation', () => {
  const reputation = {
    _id: 'r1',
    overallScore: 100,
    inviteNetworkScore: 0,
    conductScore: 250,
    activityScore: 1,
    metrics: {} as never,
    lastCalculated: '2026-10-16T15:08:48.328Z',
  };

  beforeEach(() => {
    (loadUserReputation as jest.Mock).mockReset();
  });

  it('returns an embedded reputation without a query', async () => {
    const ctx = mockContext();

    const result = await userResolver.User.reputation(
      { _id: otherId, reputation } as never,
      {},
      ctx
    );

    expect(result).toBe(reputation);
    expect(loadUserReputation).not.toHaveBeenCalled();
  });

  it('loads the stored or calculated reputation for a legacy user', async () => {
    const ctx = mockContext();
    (loadUserReputation as jest.Mock).mockResolvedValue(reputation);

    const result = await userResolver.User.reputation({ _id: otherId } as never, {}, ctx);

    expect(loadUserReputation).toHaveBeenCalledWith(ctx.prisma, otherId);
    expect(result).toBe(reputation);
  });
});
