import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { staffResolver } from '~/data/resolvers/staffResolver';
import type { GraphQLContext } from '~/types/graphql';

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const adminId = '507f1f77bcf86cd799439011';
const targetId = '507f1f77bcf86cd799439012';
const otherAdminId = '507f1f77bcf86cd799439013';

type Viewer = GraphQLContext['user'];
const ADMIN = { _id: adminId, username: 'admin', admin: true } as Viewer;
const MEMBER = { _id: 'member-1', username: 'member', admin: false } as Viewer;
const MODERATOR = { _id: 'mod-1', username: 'mod', admin: false, isModerator: true } as Viewer;

/** A finished account with the given roles. */
const account = (id: string, roles: Record<string, boolean> = {}) => ({
  id,
  password: 'hash',
  isAdmin: false,
  isModerator: false,
  isInviteApprover: false,
  ...roles,
});

function buildContext(user: Viewer) {
  const tx = {
    user: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({ id: targetId }),
      count: jest.fn().mockResolvedValue(1),
    },
  };
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
    },
    staffAction: {
      create: jest.fn().mockResolvedValue({ id: 'log' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx)),
  };
  const context = { user, userId: user?._id ?? null, prisma } as unknown as GraphQLContext;
  return { context, prisma, tx };
}

/** The target as read before the change, then the user returned after it. */
function withTarget(
  prisma: ReturnType<typeof buildContext>['prisma'],
  before: ReturnType<typeof account> | null,
  after: Record<string, unknown> = {}
) {
  prisma.user.findUnique
    .mockResolvedValueOnce(before)
    .mockResolvedValueOnce(before && { username: 'target', ...before, ...after });
}

const setRoles = (context: GraphQLContext, roles: string[], userId = targetId) =>
  staffResolver.Mutation.setUserRoles(null, { userId, roles }, context);

async function expectCode(promise: Promise<unknown>, code: string, message?: string) {
  const err = await promise.then(
    () => null,
    (e: unknown) => e
  );
  expect(err).toBeInstanceOf(GraphQLError);
  expect((err as GraphQLError).extensions.code).toBe(code);
  if (message) expect((err as GraphQLError).message).toBe(message);
}

