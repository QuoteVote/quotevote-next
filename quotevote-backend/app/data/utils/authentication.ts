import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import type { Request, Response } from 'express';
import { logger } from './logger';
import { prisma } from '~/lib/prisma';
import type { JWTPayload, PasswordResetTokenPayload } from '../../types/express';

/**
 * Environment Variables correctly typed via process.env augmentation
 * as per app/types/environment.ts
 */
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('CRITICAL: process.env.JWT_SECRET is not defined. Authentication is insecure.');
    throw new Error('process.env.JWT_SECRET must be defined in production.');
  } else {
    logger.warn(
      'NOTICE: process.env.JWT_SECRET is not defined. Using development fallback secret.'
    );
  }
}

const safeSecret = JWT_SECRET || 'dev_jwt_secret_fallback_do_not_use_in_prod';

/** Limited-purpose JWT for invite-based signup completion only (#573). */
export const INVITE_SIGNUP_TOKEN_TYPE = 'invite_signup' as const;
export const INVITE_SIGNUP_TOKEN_PURPOSE = 'completeSignup' as const;

/** How long a member's invite link stays valid (#672). */
export const MEMBER_INVITE_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface InviteSignupTokenPayload {
  userId: string;
  type: typeof INVITE_SIGNUP_TOKEN_TYPE;
  purpose: typeof INVITE_SIGNUP_TOKEN_PURPOSE;
  /** Set on member invites only: the UserInvite row that decides if the link still works. */
  inviteId?: string;
  /** Set on member invites only: the address the invite was sent to. */
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Issues an invite-signup token, one day by default. Valid only for
 * `completeSignup`, never as a general GraphQL session. Member invites pass
 * `invite`, which binds the token to that invite and its recipient.
 */
export const generateInviteSignupToken = (
  userId: string,
  expiresInSeconds = 60 * 60 * 24,
  invite?: { inviteId: string; email: string }
): string => {
  const payload: InviteSignupTokenPayload = {
    userId,
    type: INVITE_SIGNUP_TOKEN_TYPE,
    purpose: INVITE_SIGNUP_TOKEN_PURPOSE,
    ...(invite ? { inviteId: invite.inviteId, email: invite.email } : {}),
  };
  return jwt.sign(payload, safeSecret, { expiresIn: expiresInSeconds });
};

/**
 * Verifies an invite-signup token and returns its payload.
 * @throws GraphQLError when the token is missing, expired, or wrong type.
 */
export const verifyInviteSignupToken = (rawToken: string): InviteSignupTokenPayload => {
  const token = rawToken.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;
  try {
    const decoded = jwt.verify(token, safeSecret) as InviteSignupTokenPayload;
    if (
      decoded.type !== INVITE_SIGNUP_TOKEN_TYPE ||
      decoded.purpose !== INVITE_SIGNUP_TOKEN_PURPOSE ||
      !decoded.userId ||
      // A member invite token carries both claims or neither.
      Boolean(decoded.inviteId) !== Boolean(decoded.email)
    ) {
      throw new GraphQLError('Invalid invite signup token', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return decoded;
  } catch (err: unknown) {
    if (err instanceof GraphQLError) throw err;
    const error = err as Error;
    if (error.name === 'TokenExpiredError') {
      throw new GraphQLError('Invite signup token has expired', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    throw new GraphQLError('Invalid invite signup token', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
};

/** Limited-purpose JWT for password reset links only (#623). */
export const PASSWORD_RESET_TOKEN_TYPE = 'password_reset' as const;

/** Reset links expire after one hour. */
export const PASSWORD_RESET_TOKEN_TTL_SECONDS = 60 * 60;

/**
 * Keyed fingerprint of a stored password hash. Embedding it in the reset token makes
 * the link single-use: setting a new password changes the hash, so the old link fails.
 * The HMAC keeps the hash itself out of the token.
 */
export const passwordFingerprint = (passwordHash: string | null | undefined): string =>
  crypto
    .createHmac('sha256', safeSecret)
    .update(passwordHash ?? '')
    .digest('base64url')
    .slice(0, 22);

/**
 * Issues a one-hour password reset token for the account's current password hash.
 * Valid only for the reset flow, never as a GraphQL session.
 */
export const generatePasswordResetToken = (
  userId: string,
  passwordHash: string | null | undefined,
  expiresInSeconds = PASSWORD_RESET_TOKEN_TTL_SECONDS
): string => {
  const payload: PasswordResetTokenPayload = {
    userId,
    type: PASSWORD_RESET_TOKEN_TYPE,
    pwd: passwordFingerprint(passwordHash),
  };
  return jwt.sign(payload, safeSecret, { expiresIn: expiresInSeconds });
};

/**
 * Verifies a password reset token's signature, expiry and type. Callers must still
 * check `pwd` against the account's current hash with `isPasswordResetTokenCurrent`.
 * @throws GraphQLError when the token is missing, expired, or of another type.
 */
export const verifyPasswordResetToken = (rawToken: string): PasswordResetTokenPayload => {
  const token = rawToken.startsWith('Bearer ') ? rawToken.substring(7) : rawToken;
  try {
    const decoded = jwt.verify(token, safeSecret) as PasswordResetTokenPayload;
    if (decoded.type !== PASSWORD_RESET_TOKEN_TYPE || !decoded.userId || !decoded.pwd) {
      throw new GraphQLError('Invalid password reset link', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return decoded;
  } catch (err: unknown) {
    if (err instanceof GraphQLError) throw err;
    const error = err as Error;
    if (error.name === 'TokenExpiredError') {
      throw new GraphQLError('Password reset link has expired', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    throw new GraphQLError('Invalid password reset link', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
};

/** True while the account's password is still the one the token was issued against. */
export const isPasswordResetTokenCurrent = (
  payload: PasswordResetTokenPayload,
  passwordHash: string | null | undefined
): boolean => {
  const expected = Buffer.from(passwordFingerprint(passwordHash));
  const actual = Buffer.from(payload.pwd);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

/**
 * Direct registration is closed: membership is invitation-only, so accounts are only
 * activated by the completeSignup mutation after an admin approves a request.
 */
export const register = (_req: Request, res: Response): void => {
  res.status(403).json({
    error_message: 'Quote.Vote is invitation-only. Request access to join.',
  });
};

/**
 * Generates a bcrypt hash for a given password.
 * @param password The plain-text password.
 * @returns A promise that resolves to the hashed password.
 */
export const generateHashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const invalidUserPassword = (res: Response) => {
  return res.status(401).json({ message: 'Invalid username or password.' });
};

interface AddCreatorToUserParams {
  username: string;
  password?: string;
  requirePassword?: boolean;
}

/**
 * Internal helper to generate a JWT token and handle user authentication response.
 * @param params Authentication parameters including username and password.
 * @param res Express response object.
 * @param authenticate Whether to return only the tokens or the full user object.
 * @param expiresIn Access token expiration time in seconds (default 15m).
 * @param tokenOnly If true, returns only the access token string.
 * @returns A promise that resolves to the response or token string.
 */
export const addCreatorToUser = async (
  { username, password, requirePassword }: AddCreatorToUserParams,
  res: Response,
  authenticate: boolean,
  expiresIn: number = 60 * 15, // Default 15 minutes for access token
  tokenOnly: boolean = false
): Promise<Response | string | void> => {
  const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(username);
  const user = await prisma.user.findFirst({
    where: isEmail ? { email: username } : { username },
    select: {
      id: true,
      password: true,
      email: true,
      username: true,
      isAdmin: true,
      accountStatus: true,
      name: true,
      avatar: true,
      bio: true,
    },
  });

  if (!user) {
    return invalidUserPassword(res);
  }

  // Check if account is disabled
  if (user.accountStatus === 'disabled') {
    return res.status(403).json({
      message:
        'Your account has been flagged as a bot and temporarily disabled. If you believe this is a mistake, please email admin@quote.vote to appeal.',
      accountDisabled: true,
    });
  }

  if (requirePassword) {
    if (!password) return invalidUserPassword(res);
    // Prisma doesn't have instance methods, use bcrypt.compare directly
    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) return invalidUserPassword(res);
  }

  const payload: JWTPayload = {
    email: user.email,
    username: user.username,
    userId: user.id,
    admin: user.isAdmin,
  };

  const accessToken = jwt.sign(payload, safeSecret, { expiresIn });
  const refreshToken = generateRefreshToken(payload);

  if (tokenOnly) {
    return accessToken;
  }

  if (authenticate) {
    return res.json({
      accessToken,
      refreshToken,
    });
  }

  return res.json({
    accessToken,
    refreshToken,
    user: {
      _id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      admin: user.isAdmin,
      accountStatus: user.accountStatus,
      avatar: user.avatar ?? null,
      bio: user.bio ?? '',
    },
  });
};

/**
 * Handles user login and returns a JWT token.
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to the response.
 */
export const login = async (req: Request, res: Response): Promise<Response | void> => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  return addCreatorToUser(
    { username, password, requirePassword: true },
    res,
    false
  ) as Promise<Response | void>;
};

/**
 * Authenticates a user and returns a JWT token (strict mode).
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to the response.
 */
export const authenticate = async (req: Request, res: Response): Promise<Response | void> => {
  logger.info('Performing strict authentication', { username: req.body.username });
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required.' });
  }
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  return addCreatorToUser(
    { username, password, requirePassword: true },
    res,
    true
  ) as Promise<Response | void>;
};

/**
 * Generates a long-lived refresh token.
 * @param payload The JWT payload.
 * @returns The signed refresh token.
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  // Refresh tokens typically don't have sensitive info beyond ID
  const refreshPayload = {
    userId: payload.userId,
    type: 'refresh',
  };
  return jwt.sign(refreshPayload, safeSecret, { expiresIn: '7d' });
};

/**
 * Endpoint handler to issue a new access token using a refresh token.
 * @param req Express request object.
 * @param res Express response object.
 * @returns A promise that resolves to the response.
 */
export const refresh = async (req: Request, res: Response): Promise<Response | void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, safeSecret) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token type.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        isAdmin: true,
        accountStatus: true,
      },
    });
    if (!user || user.accountStatus === 'disabled') {
      return res.status(401).json({ message: 'User not found or account disabled.' });
    }

    const payload: JWTPayload = {
      email: user.email,
      username: user.username,
      userId: user.id,
      admin: user.isAdmin,
    };

    const accessToken = jwt.sign(payload, safeSecret, { expiresIn: '15m' });

    return res.json({
      accessToken,
      refreshToken, // Sending same or could rotate
    });
  } catch {
    // Log error if needed, or just suppress
    return res.status(401).json({ message: 'Invalid or expired refresh token.' });
  }
};

/**
 * Verifies a JWT token and returns the decoded payload.
 * Throws GraphQLError if verification fails, suitable for GraphQL context usage.
 * @param authToken Raw authorization header or token string.
 * @returns Decoded JWT payload.
 * @throws GraphQLError if token is invalid or expired.
 */
export const verifyToken = async (authToken: string): Promise<JWTPayload> => {
  // Remove 'Bearer ' prefix if present
  const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;

  try {
    const decoded = jwt.verify(token, safeSecret) as JWTPayload & {
      type?: string;
      purpose?: string;
    };
    // Invite-signup, password reset and refresh tokens must not authorize general GraphQL sessions.
    if (
      decoded.type === INVITE_SIGNUP_TOKEN_TYPE ||
      decoded.type === PASSWORD_RESET_TOKEN_TYPE ||
      decoded.type === 'refresh' ||
      decoded.purpose === INVITE_SIGNUP_TOKEN_PURPOSE
    ) {
      throw new GraphQLError('Token issued cannot be used in this endpoint.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    return decoded;
  } catch (err: unknown) {
    if (err instanceof GraphQLError) {
      throw err;
    }

    const error = err as Error;
    logger.error('Token verification failed', { error: error.message });

    if (error.message === 'invalid issuer') {
      throw new GraphQLError('Token issued cannot be used in this endpoint.', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    if (error.name === 'JsonWebTokenError' || error.message === 'invalid signature') {
      throw new GraphQLError(`Invalid access token: ${error.message}`, {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    } else if (error.name === 'TokenExpiredError') {
      throw new GraphQLError('Access token has expired', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    throw new GraphQLError('Authentication failed', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
};
