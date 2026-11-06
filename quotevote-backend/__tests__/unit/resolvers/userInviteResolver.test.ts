process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { userInviteResolver } from '~/data/resolvers/userInviteResolver';
import * as auth from '~/data/utils/authentication';
import { CURRENT_TERMS_VERSION } from '~/data/utils/termsPolicy';
import type { GraphQLContext } from '~/types/graphql';

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
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const userId = '507f1f77bcf86cd799439011';

function mockContext(overrides: Partial<GraphQLContext> = {}): GraphQLContext {
  return {
    prisma: {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    },
    user: { _id: userId, admin: true },
    ...overrides,
  } as unknown as GraphQLContext;
}

describe('userInviteResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('completeSignup', () => {
    it('rejects missing or stale Terms version', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);

      await expect(
        userInviteResolver.Mutation.completeSignup(
          null,
          {
            token,
            username: 'newuser',
            password: 'Password1',
            acceptedTermsVersion: 'stale',
          },
          ctx
        )
      ).rejects.toThrow(GraphQLError);
    });

    it('rejects when invite user already has a password', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        password: 'already-set',
        status: 4,
        accountStatus: 'active',
        email: 'a@b.com',
      });

      await expect(
        userInviteResolver.Mutation.completeSignup(
          null,
          {
            token,
            username: 'newuser',
            password: 'Password1',
            acceptedTermsVersion: CURRENT_TERMS_VERSION,
          },
          ctx
        )
      ).rejects.toThrow(/already been completed/);
    });

    it('rejects when invite status is not approved (4)', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        password: null,
        status: 1,
        accountStatus: 'active',
        email: 'a@b.com',
      });

      await expect(
        userInviteResolver.Mutation.completeSignup(
          null,
          {
            token,
            username: 'newuser',
            password: 'Password1',
            acceptedTermsVersion: CURRENT_TERMS_VERSION,
          },
          ctx
        )
      ).rejects.toThrow(/not approved/);
    });

    it('creates user password and TermsAcceptance atomically', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        password: null,
        status: 4,
        accountStatus: 'active',
        email: 'invitee@example.com',
      });
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        username: 'newuser',
        name: null,
        accountStatus: 'active',
      });

      const result = await userInviteResolver.Mutation.completeSignup(
        null,
        {
          token,
          username: 'newuser',
          password: 'Password1',
          acceptedTermsVersion: CURRENT_TERMS_VERSION,
        },
        ctx
      );

      expect(ctx.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: expect.objectContaining({
            username: 'newuser',
            accountStatus: 'active',
            termsAcceptances: {
              create: expect.objectContaining({
                termsVersion: CURRENT_TERMS_VERSION,
                source: 'invite_completion',
              }),
            },
          }),
        })
      );
      expect(result).toMatchObject({ _id: userId, username: 'newuser' });
    });

    it('rejects when TermsAcceptance write fails (unique constraint)', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        password: null,
        status: 4,
        accountStatus: 'active',
        email: 'invitee@example.com',
      });
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.user.update as jest.Mock).mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
          meta: { target: ['userId', 'termsVersion'] },
        })
      );

      await expect(
        userInviteResolver.Mutation.completeSignup(
          null,
          {
            token,
            username: 'newuser',
            password: 'Password1',
            acceptedTermsVersion: CURRENT_TERMS_VERSION,
          },
          ctx
        )
      ).rejects.toThrow(/Username already exists or terms already accepted/);
    });

    it('rejects a forged session-style token without invite type', async () => {
      const ctx = mockContext();
      await expect(
        userInviteResolver.Mutation.completeSignup(
          null,
          {
            token: 'not-a-valid-token',
            username: 'newuser',
            password: 'Password1',
            acceptedTermsVersion: CURRENT_TERMS_VERSION,
          },
          ctx
        )
      ).rejects.toThrow(/Invalid invite signup token/);
    });
  });

  describe('verifyInviteSignupToken', () => {
    it('returns user info for a valid unused invite token', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'invitee@example.com',
        username: 'invitee@example.com',
        password: null,
        status: 4,
        accountStatus: 'active',
      });

      const result = await userInviteResolver.Query.verifyInviteSignupToken(null, { token }, ctx);

      expect(result).toEqual({
        _id: userId,
        email: 'invitee@example.com',
        username: 'invitee@example.com',
      });
    });

    it('returns null when signup was already completed', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'invitee@example.com',
        username: 'done',
        password: 'hashed',
        status: 4,
        accountStatus: 'active',
      });

      const result = await userInviteResolver.Query.verifyInviteSignupToken(null, { token }, ctx);

      expect(result).toBeNull();
    });

    it('returns null when invite was not approved', async () => {
      const ctx = mockContext();
      const token = auth.generateInviteSignupToken(userId);
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'invitee@example.com',
        username: 'invitee@example.com',
        password: null,
        status: 1,
        accountStatus: 'active',
      });

      const result = await userInviteResolver.Query.verifyInviteSignupToken(null, { token }, ctx);

      expect(result).toBeNull();
    });
  });

  describe('requestUserAccess', () => {
    it('creates a requested invite (status 1) without password', async () => {
      const ctx = mockContext({ user: null });
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (ctx.prisma.user.create as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'new@example.com',
        username: 'new@example.com',
        status: 1,
        accountStatus: 'active',
        password: null,
      });

      const result = await userInviteResolver.Mutation.requestUserAccess(
        null,
        { requestUserAccessInput: { email: 'new@example.com' } },
        ctx
      );

      expect(ctx.prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            status: 1,
            password: null,
          }),
        })
      );
      expect(result._id).toBe(userId);
    });

    it('re-opens a declined invite to status 1', async () => {
      const ctx = mockContext({ user: null });
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'declined@example.com',
        username: 'declined@example.com',
        status: 2,
        accountStatus: 'active',
        password: null,
      });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'declined@example.com',
        username: 'declined@example.com',
        status: 1,
        accountStatus: 'active',
        password: null,
      });

      await userInviteResolver.Mutation.requestUserAccess(
        null,
        { requestUserAccessInput: { email: 'declined@example.com' } },
        ctx
      );

      expect(ctx.prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: userId },
          data: { status: 1 },
        })
      );
    });

    it('does not reset an approved invite (status 4) back to requested', async () => {
      const ctx = mockContext({ user: null });
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'approved@example.com',
        username: 'approved@example.com',
        status: 4,
        accountStatus: 'active',
        password: null,
      });

      const result = await userInviteResolver.Mutation.requestUserAccess(
        null,
        { requestUserAccessInput: { email: 'approved@example.com' } },
        ctx
      );

      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
      expect(result._id).toBe(userId);
    });
  });

  describe('sendUserInviteApproval', () => {
    it('sets status 4 on approve', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'invitee@example.com',
        username: 'invitee@example.com',
        password: null,
        status: 1,
      });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await userInviteResolver.Mutation.sendUserInviteApproval(
        null,
        { userId, inviteStatus: '4' },
        ctx
      );

      // Selecting only id keeps Prisma from reading back legacy accounts with no createdAt.
      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: 4 },
        select: { id: true },
      });
      expect(result.code).toBe('SUCCESS');
      expect(result.inviteToken).toBeDefined();
    });

    it('sets status 2 on decline without disabling the account', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: userId,
        email: 'invitee@example.com',
        username: 'invitee@example.com',
        password: null,
        status: 1,
      });
      (ctx.prisma.user.update as jest.Mock).mockResolvedValue({});

      const result = await userInviteResolver.Mutation.sendUserInviteApproval(
        null,
        { userId, inviteStatus: '2' },
        ctx
      );

      // Selecting only id keeps Prisma from reading back legacy accounts with no createdAt.
      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { status: 2 },
        select: { id: true },
      });
      expect(result.message).toMatch(/declined/);
    });
  });
});
