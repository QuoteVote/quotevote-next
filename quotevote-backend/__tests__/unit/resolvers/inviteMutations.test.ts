process.env.JWT_SECRET = 'test_secret';

import { Prisma } from '@prisma/client';
import sendGridEmail from '~/data/utils/send-grid-mail';
import { verifyInviteSignupToken } from '~/data/utils/authentication';
import { userInviteResolver } from '~/data/resolvers/userInviteResolver';
import { resetExpiryIndexState } from '~/data/utils/rateLimiter';
import { createRateLimitStore, type RateLimitStore } from '../../helpers/rateLimitStore';

jest.mock('~/data/utils/send-grid-mail', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ success: true }),
  SENDGRID_TEMPLATE_IDS: { INVITE_REQUEST_RECEIVED_CONFIRMATION: 'tpl-confirm' },
}));

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const inviterId = '507f1f77bcf86cd799439011';
const DAY_MS = 24 * 60 * 60 * 1000;
const sendMail = sendGridEmail as jest.Mock;
let rateLimits: RateLimitStore;

const createContext = (userId: string | null = inviterId, ip = '203.0.113.7') => ({
  userId,
  user: userId
    ? { _id: userId, name: 'Ada Lovelace', username: 'ada', accountStatus: 'active' }
    : null,
  req: { ip },
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'new-user' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    userInvite: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'invite' }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    $runCommandRaw: rateLimits.$runCommandRaw,
  },
});

type Context = ReturnType<typeof createContext>;

const invite = (context: Context, email: string) =>
  userInviteResolver.Mutation.sendUserInvite(null, { email }, context as never);

const contact = (context: Context, email: string) =>
  userInviteResolver.Mutation.sendInvestorMail(null, { email }, context as never);

beforeEach(() => {
  jest.clearAllMocks();
  resetExpiryIndexState();
  rateLimits = createRateLimitStore();
  delete process.env.TO_INVESTOR_EMAIL;
});

/** The signup token in the invite email, decoded, plus the rest of the email. */
const sentInvite = () => {
  const email = sendMail.mock.calls[0][0];
  const url = new URL(email.dynamicTemplateData.invite_url);
  return { email, url, payload: verifyInviteSignupToken(url.searchParams.get('token') ?? '') };
};

/** An account still waiting on an invite, and that invite. Admin approvals have no inviter. */
const waitingInvite = (
  context: Context,
  expiresAt: Date,
  invitedById: string | null = 'first-inviter'
) => {
  context.prisma.user.findFirst.mockResolvedValue({ id: 'waiting', password: null, status: 4 });
  context.prisma.userInvite.findFirst.mockResolvedValue({
    id: 'old-invite',
    expiresAt,
    invitedById,
  });
};

