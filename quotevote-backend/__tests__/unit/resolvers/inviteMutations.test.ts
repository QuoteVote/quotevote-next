process.env.JWT_SECRET = 'test_secret';

import { Prisma } from '@prisma/client';
import sendGridEmail from '~/data/utils/send-grid-mail';
import { userInviteResolver } from '~/data/resolvers/userInviteResolver';
import { rateLimitMap } from '~/data/utils/rateLimiter';

jest.mock('~/data/utils/send-grid-mail', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ success: true }),
  SENDGRID_TEMPLATE_IDS: { INVITE_REQUEST_RECEIVED_CONFIRMATION: 'tpl-confirm' },
}));

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const inviterId = '507f1f77bcf86cd799439011';
const sendMail = sendGridEmail as jest.Mock;

const createContext = (userId: string | null = inviterId, ip = '203.0.113.7') => ({
  userId,
  user: userId ? { _id: userId } : null,
  req: { ip },
  prisma: {
    user: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'new-user' }),
    },
    userInvite: {
      findRaw: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: 'invite' }),
    },
  },
});

type Context = ReturnType<typeof createContext>;

const invite = (context: Context, email: string) =>
  userInviteResolver.Mutation.sendUserInvite(null, { email }, context as never);

const contact = (context: Context, email: string) =>
  userInviteResolver.Mutation.sendInvestorMail(null, { email }, context as never);

beforeEach(() => {
  jest.clearAllMocks();
  rateLimitMap.clear();
  delete process.env.TO_INVESTOR_EMAIL;
});

describe('sendUserInvite', () => {
  it('requires a signed-in member', async () => {
    await expect(invite(createContext(null), 'new@example.com')).rejects.toThrow(
      'Authentication required'
    );
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

  it('adds the invitee to the access requests and records the inviter', async () => {
    const context = createContext();

    await expect(invite(context, ' New@Example.com ')).resolves.toEqual({
      code: 'SUCCESS',
      message: 'Invitation sent successfully',
    });

    expect(context.prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'new@example.com', username: 'new@example.com', status: 1, password: null },
      select: { id: true },
    });
    expect(context.prisma.userInvite.create).toHaveBeenCalledWith({
      data: { email: 'new@example.com', invitedById: inviterId, status: 'pending' },
      select: { id: true },
    });
    expect(sendMail).toHaveBeenCalledWith({ to: 'new@example.com', templateId: 'tpl-confirm' });
  });

  it('refuses an email that already has an account or a request', async () => {
    const context = createContext();
    context.prisma.user.findFirst.mockResolvedValue({ id: 'someone' });

    await expect(invite(context, 'taken@example.com')).rejects.toThrow(
      'User with this email already exists'
    );
    expect(context.prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: 'taken@example.com' },
      select: { id: true },
    });
    expect(context.prisma.userInvite.create).not.toHaveBeenCalled();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('refuses a second invite from the same member, under either field name', async () => {
    const context = createContext();
    context.prisma.userInvite.findRaw.mockResolvedValue([{ _id: { $oid: 'old' } }]);

    await expect(invite(context, 'again@example.com')).rejects.toThrow(
      'Invite already sent to this email'
    );
    expect(context.prisma.userInvite.findRaw).toHaveBeenCalledWith({
      filter: {
        email: 'again@example.com',
        $or: [{ _inviterId: { $oid: inviterId } }, { invitedBy: { $oid: inviterId } }],
      },
      options: { limit: 1, projection: { _id: 1 } },
    });
    expect(context.prisma.user.create).not.toHaveBeenCalled();
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

  it('still succeeds when the email fails to send', async () => {
    const context = createContext();
    sendMail.mockRejectedValueOnce(new Error('no mail in dev'));

    await expect(invite(context, 'quiet@example.com')).resolves.toMatchObject({
      code: 'SUCCESS',
    });
  });

  it('allows 10 invites an hour per member', async () => {
    const context = createContext();
    for (let i = 0; i < 10; i += 1) await invite(context, `p${i}@example.com`);
    await expect(invite(context, 'p10@example.com')).rejects.toMatchObject({
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
    expect(context.prisma.user.create).toHaveBeenCalledTimes(10);
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
