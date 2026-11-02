/**
 * Password reset on the new backend (#623): sendPasswordResetEmail, the reset link
 * check in verifyUserPasswordResetToken, and updateUserPassword.
 */

import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import { userResolver } from '~/data/resolvers/userResolver';
import {
  PASSWORD_RESET_TOKEN_TTL_SECONDS,
  generateInviteSignupToken,
  generatePasswordResetToken,
  isPasswordResetTokenCurrent,
  verifyPasswordResetToken,
  verifyToken,
} from '~/data/utils/authentication';
import sendGridEmail from '~/data/utils/send-grid-mail';
import { resetExpiryIndexState } from '~/data/utils/rateLimiter';
import type { GraphQLContext } from '~/types/graphql';
import { createRateLimitStore, type RateLimitStore } from '../../helpers/rateLimitStore';

jest.mock('~/data/utils/send-grid-mail', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({ success: true }),
  SENDGRID_TEMPLATE_IDS: { PASSWORD_RESET: 'tpl-reset' },
}));

jest.mock('~/data/utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const mockSend = sendGridEmail as jest.MockedFunction<typeof sendGridEmail>;

// Same secret authentication.ts read when it was imported.
const SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_fallback_do_not_use_in_prod';

const userId = '507f1f77bcf86cd799439012';
const OLD_HASH = '$2a$10$abcdefghijklmnopqrstuuoldhasholdhasholdhasholdhasho';
const NEW_PASSWORD = 'Newpass123';

const activeUser = {
  id: userId,
  email: 'alice@quotevote.local',
  username: 'alice',
  password: OLD_HASH,
  accountStatus: 'active',
  status: 2,
};

let rateLimits: RateLimitStore;

function mockContext(ip = '203.0.113.7', trustProxy: number | false = false): GraphQLContext {
  return {
    prisma: {
      $runCommandRaw: rateLimits.$runCommandRaw,
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
      },
    },
    req: { ip, app: { get: (name: string) => (name === 'trust proxy' ? trustProxy : undefined) } },
    user: undefined,
  } as unknown as GraphQLContext;
}

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toBeInstanceOf(GraphQLError);
  await promise.catch((err: GraphQLError) => expect(err.extensions.code).toBe(code));
}

const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