describe('staffResolver (#616 part 2)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('setUserRoles', () => {
    it('is for admins only, and touches nothing otherwise', async () => {
      for (const [viewer, code] of [
        [null, 'UNAUTHENTICATED'],
        [MEMBER, 'FORBIDDEN'],
        [MODERATOR, 'FORBIDDEN'],
      ] as const) {
        const { context, prisma } = buildContext(viewer);
        await expectCode(setRoles(context, ['moderator']), code);
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
      }
    });

    it('refuses a bad id or an unknown role before reading anything', async () => {
      const { context, prisma } = buildContext(ADMIN);
      await expectCode(
        setRoles(context, ['moderator'], 'nope'),
        'BAD_USER_INPUT',
        'Invalid userId'
      );
      await expectCode(setRoles(context, ['owner']), 'BAD_USER_INPUT', 'Unknown role: owner');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('refuses a missing user and an account that never finished signup', async () => {
      const { context, prisma } = buildContext(ADMIN);
      prisma.user.findUnique.mockResolvedValueOnce(null);
      await expectCode(setRoles(context, ['moderator']), 'NOT_FOUND');

      prisma.user.findUnique.mockResolvedValueOnce({ ...account(targetId), password: null });
      await expectCode(
        setRoles(context, ['moderator']),
        'BAD_USER_INPUT',
        'Roles can only be given to accounts that finished signup'
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('grants a role, logs it and returns the user with roles', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(targetId), { isModerator: true });

      const result = await setRoles(context, ['moderator']);

      // The acting admin's record is written in the same transaction.
      expect(tx.user.updateMany).toHaveBeenCalledWith({
        where: { id: adminId, isAdmin: true },
        data: { updatedAt: expect.any(Date) },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: targetId },
        data: { isModerator: true },
        select: { id: true },
      });
      expect(prisma.staffAction.create).toHaveBeenCalledTimes(1);
      expect(prisma.staffAction.create).toHaveBeenCalledWith({
        data: { actorId: adminId, action: 'role_granted', targetId, detail: 'moderator' },
        select: { id: true },
      });
      expect(result).toEqual(
        expect.objectContaining({ _id: targetId, admin: false, isModerator: true })
      );
    });

    it('applies several changes at once and logs each', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(targetId, { isModerator: true }));

      await setRoles(context, ['inviteApprover', 'inviteApprover']);

      expect(tx.user.update.mock.calls[0][0].data).toEqual({
        isModerator: false,
        isInviteApprover: true,
      });
      const logged = prisma.staffAction.create.mock.calls.map((c) => [
        c[0].data.action,
        c[0].data.detail,
      ]);
      expect(logged).toEqual([
        ['role_revoked', 'moderator'],
        ['role_granted', 'inviteApprover'],
      ]);
    });

    it('changes and logs nothing when the roles are already as asked', async () => {
      const { context, prisma } = buildContext(ADMIN);
      withTarget(prisma, account(targetId, { isModerator: true }));

      await setRoles(context, ['moderator']);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(prisma.staffAction.create).not.toHaveBeenCalled();
    });

    it("refuses to remove the acting admin's own admin role", async () => {
      const { context, prisma } = buildContext(ADMIN);
      prisma.user.findUnique.mockResolvedValueOnce(account(adminId, { isAdmin: true }));

      await expectCode(
        setRoles(context, ['moderator'], adminId),
        'FORBIDDEN',
        "You can't remove your own admin role"
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('lets an admin keep their admin role while changing their other roles', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(adminId, { isAdmin: true }));

      await setRoles(context, ['admin', 'moderator'], adminId);

      expect(tx.user.update.mock.calls[0][0].data).toEqual({ isModerator: true });
    });

    it('removes another admin while an admin remains', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(otherAdminId, { isAdmin: true }));

      await setRoles(context, [], otherAdminId);

      expect(tx.user.count).toHaveBeenCalledWith({ where: { isAdmin: true } });
      expect(prisma.staffAction.create.mock.calls[0][0].data).toMatchObject({
        action: 'role_revoked',
        detail: 'admin',
      });
    });

    it('never removes the last admin, and logs nothing then', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(otherAdminId, { isAdmin: true }));
      tx.user.count.mockResolvedValue(0);

      await expectCode(
        setRoles(context, [], otherAdminId),
        'BAD_USER_INPUT',
        "The last admin can't be removed"
      );
      expect(prisma.staffAction.create).not.toHaveBeenCalled();
    });

    it('refuses an admin who lost the admin role since the request started', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(targetId));
      tx.user.updateMany.mockResolvedValue({ count: 0 });

      await expectCode(setRoles(context, ['moderator']), 'FORBIDDEN', 'Admin access required');
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(prisma.staffAction.create).not.toHaveBeenCalled();
    });

    it('reports a clash with another role change as CONFLICT, logging nothing', async () => {
      const { context, prisma } = buildContext(ADMIN);
      withTarget(prisma, account(otherAdminId, { isAdmin: true }));
      prisma.$transaction.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Write conflict', {
          code: 'P2034',
          clientVersion: 'test',
        })
      );

      await expectCode(
        setRoles(context, [], otherAdminId),
        'CONFLICT',
        'Roles were changed by someone else at the same time. Please try again.'
      );
      // Tried three times in all before giving up.
      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
      expect(prisma.staffAction.create).not.toHaveBeenCalled();
    });

    it('retries a clash and goes through when the retry succeeds', async () => {
      const { context, prisma, tx } = buildContext(ADMIN);
      withTarget(prisma, account(targetId));
      prisma.$transaction
        .mockRejectedValueOnce(
          new Prisma.PrismaClientKnownRequestError('Write conflict', {
            code: 'P2034',
            clientVersion: 'test',
          })
        )
        .mockImplementationOnce(async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx));

      await setRoles(context, ['moderator']);

      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
      expect(prisma.staffAction.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('staffActions', () => {
    it('is for admins only', async () => {
      for (const [viewer, code] of [
        [null, 'UNAUTHENTICATED'],
        [MEMBER, 'FORBIDDEN'],
        [MODERATOR, 'FORBIDDEN'],
      ] as const) {
        const { context, prisma } = buildContext(viewer);
        await expectCode(staffResolver.Query.staffActions(null, {}, context), code);
        expect(prisma.staffAction.findMany).not.toHaveBeenCalled();
      }
    });

    it('lists newest first, 50 by default and at most 100', async () => {
      const { context, prisma } = buildContext(ADMIN);

      await staffResolver.Query.staffActions(null, {}, context);
      await staffResolver.Query.staffActions(null, { limit: 1000, offset: -5 }, context);

      expect(prisma.staffAction.findMany.mock.calls[0][0]).toMatchObject({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 50,
      });
      expect(prisma.staffAction.findMany.mock.calls[1][0]).toMatchObject({ skip: 0, take: 100 });
    });

    it('fills in actor and target users with one lookup', async () => {
      const { context, prisma } = buildContext(ADMIN);
      const at = new Date('2026-11-18T10:00:00Z');
      prisma.staffAction.findMany.mockResolvedValue([
        {
          id: 'a1',
          actorId: adminId,
          action: 'role_granted',
          targetId,
          detail: 'moderator',
          createdAt: at,
        },
        {
          id: 'a2',
          actorId: adminId,
          action: 'content_removed',
          targetId: 'post-1',
          detail: null,
          createdAt: at,
        },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: adminId, username: 'admin' },
        { id: targetId, username: 'target' },
      ]);

      const result = await staffResolver.Query.staffActions(null, {}, context);

      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany.mock.calls[0][0].where.id.in.sort()).toEqual(
        [adminId, targetId, 'post-1'].sort()
      );
      expect(result[0]).toMatchObject({
        _id: 'a1',
        action: 'role_granted',
        actor: expect.objectContaining({ _id: adminId, username: 'admin' }),
        target: expect.objectContaining({ _id: targetId, username: 'target' }),
        detail: 'moderator',
        createdAt: at,
      });
      // A target that isn't a user has no user attached.
      expect(result[1]).toMatchObject({ targetId: 'post-1', target: null, detail: null });
    });
  });

  describe('User role fields', () => {
    const profile = { _id: targetId, username: 'target' } as Parameters<
      typeof staffResolver.User.isModerator
    >[0];

    it('shows a user their own roles from the request user', async () => {
      const self = { _id: targetId, isModerator: true, isInviteApprover: false } as Viewer;
      const { context, prisma } = buildContext(self);

      await expect(staffResolver.User.isModerator(profile, {}, context)).resolves.toBe(true);
      await expect(staffResolver.User.isInviteApprover(profile, {}, context)).resolves.toBe(false);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("shows an admin another user's roles from the database", async () => {
      const { context, prisma } = buildContext(ADMIN);
      prisma.user.findMany.mockResolvedValue([
        { id: targetId, isModerator: true, isInviteApprover: false },
      ]);

      await expect(staffResolver.User.isModerator(profile, {}, context)).resolves.toBe(true);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: [targetId] } },
        select: { id: true, isModerator: true, isInviteApprover: true },
      });
    });

    it('reads both fields for a whole list of users with one query', async () => {
      const { context, prisma } = buildContext(ADMIN);
      const ids = [targetId, otherAdminId, '507f1f77bcf86cd799439014'];
      prisma.user.findMany.mockResolvedValue([
        { id: ids[0], isModerator: true, isInviteApprover: false },
        { id: ids[1], isModerator: false, isInviteApprover: true },
        // ids[2] is gone, so its fields read null.
      ]);
      const users = ids.map((id) => ({ ...profile, _id: id }));

      const values = await Promise.all(
        users.flatMap((u) => [
          staffResolver.User.isModerator(u, {}, context),
          staffResolver.User.isInviteApprover(u, {}, context),
        ])
      );

      expect(values).toEqual([true, false, false, true, null, null]);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findMany.mock.calls[0][0].where.id.in).toEqual(ids);
    });

    it('reuses roles already read in the same request', async () => {
      const { context, prisma } = buildContext(ADMIN);
      prisma.user.findMany.mockResolvedValue([
        { id: targetId, isModerator: true, isInviteApprover: false },
      ]);

      await staffResolver.User.isModerator(profile, {}, context);
      await expect(staffResolver.User.isInviteApprover(profile, {}, context)).resolves.toBe(false);

      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('reads the new flags after setUserRoles in the same request', async () => {
      // e.g. one document: a: setUserRoles(...) { isModerator } b: setUserRoles(...) { isModerator }
      const { context, prisma } = buildContext(ADMIN);
      prisma.user.findMany
        .mockResolvedValueOnce([{ id: targetId, isModerator: false, isInviteApprover: false }])
        .mockResolvedValueOnce([{ id: targetId, isModerator: true, isInviteApprover: false }]);
      await expect(staffResolver.User.isModerator(profile, {}, context)).resolves.toBe(false);

      withTarget(prisma, account(targetId), { isModerator: true });
      await setRoles(context, ['moderator']);

      await expect(staffResolver.User.isModerator(profile, {}, context)).resolves.toBe(true);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(2);
    });

    it('keeps requests apart: a new request reads again', async () => {
      const first = buildContext(ADMIN);
      const second = buildContext(ADMIN);
      for (const { prisma } of [first, second]) {
        prisma.user.findMany.mockResolvedValue([
          { id: targetId, isModerator: true, isInviteApprover: false },
        ]);
      }

      await staffResolver.User.isModerator(profile, {}, first.context);
      await staffResolver.User.isModerator(profile, {}, second.context);

      expect(first.prisma.user.findMany).toHaveBeenCalledTimes(1);
      expect(second.prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it("hides other users' roles from members, staff without admin and guests", async () => {
      for (const viewer of [MEMBER, MODERATOR, null]) {
        const { context, prisma } = buildContext(viewer);
        await expect(staffResolver.User.isModerator(profile, {}, context)).resolves.toBeNull();
        await expect(staffResolver.User.isInviteApprover(profile, {}, context)).resolves.toBeNull();
        expect(prisma.user.findUnique).not.toHaveBeenCalled();
        expect(prisma.user.findMany).not.toHaveBeenCalled();
      }
    });
  });
});
