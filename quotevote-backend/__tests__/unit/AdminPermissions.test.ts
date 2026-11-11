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

type Role = 'guest' | 'member' | 'admin';
type TestUser = { _id: string; admin: boolean } | null;

const USERS: Record<Role, TestUser> = {
  guest: null,
  member: { _id: 'member-1', admin: false },
  admin: { _id: 'admin-1', admin: true },
};

// Admin resolvers respond differently for guests depending on the operation
const REJECTION: Record<Role, Record<string, string>> = {
  guest: {
    users: 'UNAUTHENTICATED',
    userInviteRequests: 'UNAUTHENTICATED',
    getUserReports: 'UNAUTHENTICATED',
    getBotReportedUsers: 'UNAUTHENTICATED',
    sendUserInviteApproval: 'FORBIDDEN',
  },
  member: {
    users: 'FORBIDDEN',
    userInviteRequests: 'FORBIDDEN',
    getUserReports: 'FORBIDDEN',
    getBotReportedUsers: 'FORBIDDEN',
    sendUserInviteApproval: 'FORBIDDEN',
  },
  admin: {},
};

function buildPrisma() {
  return {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({ id: targetUserId }),
    },
    userReport: { findMany: jest.fn().mockResolvedValue([]) },
  };
}

type Operation = {
  name: string;
  source: string;
  // Prisma calls that must NOT occur if the caller is rejected
  guarded: (p: ReturnType<typeof buildPrisma>) => jest.Mock[];
  // Expected result for an admin with empty data
  adminData: Record<string, unknown>;
};

const operations: Operation[] = [
  {
    name: 'users',
    source: `query { result: users(limit: 5, offset: 0) { _id username } }`,
    guarded: (p) => [p.user.findMany],
    adminData: { result: [] },
  },
  {
    name: 'userInviteRequests',
    source: `query { result: userInviteRequests { _id email } }`,
    guarded: (p) => [p.user.findMany],
    adminData: { result: [] },
  },
  {
    name: 'getUserReports',
    source: `query { result: getUserReports(userId: "${targetUserId}") { _id reason } }`,
    guarded: (p) => [p.userReport.findMany],
    adminData: { result: [] },
  },
  {
    name: 'getBotReportedUsers',
    source: `query { result: getBotReportedUsers(sortBy: "botReports", limit: 10) { _id username } }`,
    guarded: (p) => [p.user.findMany],
    adminData: { result: [] },
  },
  {
    // An admin receives NOT_FOUND (non-existent user): proves that authorization was passed
    name: 'sendUserInviteApproval',
    source: `mutation { result: sendUserInviteApproval(userId: "${targetUserId}", inviteStatus: "approved") }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    adminData: {},
  },
];

describe('admin permissions matrix (executable schema)', () => {
  describe.each(operations)('$name', (op) => {
    it.each(['guest', 'member'] as const)(
      'rejects %s without touching the database',
      async (role) => {
        const prisma = buildPrisma();
        const user = USERS[role];

        const result = await graphql({
          schema,
          source: op.source,
          contextValue: { user, userId: user?._id ?? null, prisma },
        });

        expect(result.errors?.[0].extensions?.code).toBe(REJECTION[role][op.name]);
        expect(result.data?.result ?? null).toBeNull();
        for (const fn of op.guarded(prisma)) {
          expect(fn).not.toHaveBeenCalled();
        }
      }
    );

    it('lets an admin through the authorization gate', async () => {
      const prisma = buildPrisma();
      const user = USERS.admin;

      const result = await graphql({
        schema,
        source: op.source,
        contextValue: { user, userId: user?._id, prisma },
      });

      if (op.name === 'sendUserInviteApproval') {
        expect(result.errors?.[0].extensions?.code).toBe('NOT_FOUND');
        expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.user.update).not.toHaveBeenCalled();
      } else {
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual(op.adminData);
      }
    });
  });

  describe('sendUserInviteApproval input validation (admin)', () => {
    it('rejects a malformed userId before querying', async () => {
      const prisma = buildPrisma();

      const result = await graphql({
        schema,
        source: `mutation { sendUserInviteApproval(userId: "not-an-id", inviteStatus: "approved") }`,
        contextValue: { user: USERS.admin, userId: 'admin-1', prisma },
      });

      expect(result.errors?.[0].extensions?.code).toBe('BAD_USER_INPUT');
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
