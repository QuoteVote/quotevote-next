import * as bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { Prisma, ReportStatus } from '@prisma/client';
import type { ReportReason, ReportSeverity } from '@prisma/client';
import { normalizeBio } from '../utils/bioValidation';
import { toIsoDateString } from '~/data/utils/serializeDate';
import {
  generateHashPassword,
  generatePasswordResetToken,
  isPasswordResetTokenCurrent,
  verifyInviteSignupToken,
  verifyPasswordResetToken,
} from '~/data/utils/authentication';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import sendGridEmail, { SENDGRID_TEMPLATE_IDS } from '~/data/utils/send-grid-mail';
import { logger } from '~/data/utils/logger';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import { uniqueArrayObjects } from '~/data/resolvers/utils/common';
import { loadUserReputation } from '~/data/resolvers/utils/reputation';
import type * as Common from '~/types/common';
import type { FollowInfoEntry, GraphQLContext } from '~/types/graphql';

/** Legacy invite codes: 1 = requested, 4 = approved (not yet signed up). */
const UNFINISHED_INVITE_STATUSES = new Set([1, 4]);

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

const USER_REPORTS_LIMIT = 100;
const SEARCH_USER_LIMIT = 10;

const FOLLOW_INFO_USER_SELECT = {
  id: true,
  username: true,
  avatar: true,
  followingIds: true,
  followerIds: true,
  accountStatus: true,
} as const satisfies Prisma.UserSelect;

/**
 * Accounts created before `accountStatus` existed don't have the field, and a Prisma
 * `accountStatus: 'active'` filter leaves them out. Prisma reads the missing field as
 * the default ('active'), so check it in code instead.
 */
function isDisabled(user: { accountStatus?: string | null }): boolean {
  return user.accountStatus === 'disabled';
}

function isReportStatus(value: string): value is ReportStatus {
  return (Object.values(ReportStatus) as string[]).includes(value);
}

type UserReportResult = {
  _id: string;
  _reporterId: string;
  _reportedUserId: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  severity: ReportSeverity;
  adminNotes: string | null;
  reporter: Common.User | null;
  reportedUser: Common.User | null;
  createdAt: string;
  updatedAt: string;
};

const BOT_REPORTED_USERS_DEFAULT_LIMIT = 100;
const BOT_REPORTED_USERS_MAX_LIMIT = 500;

/** Admin user list paging, same caps as legacy `getUsers`. */
const USERS_DEFAULT_LIMIT = 50;
const USERS_MAX_LIMIT = 100;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Legacy invite code for an access request that hasn't been decided yet. */
const INVITE_STATUS_REQUESTED = 1;
/** Legacy invite code for an approved invite whose account isn't set up yet. */
const INVITE_STATUS_APPROVED = 4;

/** Reset email requests allowed per email address, and per visitor, in each window. */
const RESET_EMAIL_LIMIT_PER_EMAIL = 3;
const RESET_EMAIL_LIMIT_PER_IP = 10;
const RESET_EMAIL_WINDOW_MS = 60 * 60 * 1000;

/** Same rule as the reset page: 8+ characters with upper, lower and a digit. */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

const INVALID_RESET_LINK = 'This password reset link is invalid or has already been used.';

function invalidResetLink(): GraphQLError {
  return new GraphQLError(INVALID_RESET_LINK, { extensions: { code: 'UNAUTHENTICATED' } });
}

