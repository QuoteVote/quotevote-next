process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { graphql } from 'graphql';
import { schema } from '~/data/schema';

jest.mock('~/data/utils/send-grid-mail', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ success: true }),
  SENDGRID_TEMPLATE_IDS: {
    INVITE_REQUEST_RECEIVED_CONFIRMATION: 'tpl-confirm',
    INVITATION_APPROVE: 'tpl-approve',
    INVITATION_DECLINE: 'tpl-decline',
  },
}));

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Part of #107 (iteration 2): role matrix for admin operations.
// Executes the actual schema, thereby validating both the resolver and the type definitions together.

const targetUserId = '60d5ec49ad414d7a8d5464b1';
const targetPostId = '60d5ec49ad414d7a8d5464b2';

type Role = 'guest' | 'member' | 'admin';
type TestUser = { _id: string; admin: boolean } | null;

const USERS: Record<Role, TestUser> = {
  guest: null,
  member: { _id: 'member-1', admin: false },
  admin: { _id: 'admin-1', admin: true },
};

function buildPrisma() {
  return {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest
        .fn()
        .mockImplementation(async ({ where, data }) => ({
          id: where.id,
          username: 'target',
          ...data,
        })),
    },
    userReport: { findMany: jest.fn().mockResolvedValue([]) },
    post: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: targetPostId }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
}

type Prisma = ReturnType<typeof buildPrisma>;

async function run(source: string, user: TestUser, prisma: Prisma = buildPrisma()) {
  const result = await graphql({
    schema,
    source,
    contextValue: { user, userId: user?._id ?? null, prisma },
  });
  return { result, prisma };
}

const codeOf = (result: Awaited<ReturnType<typeof run>>['result']) =>
  result.errors?.[0]?.extensions?.code;
const messageOf = (result: Awaited<ReturnType<typeof run>>['result']) =>
  result.errors?.[0]?.message;

type Operation = {
  name: string;
  source: string;
  // Prisma calls that must NOT occur if the caller is rejected
  guarded: (p: Prisma) => jest.Mock[];
  // Expected result for an admin with empty data
  admin: { data: Record<string, unknown> } | { errorCode: 'NOT_FOUND' };
};

const operations: Operation[] = [
  {
    name: 'users',
    source: `query { result: users(limit: 5, offset: 0) { _id username } }`,
    guarded: (p) => [p.user.findMany],
    admin: { data: { result: [] } },
  },
  {
    name: 'userInviteRequests',
    source: `query { result: userInviteRequests { _id email } }`,
    guarded: (p) => [p.user.findMany],
    admin: { data: { result: [] } },
  },
  {
    name: 'getUserReports',
    source: `query { result: getUserReports(userId: "${targetUserId}") { _id reason } }`,
    guarded: (p) => [p.userReport.findMany],
    admin: { data: { result: [] } },
  },
  {
    name: 'getBotReportedUsers',
    source: `query { result: getBotReportedUsers(sortBy: "botReports", limit: 10) { _id username } }`,
    guarded: (p) => [p.user.findMany],
    admin: { data: { result: [] } },
  },
  {
    // An admin receives NOT_FOUND (non-existent user): proves that authorization was passed
    name: 'sendUserInviteApproval',
    source: `mutation { result: sendUserInviteApproval(userId: "${targetUserId}", inviteStatus: "approved") }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    admin: { errorCode: 'NOT_FOUND' },
  },
  {
    name: 'disableUser',
    source: `mutation { result: disableUser(userId: "${targetUserId}") { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    admin: { errorCode: 'NOT_FOUND' },
  },
  {
    name: 'enableUser',
    source: `mutation { result: enableUser(userId: "${targetUserId}") { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    admin: { errorCode: 'NOT_FOUND' },
  },
  {
    name: 'updateFeaturedSlot',
    source: `mutation { result: updateFeaturedSlot(postId: "${targetPostId}", featuredSlot: 1) { _id } }`,
    guarded: (p) => [p.post.findUnique, p.post.updateMany, p.post.update],
    admin: { errorCode: 'NOT_FOUND' },
  },
];

describe('admin permissions matrix (executable schema)', () => {
  describe.each(operations)('$name', (op) => {
    it('rejects a guest as unauthenticated without touching the database', async () => {
      const { result, prisma } = await run(op.source, USERS.guest);

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(result.data?.result ?? null).toBeNull();
      op.guarded(prisma).forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });

    it('rejects a non-admin member as forbidden without touching the database', async () => {
      const { result, prisma } = await run(op.source, USERS.member);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(result.data?.result ?? null).toBeNull();
      op.guarded(prisma).forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });

    it('lets an admin through the authorization gate', async () => {
      const { result } = await run(op.source, USERS.admin);

      if ('errorCode' in op.admin) {
        expect(codeOf(result)).toBe(op.admin.errorCode);
      } else {
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual(op.admin.data);
      }
    });
  });

  describe('sendUserInviteApproval', () => {
    it('does not update anything when the target does not exist', async () => {
      const { prisma } = await run(operations[4].source, USERS.admin);

      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a malformed userId before querying', async () => {
      const source = `mutation { sendUserInviteApproval(userId: "not-an-id", inviteStatus: "approved") }`;
      const { result, prisma } = await run(source, USERS.admin);

      expect(codeOf(result)).toBe('BAD_USER_INPUT');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('disableUser', () => {
    const source = `mutation { result: disableUser(userId: "${targetUserId}") { _id } }`;

    it('refuses to disable an admin account and updates nothing', async () => {
      const prisma = buildPrisma();
      prisma.user.findUnique.mockResolvedValue({ id: targetUserId, isAdmin: true });

      const { result } = await run(source, USERS.admin, prisma);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Cannot disable admin accounts');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('updateUser and contributorBadge', () => {
    const setBadge = `mutation { result: updateUser(user: { _id: "${targetUserId}", contributorBadge: true }) { _id contributorBadge } }`;
    const editProfile = `mutation { result: updateUser(user: { _id: "${targetUserId}", name: "New Name" }) { _id } }`;

    it('rejects a guest', async () => {
      const { result, prisma } = await run(setBadge, USERS.guest);

      expect(codeOf(result)).toBe('UNAUTHENTICATED');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a member setting the badge on another user', async () => {
      const { result, prisma } = await run(setBadge, USERS.member);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects a member setting the badge on their own profile', async () => {
      const self = { _id: targetUserId, admin: false };
      const { result, prisma } = await run(setBadge, self);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Only admins can update contributorBadge');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('lets an admin set the badge on another user', async () => {
      const { result, prisma } = await run(setBadge, USERS.admin);

      expect(result.errors).toBeUndefined();
      expect(result.data).toEqual({ result: { _id: targetUserId, contributorBadge: true } });
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: targetUserId },
          data: { contributorBadge: true },
        })
      );
    });

    it("rejects an admin editing another user's profile without the badge", async () => {
      const { result, prisma } = await run(editProfile, USERS.admin);

      expect(codeOf(result)).toBe('FORBIDDEN');
      expect(messageOf(result)).toBe('Admins may only update contributorBadge for other users');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
