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

// #616: what moderators and invite approvers may do, run against the executable
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
    staffAction: {
      create: jest.fn().mockResolvedValue({ id: 'log' }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    post: {
      findUnique: jest.fn().mockResolvedValue(null),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };
}

type Prisma = ReturnType<typeof buildPrisma>;

async function run(source: string, user: TestUser, prisma: Prisma = buildPrisma()) {
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
  /** Staff allowed in. Admins pass every check; an empty list means admin only. */
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
    allowed: ['inviteApprover', 'both'],
  },
  {
    name: 'disableUser',
    source: `mutation { result: disableUser(userId: "${targetUserId}") { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: ['moderator', 'both'],
  },
  {
    name: 'enableUser',
    source: `mutation { result: enableUser(userId: "${targetUserId}") { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: ['moderator', 'both'],
  },
  {
    name: 'setUserRoles',
    source: `mutation { result: setUserRoles(userId: "${targetUserId}", roles: ["moderator"]) { _id } }`,
    guarded: (p) => [p.user.findUnique, p.user.update],
    passed: { errorCode: 'NOT_FOUND' },
    allowed: [],
  },
  {
    name: 'staffActions',
    source: `query { result: staffActions { _id } }`,
    guarded: (p) => [p.staffAction.findMany],
    passed: { data: { result: [] } },
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

describe('invite approvers stay inside the request queue', () => {
  const decide = (status: string) =>
    `mutation { r: sendUserInviteApproval(userId: "${targetUserId}", inviteStatus: "${status}") }`;

  it.each([
    ['a member', { isAdmin: false }],
    ['a moderator', { isAdmin: false, isModerator: true }],
    ['an admin', { isAdmin: true }],
  ])('refuses to approve or decline %s who finished signup', async (_label, account) => {
    for (const status of ['approved', 'declined']) {
      const prisma = buildPrisma();
      prisma.user.findUnique.mockResolvedValue({
        id: targetUserId,
        email: 'done@example.com',
        username: 'done',
        password: 'hash',
        status: null,
        ...account,
      });

      const { result } = await run(decide(status), STAFF.inviteApprover, prisma);

      expect(result.errors?.[0]?.extensions?.code).toBe('BAD_USER_INPUT');
      expect(result.errors?.[0]?.message).toBe('User has already completed signup');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.staffAction.create).not.toHaveBeenCalled();
    }
  });

  it('declines an access request', async () => {
    const prisma = buildPrisma();
    prisma.user.findUnique.mockResolvedValue({
      id: targetUserId,
      email: 'asker@example.com',
      username: 'asker@example.com',
      password: null,
      status: 1,
    });
    prisma.user.update.mockResolvedValue({ id: targetUserId });

    const { result } = await run(decide('declined'), STAFF.inviteApprover, prisma);

    expect(result.errors).toBeUndefined();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: targetUserId },
      data: { status: 2 },
      select: { id: true },
    });
    // The decision is logged under the approver's name (#616 part 2).
    expect(prisma.staffAction.create).toHaveBeenCalledWith({
      data: {
        actorId: STAFF.inviteApprover._id,
        action: 'invite_declined',
        targetId: targetUserId,
        detail: null,
      },
      select: { id: true },
    });
  });
});

