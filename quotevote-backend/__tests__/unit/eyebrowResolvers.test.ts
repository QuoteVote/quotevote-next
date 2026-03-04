/**
 * Unit tests for Eyebrow resolvers (checkEmailStatus + sendMagicLink)
 */

// Mock dependencies before imports
jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('~/data/utils/send-grid-mail', () => {
  const actual = jest.requireActual('~/data/utils/send-grid-mail');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn().mockResolvedValue({ success: true, message: 'Email sent successfully' }),
  };
});

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
}));

jest.mock('~/data/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

jest.mock('~/data/models/UserInvite', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
  },
}));

import User from '~/data/models/User';
import UserInvite from '~/data/models/UserInvite';
import sendGridEmail from '~/data/utils/send-grid-mail';
import * as jwt from 'jsonwebtoken';

// Resolver functions extracted to match server.ts inline resolver logic
const checkEmailStatus = async (_parent: unknown, args: { email: string }) => {
  const email = args.email.toLowerCase().trim();

  const user = await User.findOne({ email });
  if (user && (user as unknown as { password: string }).password) {
    return { status: 'registered' };
  }

  const invite = await UserInvite.findOne({ email });
  if (!invite) {
    return { status: 'not_requested' };
  }

  if ((invite as unknown as { status: string }).status === 'pending') {
    return { status: 'requested_pending' };
  }

  if ((invite as unknown as { status: string }).status === 'accepted') {
    return { status: 'approved_no_password' };
  }

  return { status: 'not_requested' };
};

const sendMagicLink = async (_parent: unknown, args: { email: string }) => {
  const email = args.email.toLowerCase().trim();
  const user = await User.findOne({ email });

  if (!user) {
    return true;
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_fallback_do_not_use_in_prod';
  const typedUser = user as unknown as { _id: { toString: () => string }; name: string; username: string };
  const token = jwt.sign(
    { userId: typedUser._id.toString(), email, purpose: 'magic_link' },
    jwtSecret,
    { expiresIn: '15m' }
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const magicLinkUrl = `${frontendUrl}/auth/magic-link?token=${token}`;

  await sendGridEmail({
    to: email,
    templateId: 'PLACEHOLDER_MAGIC_LOGIN_LINK_TEMPLATE_ID',
    dynamicTemplateData: {
      magicLinkUrl,
      userName: typedUser.name || typedUser.username,
    },
  });

  return true;
};

describe('Eyebrow Resolvers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      FRONTEND_URL: 'http://localhost:3000',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('checkEmailStatus', () => {
    it('should return "registered" when user exists with password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user-id-123',
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
      });

      const result = await checkEmailStatus(null, { email: 'test@example.com' });

      expect(result).toEqual({ status: 'registered' });
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return "not_requested" when no user and no invite exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (UserInvite.findOne as jest.Mock).mockResolvedValue(null);

      const result = await checkEmailStatus(null, { email: 'new@example.com' });

      expect(result).toEqual({ status: 'not_requested' });
      expect(User.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(UserInvite.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
    });

    it('should return "requested_pending" when invite exists with pending status', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (UserInvite.findOne as jest.Mock).mockResolvedValue({
        _id: 'invite-id-123',
        email: 'pending@example.com',
        status: 'pending',
      });

      const result = await checkEmailStatus(null, { email: 'pending@example.com' });

      expect(result).toEqual({ status: 'requested_pending' });
    });

    it('should return "approved_no_password" when invite is accepted but no user with password', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (UserInvite.findOne as jest.Mock).mockResolvedValue({
        _id: 'invite-id-456',
        email: 'approved@example.com',
        status: 'accepted',
      });

      const result = await checkEmailStatus(null, { email: 'approved@example.com' });

      expect(result).toEqual({ status: 'approved_no_password' });
    });

    it('should return "not_requested" when invite has declined status', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (UserInvite.findOne as jest.Mock).mockResolvedValue({
        _id: 'invite-id-789',
        email: 'declined@example.com',
        status: 'declined',
      });

      const result = await checkEmailStatus(null, { email: 'declined@example.com' });

      expect(result).toEqual({ status: 'not_requested' });
    });

    it('should normalize email to lowercase and trim', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);
      (UserInvite.findOne as jest.Mock).mockResolvedValue(null);

      await checkEmailStatus(null, { email: '  Test@Example.COM  ' });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(UserInvite.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should return "registered" even when invite also exists', async () => {
      (User.findOne as jest.Mock).mockResolvedValue({
        _id: 'user-id-123',
        email: 'both@example.com',
        password: '$2a$10$hashedpassword',
      });

      const result = await checkEmailStatus(null, { email: 'both@example.com' });

      expect(result).toEqual({ status: 'registered' });
      // Should not check invites when user with password exists
      expect(UserInvite.findOne).not.toHaveBeenCalled();
    });
  });

  describe('sendMagicLink', () => {
    it('should send magic link email when user exists', async () => {
      const mockUser = {
        _id: { toString: () => 'user-id-123' },
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      const result = await sendMagicLink(null, { email: 'test@example.com' });

      expect(result).toBe(true);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-id-123', email: 'test@example.com', purpose: 'magic_link' },
        'test-secret',
        { expiresIn: '15m' }
      );
      expect(sendGridEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          templateId: 'PLACEHOLDER_MAGIC_LOGIN_LINK_TEMPLATE_ID',
          dynamicTemplateData: expect.objectContaining({
            userName: 'Test User',
            magicLinkUrl: expect.stringContaining('mock-jwt-token'),
          }),
        })
      );
    });

    it('should return true without sending email when user does not exist', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await sendMagicLink(null, { email: 'nonexistent@example.com' });

      expect(result).toBe(true);
      expect(sendGridEmail).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it('should use username when name is not available', async () => {
      const mockUser = {
        _id: { toString: () => 'user-id-123' },
        email: 'test@example.com',
        name: '',
        username: 'testuser',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await sendMagicLink(null, { email: 'test@example.com' });

      expect(sendGridEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamicTemplateData: expect.objectContaining({
            userName: 'testuser',
          }),
        })
      );
    });

    it('should normalize email to lowercase and trim', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      await sendMagicLink(null, { email: '  Test@Example.COM  ' });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('should use fallback JWT secret when JWT_SECRET is not set', async () => {
      delete process.env.JWT_SECRET;
      const mockUser = {
        _id: { toString: () => 'user-id-123' },
        email: 'test@example.com',
        name: 'Test',
        username: 'test',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await sendMagicLink(null, { email: 'test@example.com' });

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'dev_jwt_secret_fallback_do_not_use_in_prod',
        expect.any(Object)
      );
    });

    it('should construct magic link URL with frontend URL', async () => {
      process.env.FRONTEND_URL = 'https://quote.vote';
      const mockUser = {
        _id: { toString: () => 'user-id-123' },
        email: 'test@example.com',
        name: 'Test',
        username: 'test',
      };
      (User.findOne as jest.Mock).mockResolvedValue(mockUser);

      await sendMagicLink(null, { email: 'test@example.com' });

      expect(sendGridEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          dynamicTemplateData: expect.objectContaining({
            magicLinkUrl: expect.stringContaining('https://quote.vote/auth/magic-link'),
          }),
        })
      );
    });
  });
});