describe('sendUserInvite (#672)', () => {
  it('requires a signed-in member', async () => {
    await expect(invite(createContext(null), 'new@example.com')).rejects.toThrow(
      'Authentication required'
    );
  });

  it.each(['suspended', 'pending', 'disabled'])('refuses a %s member', async (accountStatus) => {
    const context = createContext();
    Object.assign(context.user as object, { accountStatus });

    await expect(invite(context, 'new@example.com')).rejects.toMatchObject({
      extensions: { code: 'FORBIDDEN' },
    });
    expect(context.prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses an invalid email', async () => {
    const context = createContext();
    await expect(invite(context, 'not-an-email')).rejects.toThrow(
      'Please enter a valid email address'
    );
    await expect(invite(context, `${'a'.repeat(250)}@x.io`)).rejects.toThrow(
      'Please enter a valid email address'
    );
    expect(context.prisma.user.create).not.toHaveBeenCalled();
  });

  it('creates an approved account and a 7-day invite, and emails a signup link bound to both', async () => {
    const context = createContext();
    const before = Date.now();

    await expect(invite(context, ' New@Example.com ')).resolves.toEqual({
      code: 'SUCCESS',
      message: 'Invitation sent successfully',
    });

    // Status 4 keeps the invitee out of the admin's access request queue.
    expect(context.prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'new@example.com', username: 'new@example.com', status: 4, password: null },
      select: { id: true },
    });
    const { data } = context.prisma.userInvite.create.mock.calls[0][0];
    expect(data).toMatchObject({
      email: 'new@example.com',
      invitedById: inviterId,
      status: 'pending',
    });
    expect(data.expiresAt.getTime() - before).toBeGreaterThanOrEqual(7 * DAY_MS);
    expect(data.expiresAt.getTime() - before).toBeLessThan(7 * DAY_MS + 60_000);

    const { email, url, payload } = sentInvite();
    expect(email).toMatchObject({
      to: 'new@example.com',
      templateId: 'tpl-confirm',
      dynamicTemplateData: { inviter_name: 'Ada Lovelace' },
    });
    expect(`${url.origin}${url.pathname}`).toBe('http://localhost:3000/auths/signup');
    expect(payload).toMatchObject({
      userId: 'new-user',
      inviteId: 'invite',
      email: 'new@example.com',
      type: 'invite_signup',
      purpose: 'completeSignup',
    });
    expect((payload.exp ?? 0) - (payload.iat ?? 0)).toBe(7 * 24 * 60 * 60);
  });

  it("names the inviter by username when they haven't set a name", async () => {
    const context = createContext();
    Object.assign(context.user as object, { name: undefined });

    await invite(context, 'new@example.com');

    expect(sentInvite().email.dynamicTemplateData.inviter_name).toBe('ada');
  });

  it.each([
    ['an account', { id: 'member', password: 'hashed', status: undefined }],
    ['a pending request', { id: 'requested', password: null, status: 1 }],
    ['a declined request', { id: 'declined', password: null, status: 2 }],
    ['an admin-approved request', { id: 'approved', password: null, status: 4 }],
  ])('refuses an address with %s', async (_label, existing) => {
    const context = createContext();
    context.prisma.user.findFirst.mockResolvedValue(existing);

    await expect(invite(context, 'taken@example.com')).rejects.toThrow(
      'User with this email already exists'
    );
    expect(context.prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: 'taken@example.com' },
      select: { id: true, password: true, status: true },
    });
    expect(context.prisma.userInvite.create).not.toHaveBeenCalled();
    expect(context.prisma.userInvite.updateMany).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('refuses an address whose invite is still open', async () => {
    const context = createContext();
    waitingInvite(context, new Date(Date.now() + DAY_MS));

    await expect(invite(context, 'friend@example.com')).rejects.toThrow(
      'Invite already sent to this email'
    );
    expect(context.prisma.userInvite.updateMany).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends an expired, unused invite again with a new expiry and link', async () => {
    const context = createContext();
    const expired = new Date(Date.now() - DAY_MS);
    waitingInvite(context, expired);

    await expect(invite(context, 'friend@example.com')).resolves.toMatchObject({
      code: 'SUCCESS',
    });

    expect(context.prisma.userInvite.updateMany).toHaveBeenCalledWith({
      where: { id: 'old-invite', status: 'pending', expiresAt: expired },
      data: { expiresAt: expect.any(Date), invitedById: inviterId },
    });
    expect(context.prisma.user.create).not.toHaveBeenCalled();
    expect(sentInvite().payload).toMatchObject({
      userId: 'waiting',
      inviteId: 'old-invite',
      email: 'friend@example.com',
    });
  });

  it('invites someone whose admin approval has lapsed, as a 7-day member invite (#691)', async () => {
    // An admin approved them, so a member may invite them again: the approval's
    // invite is renewed in the member's name and a member link goes out.
    const context = createContext();
    const lapsed = new Date(Date.now() - 60_000);
    waitingInvite(context, lapsed, null);
    const before = Date.now();

    await expect(invite(context, 'approved@example.com')).resolves.toMatchObject({
      code: 'SUCCESS',
    });

    const renewal = context.prisma.userInvite.updateMany.mock.calls[0][0];
    expect(renewal.where).toEqual({ id: 'old-invite', status: 'pending', expiresAt: lapsed });
    expect(renewal.data.invitedById).toBe(inviterId);
    expect(renewal.data.expiresAt.getTime() - before).toBeGreaterThanOrEqual(7 * DAY_MS);
    expect(context.prisma.user.create).not.toHaveBeenCalled();
    expect(sentInvite().payload).toMatchObject({
      userId: 'waiting',
      inviteId: 'old-invite',
      email: 'approved@example.com',
    });
  });

  it('refuses while an admin approval is still open (#691)', async () => {
    const context = createContext();
    waitingInvite(context, new Date(Date.now() + 60 * 60_000), null);

    await expect(invite(context, 'approved@example.com')).rejects.toThrow(
      'Invite already sent to this email'
    );
    expect(context.prisma.userInvite.updateMany).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('gives a lapsed admin approval back when the member invite fails to send (#691)', async () => {
    const context = createContext();
    const lapsed = new Date(Date.now() - 60_000);
    waitingInvite(context, lapsed, null);
    sendMail.mockRejectedValueOnce(new Error('down'));

    await expect(invite(context, 'approved@example.com')).rejects.toThrow(
      "We couldn't send the invite email"
    );
    expect(context.prisma.userInvite.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'old-invite', status: 'pending', expiresAt: expect.any(Date) },
      data: { expiresAt: lapsed, invitedById: null },
    });
  });

  it('refuses to resend when another request renewed or used the invite first', async () => {
    const context = createContext();
    waitingInvite(context, new Date(Date.now() - DAY_MS));
    context.prisma.userInvite.updateMany.mockResolvedValue({ count: 0 });

    await expect(invite(context, 'friend@example.com')).rejects.toThrow(
      'Invite already sent to this email'
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('reports a race on the same email as already existing', async () => {
    const context = createContext();
    context.prisma.user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: 'x' })
    );

    await expect(invite(context, 'race@example.com')).rejects.toThrow(
      'User with this email already exists'
    );
    expect(context.prisma.userInvite.create).not.toHaveBeenCalled();
  });

  it.each([
    ['throws', () => sendMail.mockRejectedValueOnce(new Error('SendGrid is not configured'))],
    ['reports a failure', () => sendMail.mockResolvedValueOnce({ success: false, error: 'bad' })],
  ])(
    'removes the new account and invite and tells the inviter when the email %s',
    async (_label, failSend) => {
      const context = createContext();
      failSend();

      await expect(invite(context, 'quiet@example.com')).rejects.toThrow(
        "We couldn't send the invite email. Please try again later."
      );
      expect(context.prisma.userInvite.deleteMany).toHaveBeenCalledWith({
        where: { id: 'invite' },
      });
      expect(context.prisma.user.deleteMany).toHaveBeenCalledWith({ where: { id: 'new-user' } });
    }
  );

  it('puts back the old expiry when a resent invite fails to send', async () => {
    const context = createContext();
    const expired = new Date(Date.now() - DAY_MS);
    waitingInvite(context, expired);
    sendMail.mockRejectedValueOnce(new Error('down'));

    await expect(invite(context, 'friend@example.com')).rejects.toThrow(
      "We couldn't send the invite email"
    );
    expect(context.prisma.userInvite.updateMany).toHaveBeenLastCalledWith({
      where: { id: 'old-invite', status: 'pending', expiresAt: expect.any(Date) },
      data: { expiresAt: expired, invitedById: 'first-inviter' },
    });
    expect(context.prisma.user.deleteMany).not.toHaveBeenCalled();
  });

  it('allows 10 invites an hour per member', async () => {
    const context = createContext();
    for (let i = 0; i < 10; i += 1) await invite(context, `p${i}@example.com`);
    await expect(invite(context, 'p10@example.com')).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
    expect(context.prisma.user.create).toHaveBeenCalledTimes(10);
  });

  it('allows 20 unused invites per member', async () => {
    const context = createContext();
    context.prisma.userInvite.count.mockResolvedValue(19);
    await expect(invite(context, 'nineteen@example.com')).resolves.toMatchObject({
      code: 'SUCCESS',
    });

    context.prisma.userInvite.count.mockResolvedValue(20);
    await expect(invite(context, 'twenty@example.com')).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
    expect(context.prisma.userInvite.count).toHaveBeenCalledWith({
      where: { invitedById: inviterId, status: 'pending', expiresAt: { gt: expect.any(Date) } },
    });
    expect(context.prisma.user.create).toHaveBeenCalledTimes(1);
  });
});

