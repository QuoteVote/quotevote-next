import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { userResolver } from '~/data/resolvers/userResolver';
import type { GraphQLContext } from '~/types/graphql';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';
const actorId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';

function mockContext(overrides: Partial<GraphQLContext['user']> = {}): GraphQLContext {
  return {
    prisma: {
      user: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      botReport: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      userReport: {
        findMany: jest.fn(),
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
        where: { username: 'alice', accountStatus: 'active' },
        select: expect.any(Object),
      });
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
          accountStatus: 'active',
        },
        select: expect.any(Object),
        take: 10,
      });
      expect(result).toHaveLength(1);
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

    it('throws BAD_USER_INPUT GraphQLError when user has already reported this target', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUserId });
      (ctx.prisma.botReport.findFirst as jest.Mock).mockResolvedValue({ id: 'report-id-123' });

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: validUserId, reporterId: validReporterId },
          ctx
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'You have already reported this user as a bot',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
    });

    it('throws BAD_USER_INPUT GraphQLError when duplicate report race occurs (P2002)', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: validUserId });
      (ctx.prisma.botReport.findFirst as jest.Mock).mockResolvedValue(null);

      const p2002Error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
      });
      (ctx.prisma.botReport.create as jest.Mock).mockRejectedValue(p2002Error);

      await expect(
        userResolver.Mutation.reportBot(
          null,
          { userId: validUserId, reporterId: validReporterId },
          ctx
        )
      ).rejects.toThrow(
        expect.objectContaining({
          message: 'You have already reported this user as a bot',
          extensions: expect.objectContaining({ code: 'BAD_USER_INPUT' }),
        })
      );
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
      reporter: { id: otherId, username: 'bob', name: 'Bob' },
      reportedUser: { id: targetId, username: 'carol', name: 'Carol' },
    };

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

    it('queries with a status filter, a cap and public-only user fields', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([]);

      await userResolver.Query.getUserReports(null, { userId: targetId, status: 'pending' }, ctx);

      expect(ctx.prisma.userReport.findMany).toHaveBeenCalledWith({
        where: { reportedUserId: targetId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: {
          reporter: { select: PUBLIC_USER_SELECT },
          reportedUser: { select: PUBLIC_USER_SELECT },
        },
      });
    });

    it('maps Prisma fields to the GraphQL shape', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([record]);

      const [report] = await userResolver.Query.getUserReports(null, { userId: targetId }, ctx);

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
    });

    it('never returns null timestamps for legacy records', async () => {
      const ctx = mockContext({ admin: true });
      (ctx.prisma.userReport.findMany as jest.Mock).mockResolvedValue([
        { ...record, createdAt: null, updatedAt: null },
      ]);

      const [report] = await userResolver.Query.getUserReports(null, { userId: targetId }, ctx);

      expect(report.createdAt).toBe(created.toISOString());
      expect(report.updatedAt).toBe(created.toISOString());
    });
  });
});