describe('password reset (#623)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetExpiryIndexState();
    rateLimits = createRateLimitStore();
  });

  describe('reset tokens', () => {
    it('are reset-only, expire after an hour and carry no password data', () => {
      const token = generatePasswordResetToken(userId, OLD_HASH);
      const payload = verifyPasswordResetToken(token);

      expect(payload).toEqual(expect.objectContaining({ userId, type: 'password_reset' }));
      expect(payload.exp! - payload.iat!).toBe(PASSWORD_RESET_TOKEN_TTL_SECONDS);
      expect(token).not.toContain(OLD_HASH);
      expect(JSON.stringify(payload)).not.toContain(OLD_HASH);
    });

    it('cannot be used as a sign-in session', async () => {
      const token = generatePasswordResetToken(userId, OLD_HASH);
      await expectCode(verifyToken(token), 'UNAUTHENTICATED');
    });

    it('stop matching once the password changes', () => {
      const payload = verifyPasswordResetToken(generatePasswordResetToken(userId, OLD_HASH));
      expect(isPasswordResetTokenCurrent(payload, OLD_HASH)).toBe(true);
      expect(isPasswordResetTokenCurrent(payload, '$2a$10$someothernewhash')).toBe(false);
    });

    it('refuses expired, session and invite tokens', () => {
      const expired = generatePasswordResetToken(userId, OLD_HASH, -10);
      const session = jwt.sign({ userId, username: 'alice', email: 'a@b.c' }, SECRET);
      const invite = generateInviteSignupToken(userId);

      expect(() => verifyPasswordResetToken(expired)).toThrow('Password reset link has expired');
      expect(() => verifyPasswordResetToken(session)).toThrow('Invalid password reset link');
      expect(() => verifyPasswordResetToken(invite)).toThrow('Invalid password reset link');
    });
  });

  describe('Mutation.sendPasswordResetEmail', () => {
    it('rejects an invalid email', async () => {
      await expectCode(
        userResolver.Mutation.sendPasswordResetEmail(null, { email: 'nope' }, mockContext()),
        'BAD_USER_INPUT'
      );
    });

    it('emails a reset link to an active account, matching the email case-insensitively', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(activeUser);

      const result = await userResolver.Mutation.sendPasswordResetEmail(
        null,
        { email: '  ALICE@quotevote.local ' },
        ctx
      );
      await flush();

      expect(result).toBe(true);
      expect(ctx.prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: { equals: 'ALICE@quotevote.local', mode: 'insensitive' } },
        })
      );
      expect(mockSend).toHaveBeenCalledTimes(1);
      const mail = mockSend.mock.calls[0][0];
      expect(mail.to).toBe('alice@quotevote.local');
      expect(mail.templateId).toBe('tpl-reset');

      const url = new URL(String(mail.dynamicTemplateData?.change_password_url));
      expect(url.pathname).toBe('/auths/password-reset');
      expect(url.searchParams.get('username')).toBe('alice');
      const payload = verifyPasswordResetToken(url.searchParams.get('token')!);
      expect(payload.userId).toBe(userId);
      expect(isPasswordResetTokenCurrent(payload, OLD_HASH)).toBe(true);
    });

    it('answers the same for unknown, disabled and unfinished accounts, without sending', async () => {
      const unknown = mockContext();
      const disabled = mockContext();
      (disabled.prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...activeUser,
        accountStatus: 'disabled',
      });
      const noPassword = mockContext();
      (noPassword.prisma.user.findFirst as jest.Mock).mockResolvedValue({
        ...activeUser,
        password: null,
      });

      for (const ctx of [unknown, disabled, noPassword]) {
        await expect(
          userResolver.Mutation.sendPasswordResetEmail(null, { email: 'x@quotevote.local' }, ctx)
        ).resolves.toBe(true);
      }
      await flush();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it('still answers true when the email provider fails', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findFirst as jest.Mock).mockResolvedValue(activeUser);
      mockSend.mockRejectedValueOnce(new Error('SendGrid down'));

      await expect(
        userResolver.Mutation.sendPasswordResetEmail(null, { email: activeUser.email }, ctx)
      ).resolves.toBe(true);
      await flush();
    });

    it('limits requests to 3 an hour per address', async () => {
      const ctx = () => mockContext();
      for (let i = 0; i < 3; i += 1) {
        await userResolver.Mutation.sendPasswordResetEmail(null, { email: 'A@x.io' }, ctx());
      }

      await expectCode(
        userResolver.Mutation.sendPasswordResetEmail(null, { email: 'a@X.io' }, ctx()),
        'TOO_MANY_REQUESTS'
      );
      await expect(
        userResolver.Mutation.sendPasswordResetEmail(null, { email: 'b@x.io' }, ctx())
      ).resolves.toBe(true);
    });

    it('limits requests to 10 an hour per visitor when the proxy is trusted', async () => {
      const ctx = (ip: string) => mockContext(ip, 1);
      for (let i = 0; i < 10; i += 1) {
        await userResolver.Mutation.sendPasswordResetEmail(
          null,
          { email: `user${i}@x.io` },
          ctx('198.51.100.1')
        );
      }

      await expectCode(
        userResolver.Mutation.sendPasswordResetEmail(
          null,
          { email: 'new@x.io' },
          ctx('198.51.100.1')
        ),
        'TOO_MANY_REQUESTS'
      );
      await expect(
        userResolver.Mutation.sendPasswordResetEmail(
          null,
          { email: 'new@x.io' },
          ctx('198.51.100.2')
        )
      ).resolves.toBe(true);
    });

    it('skips the per-visitor limit when the proxy is not trusted', async () => {
      for (let i = 0; i < 11; i += 1) {
        await userResolver.Mutation.sendPasswordResetEmail(
          null,
          { email: `user${i}@x.io` },
          mockContext('10.0.0.1')
        );
      }

      expect(rateLimits.docs.has('ip:10.0.0.1:passwordResetEmail')).toBe(false);
    });
  });

  describe('Mutation.updateUserPassword', () => {
    const withUser = (user: Partial<typeof activeUser> | null = activeUser): GraphQLContext => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      return ctx;
    };

    it("sets the token account's password, updating by id only", async () => {
      const ctx = withUser();
      const token = generatePasswordResetToken(userId, OLD_HASH);

      await expect(
        userResolver.Mutation.updateUserPassword(
          null,
          { username: 'alice', password: NEW_PASSWORD, token },
          ctx
        )
      ).resolves.toBe(true);

      const update = (ctx.prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(update.where).toEqual({ id: userId });
      expect(Object.keys(update.data)).toEqual(['password']);
      // Existing accounts have no createdAt, so nothing beyond the id is read back.
      expect(update.select).toEqual({ id: true });
      expect(await bcrypt.compare(NEW_PASSWORD, update.data.password)).toBe(true);
    });

    it('works without the username argument', async () => {
      const ctx = withUser();
      const token = generatePasswordResetToken(userId, OLD_HASH);

      await expect(
        userResolver.Mutation.updateUserPassword(null, { password: NEW_PASSWORD, token }, ctx)
      ).resolves.toBe(true);
    });

    it('refuses a link that was already used', async () => {
      const token = generatePasswordResetToken(userId, OLD_HASH);
      // After the first reset the stored hash is different.
      const ctx = withUser({ ...activeUser, password: '$2a$10$hashafterthefirstreset' });

      await expectCode(
        userResolver.Mutation.updateUserPassword(null, { password: NEW_PASSWORD, token }, ctx),
        'UNAUTHENTICATED'
      );
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuses a username that is not the token account', async () => {
      const ctx = withUser();
      const token = generatePasswordResetToken(userId, OLD_HASH);

      await expectCode(
        userResolver.Mutation.updateUserPassword(
          null,
          { username: 'admin', password: NEW_PASSWORD, token },
          ctx
        ),
        'UNAUTHENTICATED'
      );
      expect(ctx.prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuses missing, expired, session and invite tokens', async () => {
      const tokens = [
        undefined,
        generatePasswordResetToken(userId, OLD_HASH, -10),
        jwt.sign({ userId, username: 'alice', email: 'a@b.c' }, SECRET),
        generateInviteSignupToken(userId),
      ];
      for (const token of tokens) {
        const ctx = withUser();
        await expectCode(
          userResolver.Mutation.updateUserPassword(null, { password: NEW_PASSWORD, token }, ctx),
          'UNAUTHENTICATED'
        );
        expect(ctx.prisma.user.update).not.toHaveBeenCalled();
      }
    });

    it('refuses disabled and missing accounts', async () => {
      const token = generatePasswordResetToken(userId, OLD_HASH);
      for (const user of [{ ...activeUser, accountStatus: 'disabled' }, null]) {
        const ctx = withUser(user);
        await expectCode(
          userResolver.Mutation.updateUserPassword(null, { password: NEW_PASSWORD, token }, ctx),
          'UNAUTHENTICATED'
        );
      }
    });

    it('refuses a weak password before looking at the token', async () => {
      const token = generatePasswordResetToken(userId, OLD_HASH);
      for (const password of ['short1A', 'alllowercase1', 'NoNumbersHere', 'A1a'.repeat(50)]) {
        const ctx = withUser();
        await expectCode(
          userResolver.Mutation.updateUserPassword(null, { password, token }, ctx),
          'BAD_USER_INPUT'
        );
        expect(ctx.prisma.user.findUnique).not.toHaveBeenCalled();
      }
    });
  });

  describe('Query.verifyUserPasswordResetToken', () => {
    const verify = (token: string, user: Record<string, unknown> | null = activeUser) => {
      const ctx = mockContext();
      (ctx.prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      return userResolver.Query.verifyUserPasswordResetToken(null, { token }, ctx);
    };

    it('returns the id, username and email for a current reset link', async () => {
      await expect(verify(generatePasswordResetToken(userId, OLD_HASH))).resolves.toEqual({
        _id: userId,
        email: 'alice@quotevote.local',
        username: 'alice',
      });
    });

    it('returns null for a used reset link', async () => {
      await expect(
        verify(generatePasswordResetToken(userId, OLD_HASH), {
          ...activeUser,
          password: '$2a$10$hashafterthefirstreset',
        })
      ).resolves.toBeNull();
    });

    it('accepts an invite link until the account is set up', async () => {
      const invite = generateInviteSignupToken(userId);
      const pending = { ...activeUser, password: null, status: 4 };

      await expect(verify(invite, pending)).resolves.toEqual(
        expect.objectContaining({ _id: userId })
      );
      await expect(verify(invite, activeUser)).resolves.toBeNull();
    });

    it('returns null for a session token, an expired link and garbage', async () => {
      const session = jwt.sign({ userId, username: 'alice', email: 'a@b.c' }, SECRET);
      // The session token is valid for signing in, just not as a reset link.
      await expect(verifyToken(session)).resolves.toEqual(expect.objectContaining({ userId }));

      await expect(verify(session)).resolves.toBeNull();
      await expect(verify(generatePasswordResetToken(userId, OLD_HASH, -10))).resolves.toBeNull();
      await expect(verify('not-a-token')).resolves.toBeNull();
      await expect(verify('   ')).resolves.toBeNull();
    });

    it('returns null for a disabled or missing account', async () => {
      const token = generatePasswordResetToken(userId, OLD_HASH);
      await expect(verify(token, { ...activeUser, accountStatus: 'disabled' })).resolves.toBeNull();
      await expect(verify(token, null)).resolves.toBeNull();
    });
  });
});