/** Applies a rate limit, turning the limiter's error into a GraphQL error. */
async function enforceRateLimit(
  prisma: GraphQLContext['prisma'],
  key: string,
  action: string,
  limit: number,
  windowMs: number
): Promise<void> {
  try {
    await checkRateLimit(prisma, key, action, limit, windowMs);
  } catch {
    throw new GraphQLError('Too many requests. Please try again later.', {
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
  }
}

// Same fields legacy's getBotReportedUsers selected, plus contributorBadge
// because the admin bot list asks for it.
const BOT_REPORTED_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  email: true,
  botReports: true,
  accountStatus: true,
  lastBotReportDate: true,
  joined: true,
  avatar: true,
  contributorBadge: true,
} as const satisfies Prisma.UserSelect;

const BOT_REPORT_ORDER: Record<
  'botReports' | 'lastReportDate',
  Prisma.UserOrderByWithRelationInput[]
> = {
  botReports: [{ botReports: 'desc' }, { lastBotReportDate: 'desc' }],
  lastReportDate: [{ lastBotReportDate: 'desc' }, { botReports: 'desc' }],
};

type BotReportSortBy = keyof typeof BOT_REPORT_ORDER;

function isBotReportSortBy(value: string): value is BotReportSortBy {
  return Object.prototype.hasOwnProperty.call(BOT_REPORT_ORDER, value);
}

type UpdateUserInput = {
  _id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  password?: string | null;
  avatar?: string | null;
  bio?: string | null;
  contributorBadge?: boolean | null;
};

export const userResolver = {
  Query: {
    user: async (
      _parent: unknown,
      args: { username: string },
      context: GraphQLContext
    ): Promise<Common.User | null> => {
      // `user` is a public (unauthenticated) query — select only public-profile
      // fields so this can't be used to harvest email addresses or other
      // sensitive data, and match searchUser's active-account filter.
      const user = await context.prisma.user.findFirst({
        where: { username: args.username?.trim() },
        select: { ...PUBLIC_USER_SELECT, accountStatus: true },
      });

      if (!user || isDisabled(user)) return null;
      return toPublicUser(user as PrismaUserRecord);
    },

    searchUser: async (
      _parent: unknown,
      args: { queryName: string },
      context: GraphQLContext
    ): Promise<Common.User[]> => {
      const queryName = args.queryName?.trim();
      if (!queryName) {
        return [];
      }

      // Prisma's contains + mode: 'insensitive' is safe from injection —
      // the string is parameterized, never interpreted as a pattern.
      // This replaces the old Mongoose regex-escape approach.
      const users = await context.prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: queryName, mode: 'insensitive' } },
            { username: { contains: queryName, mode: 'insensitive' } },
          ],
        },
        select: { ...PUBLIC_USER_SELECT, accountStatus: true },
        // Disabled accounts are dropped below, so read a few extra.
        take: SEARCH_USER_LIMIT * 2,
      });

      return users
        .filter((u) => !isDisabled(u))
        .slice(0, SEARCH_USER_LIMIT)
        .map((u) => toPublicUser(u as PrismaUserRecord));
    },

    getUserFollowInfo: async (
      _parent: unknown,
      args: { username: string; filter?: string | null },
      context: GraphQLContext
    ): Promise<FollowInfoEntry[]> => {
      const username = args.username?.trim();
      if (!username) return [];

      const profile = await context.prisma.user.findFirst({
        where: { username },
        select: { followingIds: true, followerIds: true, accountStatus: true },
      });
      if (!profile || isDisabled(profile)) return [];

      // Legacy follow arrays can hold the same id more than once.
      const ids = uniqueArrayObjects(
        args.filter === 'following' ? profile.followingIds : profile.followerIds
      );
      if (ids.length === 0) return [];

      const users = await context.prisma.user.findMany({
        where: { id: { in: ids } },
        select: FOLLOW_INFO_USER_SELECT,
      });
      const usersById = new Map(users.filter((u) => !isDisabled(u)).map((u) => [u.id, u]));
      const profileFollowing = new Set(profile.followingIds);

      return ids.flatMap((id) => {
        const user = usersById.get(id);
        if (!user) return [];
        return [
          {
            id: user.id,
            username: user.username,
            avatar: user.avatar,
            numFollowers: uniqueArrayObjects(user.followerIds).length,
            numFollowing: uniqueArrayObjects(user.followingIds).length,
            profileFollows: profileFollowing.has(user.id),
          },
        ];
      });
    },
    getUserReports: async (
      _parent: unknown,
      args: { userId: string; status?: string | null },
      context: GraphQLContext
    ): Promise<UserReportResult[]> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      if (context.user?.admin !== true) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      if (!isObjectId(args.userId)) {
        throw new GraphQLError('Invalid ID format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      if (args.status && !isReportStatus(args.status)) {
        throw new GraphQLError('Invalid report status', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const reports = await context.prisma.userReport.findMany({
        where: {
          reportedUserId: args.userId,
          ...(args.status && isReportStatus(args.status) ? { status: args.status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: USER_REPORTS_LIMIT,
      });

      // Loaded separately so a report whose account no longer exists
      // resolves to null instead of failing the whole list.
      const userIds = [...new Set(reports.flatMap((r) => [r.reporterId, r.reportedUserId]))];
      const users = userIds.length
        ? await context.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: PUBLIC_USER_SELECT,
          })
        : [];
      const usersById = new Map(users.map((u) => [u.id, toPublicUser(u as PrismaUserRecord)]));

      return reports.map((report) => {
        const createdAt = report.createdAt ?? report.created ?? undefined;
        return {
          _id: report.id,
          _reporterId: report.reporterId,
          _reportedUserId: report.reportedUserId,
          reason: report.reason,
          description: report.description,
          status: report.status,
          severity: report.severity,
          adminNotes: report.adminNotes,
          reporter: usersById.get(report.reporterId) ?? null,
          reportedUser: usersById.get(report.reportedUserId) ?? null,
          createdAt: toIsoDateString(createdAt),
          updatedAt: toIsoDateString(report.updatedAt ?? createdAt),
        };
      });
    },
    getBotReportedUsers: async (
      _parent: unknown,
      args: { sortBy?: string | null; limit?: number | null },
      context: GraphQLContext
    ): Promise<Common.User[]> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      if (context.user.admin !== true) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const sortBy = args.sortBy ?? 'botReports';
      if (!isBotReportSortBy(sortBy)) {
        throw new GraphQLError('Invalid sortBy', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const limit = args.limit ?? BOT_REPORTED_USERS_DEFAULT_LIMIT;
      if (!Number.isInteger(limit) || limit < 1) {
        throw new GraphQLError('limit must be a positive integer', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const users = await context.prisma.user.findMany({
        where: { botReports: { gt: 0 } },
        orderBy: BOT_REPORT_ORDER[sortBy],
        take: Math.min(limit, BOT_REPORTED_USERS_MAX_LIMIT),
        select: BOT_REPORTED_USER_SELECT,
      });

      return users.map((u) => toPublicUser(u as PrismaUserRecord));
    },

    users: async (
      _parent: unknown,
      args: { limit?: number | null; offset?: number | null },
      context: GraphQLContext
    ): Promise<Common.User[]> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      if (context.user.admin !== true) {
        throw new GraphQLError('Admin access required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const limit = Math.min(Math.max(args.limit ?? USERS_DEFAULT_LIMIT, 1), USERS_MAX_LIMIT);
      const offset = Math.max(args.offset ?? 0, 0);

      // Newest first, like legacy. Public fields only, so no password or token
      // fields leave the server even for admins.
      const users = await context.prisma.user.findMany({
        orderBy: { joined: 'desc' },
        skip: offset,
        take: limit,
        select: PUBLIC_USER_SELECT,
      });

      return users.map((u) => toPublicUser(u as PrismaUserRecord));
    },

    checkDuplicateEmail: async (
      _parent: unknown,
      args: { email: string },
      context: GraphQLContext
    ): Promise<Array<{ isDuplicate: boolean; duplicateCount: number }>> => {
      const email = args.email?.trim() ?? '';
      if (!EMAIL_PATTERN.test(email)) {
        throw new GraphQLError('Invalid email format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Case-insensitive exact match without building a regex from user input.
      const matches = await context.prisma.user.findMany({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { status: true },
      });

      // An undecided request may be submitted again, so it isn't a duplicate (legacy rule).
      if (matches.some((u) => u.status === INVITE_STATUS_REQUESTED)) return [];

      // This query is public: the form only needs to know a match exists, so no
      // user fields are returned.
      return matches.map(() => ({
        isDuplicate: matches.length > 1,
        duplicateCount: matches.length,
      }));
    },

    verifyUserPasswordResetToken: async (
      _parent: unknown,
      args: { token: string },
      context: GraphQLContext
    ): Promise<{ _id: string; email: string; username: string } | null> => {
      const token = args.token?.trim();
      if (!token) return null;

      // An invalid, expired or used link resolves to null rather than an auth error,
      // so the page shows its "link expired" state instead of signing the visitor out.
      // Two kinds of link land here: password reset links, and invite links on the
      // signup page. Session tokens are not links and are refused.
      let userId: string;
      let resetPayload: ReturnType<typeof verifyPasswordResetToken> | null = null;
      try {
        resetPayload = verifyPasswordResetToken(token);
        userId = resetPayload.userId;
      } catch {
        try {
          userId = verifyInviteSignupToken(token).userId;
        } catch {
          return null;
        }
      }
      if (!isObjectId(userId)) return null;

      const user = await context.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          accountStatus: true,
          password: true,
          status: true,
        },
      });
      if (!user || user.accountStatus === 'disabled') return null;

      if (resetPayload) {
        if (!isPasswordResetTokenCurrent(resetPayload, user.password)) return null;
      } else if (user.password || user.status !== INVITE_STATUS_APPROVED) {
        // Invite links only work until the account is set up.
        return null;
      }

      return { _id: user.id, email: user.email, username: user.username };
    },
  },

  Mutation: {
    sendPasswordResetEmail: async (
      _parent: unknown,
      args: { email: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      const email = args.email?.trim() ?? '';
      if (!EMAIL_PATTERN.test(email)) {
        throw new GraphQLError('Invalid email format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      await enforceRateLimit(
        context.prisma,
        `email:${email.toLowerCase()}`,
        'passwordResetEmail',
        RESET_EMAIL_LIMIT_PER_EMAIL,
        RESET_EMAIL_WINDOW_MS
      );
      // Per visitor only when the server trusts the platform's proxy (TRUST_PROXY).
      // Otherwise every request carries the proxy's address and the limit would
      // apply to the whole site.
      const visitorIp = context.req?.app?.get('trust proxy') ? context.req.ip : undefined;
      if (visitorIp) {
        await enforceRateLimit(
          context.prisma,
          `ip:${visitorIp}`,
          'passwordResetEmail',
          RESET_EMAIL_LIMIT_PER_IP,
          RESET_EMAIL_WINDOW_MS
        );
      }

      const user = await context.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: { id: true, email: true, username: true, password: true, accountStatus: true },
      });

      // Only active accounts with a password get a link: an approved invite sets its
      // password through its signup link instead. The response is the same either way,
      // so this can't be used to find out which addresses have accounts.
      if (user?.password && user.accountStatus !== 'disabled') {
        const token = generatePasswordResetToken(user.id, user.password);
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const resetUrl =
          `${clientUrl}/auths/password-reset?token=${encodeURIComponent(token)}` +
          `&username=${encodeURIComponent(user.username)}`;

        // Not awaited, so a known address doesn't answer noticeably slower than an unknown one.
        void sendGridEmail({
          to: user.email,
          templateId: SENDGRID_TEMPLATE_IDS.PASSWORD_RESET,
          dynamicTemplateData: { change_password_url: resetUrl },
        })
          .then((result) => {
            if (!result.success) {
              logger.warn('Password reset email was not sent', { error: result.error });
            }
          })
          .catch((err: unknown) => {
            logger.warn('Password reset email error', {
              error: err instanceof Error ? err.message : String(err),
            });
          });
      }

      return true;
    },

    updateUserPassword: async (
      _parent: unknown,
      args: { username?: string | null; password?: string | null; token?: string | null },
      context: GraphQLContext
    ): Promise<boolean> => {
      const token = args.token?.trim();
      const password = args.password ?? '';
      if (!token) throw invalidResetLink();

      if (
        password.length < PASSWORD_MIN_LENGTH ||
        password.length > PASSWORD_MAX_LENGTH ||
        !PASSWORD_PATTERN.test(password)
      ) {
        throw new GraphQLError(
          'Password must be 8 to 128 characters and include an uppercase letter, a lowercase letter and a number.',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      let payload: ReturnType<typeof verifyPasswordResetToken>;
      try {
        payload = verifyPasswordResetToken(token);
      } catch {
        throw invalidResetLink();
      }
      if (!isObjectId(payload.userId)) throw invalidResetLink();

      const user = await context.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, username: true, password: true, accountStatus: true },
      });
      if (
        !user ||
        user.accountStatus === 'disabled' ||
        !isPasswordResetTokenCurrent(payload, user.password)
      ) {
        throw invalidResetLink();
      }

      // The link carries the username for display; if one is sent it must be the token's account.
      const username = args.username?.trim();
      if (username && username !== user.username) throw invalidResetLink();

      // Updating by id only: the token decides the account, never the username argument.
      // Selecting just the id keeps Prisma from reading back fields that existing
      // accounts don't have, such as `createdAt`.
      await context.prisma.user.update({
        where: { id: user.id },
        data: { password: await generateHashPassword(password) },
        select: { id: true },
      });

      return true;
    },

    updateUser: async (
      _parent: unknown,
      args: { user: UpdateUserInput },
      context: GraphQLContext
    ): Promise<Common.User> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const input = args.user;
      if (!input?._id) {
        throw new GraphQLError('User id is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const actorId = context.user._id.toString();
      const targetId = input._id.toString();
      const isOwnProfile = actorId === targetId;
      const isAdmin = context.user.admin === true;

      if (!isOwnProfile && !isAdmin) {
        throw new GraphQLError('Not authorized to update this user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      // Admins updating another user may only toggle contributorBadge.
      if (!isOwnProfile && isAdmin) {
        if (input.contributorBadge === undefined || input.contributorBadge === null) {
          throw new GraphQLError('Admins may only update contributorBadge for other users', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        try {
          const adminUpdated = await context.prisma.user.update({
            where: { id: targetId },
            data: { contributorBadge: Boolean(input.contributorBadge) },
            select: PUBLIC_USER_SELECT,
          });
          return toPublicUser(adminUpdated as PrismaUserRecord);
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
            throw new GraphQLError('User not found', {
              extensions: { code: 'NOT_FOUND' },
            });
          }
          throw err;
        }
      }

      // Unfinished invite accounts (status 1/4, no password) must use completeSignup.
      const targetBeforeUpdate = await context.prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, password: true, status: true },
      });
      if (
        targetBeforeUpdate &&
        !targetBeforeUpdate.password &&
        targetBeforeUpdate.status != null &&
        UNFINISHED_INVITE_STATUSES.has(targetBeforeUpdate.status)
      ) {
        throw new GraphQLError('Pending invite accounts must complete signup via completeSignup', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const updates: Prisma.UserUpdateInput = {};

      if (input.name !== undefined && input.name !== null) {
        const name = input.name.trim();
        if (!name) {
          throw new GraphQLError('Name is required', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        if (name.length > 50) {
          throw new GraphQLError('Name must be under 50 characters', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.name = name;
      }

      if (input.username !== undefined && input.username !== null) {
        const username = input.username.trim();
        if (username.length < 4 || username.length > 50) {
          throw new GraphQLError('Username must be between 4 and 50 characters', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const existingUsername = await context.prisma.user.findFirst({
          where: {
            username,
            NOT: { id: targetId },
          },
          select: { id: true },
        });

        if (existingUsername) {
          throw new GraphQLError('Username already exists!', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.username = username;
      }

      if (input.email !== undefined && input.email !== null) {
        const email = input.email.trim().toLowerCase();
        if (!email) {
          throw new GraphQLError('Email is required', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const existingEmail = await context.prisma.user.findFirst({
          where: {
            email,
            NOT: { id: targetId },
          },
          select: { id: true },
        });

        if (existingEmail) {
          throw new GraphQLError('Email address already exists!', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        updates.email = email;
      }

      if (input.password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(input.password, salt);
      }

      if (input.avatar !== undefined && input.avatar !== null) {
        updates.avatar = input.avatar;
      }

      if (input.bio !== undefined) {
        try {
          updates.bio = normalizeBio(input.bio);
        } catch (err) {
          throw new GraphQLError(err instanceof Error ? err.message : 'Invalid About text', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
      }

      // TODO: themePreference field doesn't exist in Prisma schema yet.
      // Mongoose silently dropped it (strict mode). To match current behavior,
      // we skip it here. Once P0 (schema migration) is done, uncomment this.
      // if (input.themePreference !== undefined && input.themePreference !== null) {
      //   const theme = input.themePreference.trim();
      //   if (theme !== 'light' && theme !== 'dark') {
      //     throw new GraphQLError('themePreference must be light or dark', {
      //       extensions: { code: 'BAD_USER_INPUT' },
      //     });
      //   }
      //   updates.themePreference = theme;
      // }

      if (input.contributorBadge !== undefined && input.contributorBadge !== null) {
        if (!isAdmin) {
          throw new GraphQLError('Only admins can update contributorBadge', {
            extensions: { code: 'FORBIDDEN' },
          });
        }
        updates.contributorBadge = Boolean(input.contributorBadge);
      }

      if (Object.keys(updates).length === 0) {
        const current = await context.prisma.user.findUnique({
          where: { id: targetId },
        });
        if (!current) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return toPublicUser(current as PrismaUserRecord);
      }

      try {
        const updated = await context.prisma.user.update({
          where: { id: targetId },
          data: updates,
          select: PUBLIC_USER_SELECT,
        });
        return toPublicUser(updated as PrismaUserRecord);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          // Race condition: uniqueness check passed, but another request won the race
          const target = (err.meta?.target as string[]) ?? [];
          const field = target.includes('username') ? 'Username' : 'Email address';
          throw new GraphQLError(`${field} already exists!`, {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw err;
      }
    },

    updateUserAvatar: async (
      _parent: unknown,
      args: { user_id: string; avatarQualities?: Record<string, unknown> | null },
      context: GraphQLContext
    ): Promise<Common.User> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const targetId = args.user_id?.toString();
      if (!targetId) {
        throw new GraphQLError('User id is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const actorId = context.user._id.toString();
      const isAdmin = context.user.admin === true;
      if (actorId !== targetId && !isAdmin) {
        throw new GraphQLError('Not authorized to update this avatar', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (
        args.avatarQualities === undefined ||
        args.avatarQualities === null ||
        typeof args.avatarQualities !== 'object' ||
        Array.isArray(args.avatarQualities)
      ) {
        throw new GraphQLError('avatarQualities must be an object', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      try {
        const updated = await context.prisma.user.update({
          where: { id: targetId },
          data: { avatar: args.avatarQualities as Prisma.InputJsonValue },
          select: PUBLIC_USER_SELECT,
        });
        return toPublicUser(updated as PrismaUserRecord);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        throw err;
      }
    },

    reportBot: async (
      _parent: unknown,
      args: { userId: string; reporterId: string },
      context: GraphQLContext
    ): Promise<{ code: string; message: string }> => {
      if (!context?.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      if (!args.userId || !args.reporterId) {
        throw new GraphQLError('User ID and Reporter ID are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!isObjectId(args.userId) || !isObjectId(args.reporterId)) {
        throw new GraphQLError('Invalid ID format', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const actorId = context.user._id.toString();
      if (actorId !== args.reporterId) {
        throw new GraphQLError('Not authorized to report on behalf of another user', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (args.userId === args.reporterId) {
        throw new GraphQLError('Cannot report yourself as a bot', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const targetUser = await context.prisma.user.findUnique({
        where: { id: args.userId },
        select: { id: true },
      });
      if (!targetUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const existingReport = await context.prisma.botReport.findFirst({
        where: {
          reporterId: args.reporterId,
          userId: args.userId,
        },
        select: { id: true },
      });
      if (existingReport) {
        throw new GraphQLError('You have already reported this user as a bot', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      try {
        await context.prisma.botReport.create({
          data: {
            reporterId: args.reporterId,
            userId: args.userId,
          },
        });
      } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new GraphQLError('You have already reported this user as a bot', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw err;
      }

      await context.prisma.user.update({
        where: { id: args.userId },
        data: {
          botReports: { increment: 1 },
          lastBotReportDate: new Date(),
        },
        // Legacy accounts have no createdAt, so don't read the whole record back.
        select: { id: true },
      });

      return {
        code: 'SUCCESS',
        message: 'Bot report submitted successfully',
      };
    },
  },
  User: {
    // Legacy users have no embedded reputation, so a profile reads the stored
    // row or calculates one. Only runs when a query selects the field.
    reputation: async (
      parent: Common.User,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.Reputation | null> =>
      parent.reputation ?? loadUserReputation(context.prisma, parent._id),
  },
};
