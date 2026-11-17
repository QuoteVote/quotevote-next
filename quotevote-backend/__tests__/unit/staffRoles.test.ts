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

// #616 part 1: what moderators and invite approvers may do, run against the executable
// schema. Admins, members and guests are covered by adminPermissions.test.ts.

const targetUserId = '60d5ec49ad414d7a8d5464b1';
const targetPostId = '60d5ec49ad414d7a8d5464b2';

type Staff = 'moderator' | 'inviteApprover' | 'both';
type TestUser = { _id: string; admin: false; isModerator?: boolean; isInviteApprover?: boolean };

const STAFF: Record<Staff, TestUser> = {
  moderator: { _id: 'moderator-1', admin: false, isModerator: true },
  inviteApprover: { _id: 'approver-1', admin: false, isInviteApprover: true },
  both: { _id: 'both-1', admin: false, isModerator: true, isInviteApprover: true },
};

function buildPrisma() {
  return {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
    },
    userReport: { findMany: jest.fn().mockResolvedValue([]) },
    post: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

type Prisma = ReturnType<typeof buildPrisma>;

async function run(source: string, user: TestUser) {
  const prisma = buildPrisma();
  const result = await graphql({
    schema,
    source,
    contextValue: { user, userId: user._id, prisma },
  });
  return { result, prisma };
}

type Operation = {
  name: string;
  source: string;
  /** Prisma calls that must not happen when the caller is refused. */
  guarded: (p: Prisma) => jest.Mock[];
  /** What a caller who passes the role check gets back from empty data. */
  passed: { data: Record<string, unknown> } | { errorCode: 'NOT_FOUND' };
  /** Staff allowed in. Anything not listed stays admin-only for now (#616 part 3). */
  allowed: Staff[];
};

const operations: Operation[] = [
  {
    name: 'getUserReports',
    source: `query { result: getUserReports(userId: "${targetUserId}") { _id reason } }`,
    guarded: (p) => [p.userReport.findMany],
    passed: { data: { result: [] } },
    allowed: ['moderator', 'both'],
  },
  {
    name: 'getBotReportedUsers',
    source: `query { result: getBotReportedUsers(sortBy: "botReports", limit: 10) { _id username } }`,
    guarded: (p) => [p.user.findMany],
    passed: { data: { result: [] } },
    allowed: ['moderator', 'both'],
  },
  {
    // NOT_FOUND for a user that doesn't exist proves the role check passed.
    name: 'sendUserInviteApproval',
    source: `mutation { result: sendUserInviteApproval(userId: "${targetUserId}", inviteStatus: "approved") }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: ['inviteApprover', 'both'],
  },
  {
    name: 'users',
    source: `query { result: users(limit: 5, offset: 0) { _id username } }`,
    guarded: (p) => [p.user.findMany],
    passed: { data: { result: [] } },
    allowed: [],
  },
  {
    name: 'userInviteRequests',
    source: `query { result: userInviteRequests { _id email } }`,
    guarded: (p) => [p.user.findMany],
    passed: { data: { result: [] } },
    allowed: [],
  },
  {
    name: 'disableUser',
    source: `mutation { result: disableUser(userId: "${targetUserId}") { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: [],
  },
  {
    name: 'enableUser',
    source: `mutation { result: enableUser(userId: "${targetUserId}") { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: [],
  },
  {
    name: 'updateFeaturedSlot',
    source: `mutation { result: updateFeaturedSlot(postId: "${targetPostId}", featuredSlot: 1) { _id } }`,
    guarded: (p) => [p.post.findUnique, p.post.updateMany, p.post.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: [],
  },
];

const cases = operations.flatMap((op) =>
  (Object.keys(STAFF) as Staff[]).map((staff) => ({ ...op, staff }))
);

describe('staff role matrix (#616)', () => {
  it.each(cases)('$name as $staff', async (op) => {
    const { result, prisma } = await run(op.source, STAFF[op.staff]);

    if (op.allowed.includes(op.staff)) {
      if ('errorCode' in op.passed) {
        expect(result.errors?.[0]?.extensions?.code).toBe(op.passed.errorCode);
      } else {
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual(op.passed.data);
      }
    } else {
      expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      expect(result.data?.result ?? null).toBeNull();
      op.guarded(prisma).forEach((fn) => expect(fn).not.toHaveBeenCalled());
    }
  });
});