describe('moderators act on members only (#616 part 3)', () => {
  const disable = `mutation { r: disableUser(userId: "${targetUserId}") { _id } }`;
  const enable = `mutation { r: enableUser(userId: "${targetUserId}") { _id } }`;
  const roles = (extra: Record<string, boolean> = {}) => ({
    id: targetUserId,
    isAdmin: false,
    isModerator: false,
    isInviteApprover: false,
    ...extra,
  });

  it('disables and enables a member, logging both under the moderator', async () => {
    for (const [source, action] of [
      [disable, 'user_disabled'],
      [enable, 'user_enabled'],
    ] as const) {
      const prisma = buildPrisma();
      prisma.user.findUnique.mockResolvedValue(roles());
      prisma.user.update.mockResolvedValue({ id: targetUserId, username: 'member' });

      const { result } = await run(source, STAFF.moderator, prisma);

      expect(result.errors).toBeUndefined();
      expect(prisma.staffAction.create).toHaveBeenCalledWith({
        data: { actorId: STAFF.moderator._id, action, targetId: targetUserId, detail: null },
        select: { id: true },
      });
    }
  });

  it.each([
    ['a moderator', { isModerator: true }],
    ['an invite approver', { isInviteApprover: true }],
  ])('refuses to disable or enable %s', async (_label, staffRole) => {
    for (const source of [disable, enable]) {
      const prisma = buildPrisma();
      prisma.user.findUnique.mockResolvedValue(roles(staffRole));

      const { result } = await run(source, STAFF.moderator, prisma);

      expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
      expect(result.errors?.[0]?.message).toBe('Only admins can disable or enable staff accounts');
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(prisma.staffAction.create).not.toHaveBeenCalled();
    }
  });

  it('still refuses to disable an admin, with the existing message', async () => {
    const prisma = buildPrisma();
    prisma.user.findUnique.mockResolvedValue(roles({ isAdmin: true }));

    const { result } = await run(disable, STAFF.moderator, prisma);

    expect(result.errors?.[0]?.message).toBe('Cannot disable admin accounts');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('removing reported posts (#616 part 3)', () => {
  const remove = `mutation { r: deletePost(postId: "${targetPostId}") { _id } }`;
  const authorId = '60d5ec49ad414d7a8d5464b3';
  const post = (extra: Record<string, unknown> = {}) => ({
    id: targetPostId,
    userId: authorId,
    deleted: false,
    reported: 1,
    reportedBy: ['reporter-1'],
    ...extra,
  });
  const author = (extra: Record<string, boolean> = {}) => ({
    isAdmin: false,
    isModerator: false,
    isInviteApprover: false,
    ...extra,
  });

  it("lets a moderator remove a member's reported post, and logs it", async () => {
    const prisma = buildPrisma();
    prisma.post.findUnique.mockResolvedValue(post());
    prisma.user.findUnique.mockResolvedValue(author());

    const { result } = await run(remove, STAFF.moderator, prisma);

    expect(result.errors).toBeUndefined();
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: targetPostId },
      data: { deleted: true },
      select: { id: true },
    });
    expect(prisma.staffAction.create).toHaveBeenCalledWith({
      data: {
        actorId: STAFF.moderator._id,
        action: 'content_removed',
        targetId: targetPostId,
        detail: 'post',
      },
      select: { id: true },
    });
  });

  it('counts a post reported by count only (legacy) as reported', async () => {
    const prisma = buildPrisma();
    prisma.post.findUnique.mockResolvedValue(post({ reported: 2, reportedBy: [] }));
    prisma.user.findUnique.mockResolvedValue(author());

    const { result } = await run(remove, STAFF.moderator, prisma);

    expect(result.errors).toBeUndefined();
    expect(prisma.post.update).toHaveBeenCalled();
  });

  it.each([
    ['a post nobody reported', post({ reported: 0, reportedBy: [] }), author()],
    ['a reported post by a moderator', post(), author({ isModerator: true })],
    ['a reported post by an invite approver', post(), author({ isInviteApprover: true })],
    ['a reported post by an admin', post(), author({ isAdmin: true })],
  ])('refuses to let a moderator remove %s', async (_label, found, writer) => {
    const prisma = buildPrisma();
    prisma.post.findUnique.mockResolvedValue(found);
    prisma.user.findUnique.mockResolvedValue(writer);

    const { result } = await run(remove, STAFF.moderator, prisma);

    expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(prisma.post.update).not.toHaveBeenCalled();
    expect(prisma.staffAction.create).not.toHaveBeenCalled();
  });

  it("refuses an invite approver someone else's reported post", async () => {
    const prisma = buildPrisma();
    prisma.post.findUnique.mockResolvedValue(post());
    prisma.user.findUnique.mockResolvedValue(author());

    const { result } = await run(remove, STAFF.inviteApprover, prisma);

    expect(result.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it('lets an author delete their own post without logging a staff action', async () => {
    const prisma = buildPrisma();
    prisma.post.findUnique.mockResolvedValue(post({ userId: STAFF.moderator._id }));

    const { result } = await run(remove, STAFF.moderator, prisma);

    expect(result.errors).toBeUndefined();
    expect(prisma.post.update).toHaveBeenCalled();
    expect(prisma.staffAction.create).not.toHaveBeenCalled();
  });
});