describe('sendInvestorMail', () => {
  it('emails the team without creating an account', async () => {
    process.env.TO_INVESTOR_EMAIL = 'team@example.com';
    const context = createContext(null);

    await expect(contact(context, ' Investor@Example.com ')).resolves.toBe(true);

    expect(sendMail).toHaveBeenCalledWith({
      to: 'team@example.com',
      subject: 'New investor contact',
      text: 'New investor contact: investor@example.com',
    });
    expect(context.prisma.user.create).not.toHaveBeenCalled();
  });

  it('refuses an invalid email', async () => {
    await expect(contact(createContext(null), 'nope')).rejects.toThrow(
      'Please enter a valid email address'
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('skips the email when no team address is set', async () => {
    await expect(contact(createContext(null), 'a@example.com')).resolves.toBe(true);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('accepts one submission per address an hour', async () => {
    process.env.TO_INVESTOR_EMAIL = 'team@example.com';
    await contact(createContext(null), 'a@example.com');
    await expect(
      contact(createContext(null, '198.51.100.1'), 'a@example.com')
    ).rejects.toMatchObject({ extensions: { code: 'TOO_MANY_REQUESTS' } });
    expect(sendMail).toHaveBeenCalledTimes(1);
  });

  it('accepts five submissions per visitor an hour', async () => {
    process.env.TO_INVESTOR_EMAIL = 'team@example.com';
    const context = createContext(null);
    for (let i = 0; i < 5; i += 1) await contact(context, `v${i}@example.com`);
    await expect(contact(context, 'v5@example.com')).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
    expect(sendMail).toHaveBeenCalledTimes(5);
  });
});
