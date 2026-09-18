import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { userResolver } from '~/data/resolvers/userResolver';
import type { GraphQLContext } from '~/types/graphql';

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
      });
      expect(result.bio).toBe('Thoughtful dialogue');
    });

    it('rejects HTML in bio', async () => {
      const ctx = mockContext();
      await expect(
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: actorId, bio: '<b>nope</b>' } },
          ctx
        )
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
        userResolver.Mutation.updateUser(
          null,
          { user: { _id: actorId, bio: 'Test' } },
          ctx
        )
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
});
