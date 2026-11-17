/**
 * Queries the frontend calls that had no resolver in the new backend (#623):
 * users, checkDuplicateEmail and userInviteRequests. The reset link query is covered
 * in passwordReset.test.ts.
 */

import { GraphQLError } from 'graphql';
import { userResolver } from '~/data/resolvers/userResolver';
import { userInviteResolver } from '~/data/resolvers/userInviteResolver';
import { PUBLIC_USER_SELECT } from '~/data/utils/userPrismaMapper';
import type { GraphQLContext } from '~/types/graphql';

const adminId = '507f1f77bcf86cd799439011';
const memberId = '507f1f77bcf86cd799439012';

function mockContext(user: GraphQLContext['user'] | undefined): GraphQLContext {
  return {
    prisma: {
      user: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    },
    user,
  } as unknown as GraphQLContext;
}

const asAdmin = () => mockContext({ _id: adminId, admin: true } as GraphQLContext['user']);
const asMember = () => mockContext({ _id: memberId, admin: false } as GraphQLContext['user']);
const asGuest = () => mockContext(undefined);

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(GraphQLError);
  await promise.catch((err: GraphQLError) => expect(err.extensions.code).toBe(code));
}

describe('legacy user queries (#623)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.users', () => {
    it('requires a signed-in admin', async () => {
      await expectCode(userResolver.Query.users(null, {}, asGuest()), 'UNAUTHENTICATED');
      await expectCode(userResolver.Query.users(null, {}, asMember()), 'FORBIDDEN');
    });

    it('returns public fields only, newest first, 50 by default', async () => {
      const ctx = asAdmin();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: memberId, username: 'bob', name: 'Bob', contributorBadge: true },
      ]);

      const result = await userResolver.Query.users(null, {}, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        orderBy: { joined: 'desc' },
        skip: 0,
        take: 50,
        select: PUBLIC_USER_SELECT,
      });
      expect(result[0]).toEqual(
        expect.objectContaining({ _id: memberId, username: 'bob', contributorBadge: true })
      );
      expect(result[0]).not.toHaveProperty('password');
    });

    it('caps the page at 100 and ignores negative paging', async () => {
      const ctx = asAdmin();

      await userResolver.Query.users(null, { limit: 500, offset: -5 }, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100, skip: 0 })
      );
    });
  });

  describe('Query.checkDuplicateEmail', () => {
    it('rejects an invalid email', async () => {
      await expectCode(
        userResolver.Query.checkDuplicateEmail(null, { email: 'not-an-email' }, asGuest()),
        'BAD_USER_INPUT'
      );
    });

    it('matches case-insensitively without a regex and returns no user fields', async () => {
      const ctx = asGuest();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([{ status: 4, password: 'hash' }]);

      const result = await userResolver.Query.checkDuplicateEmail(
        null,
        { email: ' Alice@Example.com ' },
        ctx
      );

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        where: { email: { equals: 'Alice@Example.com', mode: 'insensitive' } },
        select: { status: true, password: true },
      });
      expect(result).toEqual([{ isDuplicate: false, duplicateCount: 1 }]);
    });

    it('treats an undecided access request as not a duplicate', async () => {
      const ctx = asGuest();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([{ status: 1 }]);

      const result = await userResolver.Query.checkDuplicateEmail(
        null,
        { email: 'new@example.com' },
        ctx
      );

      expect(result).toEqual([]);
    });

    it('treats an invite that was never used as not a duplicate (#691)', async () => {
      const ctx = asGuest();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([{ status: 4, password: null }]);

      const result = await userResolver.Query.checkDuplicateEmail(
        null,
        { email: 'invited@example.com' },
        ctx
      );

      expect(result).toEqual([]);
    });

    it('still reports a declined request as a duplicate', async () => {
      const ctx = asGuest();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([{ status: 2, password: null }]);

      const result = await userResolver.Query.checkDuplicateEmail(
        null,
        { email: 'declined@example.com' },
        ctx
      );

      expect(result).toEqual([{ isDuplicate: false, duplicateCount: 1 }]);
    });

    it('returns an empty list when no account uses the email', async () => {
      const result = await userResolver.Query.checkDuplicateEmail(
        null,
        { email: 'nobody@example.com' },
        asGuest()
      );

      expect(result).toEqual([]);
    });
  });

  describe('Query.userInviteRequests', () => {
    it('requires a signed-in admin', async () => {
      await expectCode(
        userInviteResolver.Query.userInviteRequests(null, {}, asGuest()),
        'UNAUTHENTICATED'
      );
      await expectCode(
        userInviteResolver.Query.userInviteRequests(null, {}, asMember()),
        'FORBIDDEN'
      );
    });

    it('lists requested and declined users with the status as a string', async () => {
      const ctx = asAdmin();
      const joined = new Date('2026-10-16T13:51:48.795Z');
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([
        { id: memberId, email: 'new@example.com', status: 1, joined },
        { id: adminId, email: 'no@example.com', status: 2, joined },
      ]);

      const result = await userInviteResolver.Query.userInviteRequests(null, {}, ctx);

      expect(ctx.prisma.user.findMany).toHaveBeenCalledWith({
        where: { status: { in: [1, 2] } },
        orderBy: { joined: 'desc' },
        select: { id: true, email: true, status: true, joined: true },
      });
      expect(result).toEqual([
        { _id: memberId, email: 'new@example.com', status: '1', joined },
        { _id: adminId, email: 'no@example.com', status: '2', joined },
      ]);
    });
  });
});
