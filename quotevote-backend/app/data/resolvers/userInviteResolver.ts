/**
 * Invitation request, approval, and Terms-gated signup completion (#573).
 *
 * Invite lifecycle uses legacy numeric `User.status` (not `accountStatus`):
 *   1 = access requested, 4 = approved (invite sent), 2 = declined.
 * A member's invite (#672) skips the admin queue: the account starts at 4 and the
 * UserInvite row decides whether its signup link still works.
 * `accountStatus` stays reserved for moderation (active / disabled / …).
 */

import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import sendGridEmail, { SENDGRID_TEMPLATE_IDS } from '~/data/utils/send-grid-mail';
import {
  MEMBER_INVITE_TTL_SECONDS,
  generateHashPassword,
  generateInviteSignupToken,
  verifyInviteSignupToken,
} from '~/data/utils/authentication';
import { isMemberInviteUsable } from '~/data/utils/memberInvite';
import {
  CURRENT_TERMS_HASH,
  CURRENT_TERMS_VERSION,
  isCurrentTermsVersion,
} from '~/data/utils/termsPolicy';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import { logger } from '~/data/utils/logger';
import { checkRateLimit } from '~/data/utils/rateLimiter';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/** Legacy invite request / approval / decline codes on `User.status`. */
const INVITE_STATUS_REQUESTED = 1;
const INVITE_STATUS_DECLINED = 2;
const INVITE_STATUS_APPROVED = 4;

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Invites a member may send per hour. */
const INVITES_PER_HOUR = 10;
/** Pending, unexpired invites a member may have at once. */
const MAX_UNUSED_INVITES = 20;
/** Contact form submissions per address and per visitor per hour. */
const CONTACTS_PER_EMAIL_PER_HOUR = 1;
const CONTACTS_PER_IP_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;

const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

/** Trimmed, lowercased email, or BAD_USER_INPUT when it isn't one. */
function validEmail(raw: string | null | undefined): string {
  const email = raw?.trim().toLowerCase() ?? '';
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw badInput('Please enter a valid email address');
  }
  return email;
}

async function enforceRateLimit(
  prisma: GraphQLContext['prisma'],
  key: string,
  action: string,
  limit: number
): Promise<void> {
  try {
    await checkRateLimit(prisma, key, action, limit, HOUR_MS);
  } catch {
    throw new GraphQLError('Too many requests. Please try again later.', {
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
  }
}

/** Sends an email and reports whether it went out. Never throws. */
async function trySend(
  label: string,
  email: Parameters<typeof sendGridEmail>[0]
): Promise<boolean> {
  try {
    const result = await sendGridEmail(email);
    if (result.success) return true;
    logger.warn(`${label} email failed`, { error: result.error });
  } catch (err) {
    logger.warn(`${label} email error`, {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return false;
}

/** Send without failing the mutation when mail is misconfigured in local/dev. */
async function sendQuietly(
  label: string,
  email: Parameters<typeof sendGridEmail>[0]
): Promise<void> {
  await trySend(label, email);
}

const INVITE_LINK_UNUSABLE = 'This invite link has expired or has already been used';

/** The member invite a new link points at, and how to take it back if the email fails. */
interface MemberInviteTarget {
  userId: string;
  inviteId: string;
  undo: () => Promise<unknown>;
}

/**
 * Sets up a member invite to `email`: a new placeholder account and invite, or a
 * fresh expiry on an expired, unused one. Any other account, pending request or
 * declined request on the address is refused, so a member can't override an admin.
 */
async function prepareMemberInvite(
  prisma: GraphQLContext['prisma'],
  email: string,
  inviterId: string,
  now: Date,
  expiresAt: Date
): Promise<MemberInviteTarget> {
  const existingUser = await prisma.user.findFirst({
    where: { email },
    select: { id: true, password: true, status: true },
  });

  if (!existingUser) {
    let userId: string;
    try {
      ({ id: userId } = await prisma.user.create({
        data: { email, username: email, status: INVITE_STATUS_APPROVED, password: null },
        select: { id: true },
      }));
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw badInput('User with this email already exists');
      }
      throw err;
    }
    const { id: inviteId } = await prisma.userInvite.create({
      data: { email, invitedById: inviterId, status: 'pending', expiresAt },
      select: { id: true },
    });
    return {
      userId,
      inviteId,
      undo: async () => {
        await prisma.userInvite.deleteMany({ where: { id: inviteId } });
        await prisma.user.deleteMany({ where: { id: userId } });
      },
    };
  }

  // Only an account still waiting on a member invite can be invited again.
  const waitingOnInvite = !existingUser.password && existingUser.status === INVITE_STATUS_APPROVED;
  const invite = waitingOnInvite
    ? await prisma.userInvite.findFirst({
        where: { email, status: 'pending' },
        orderBy: { expiresAt: 'desc' },
        select: { id: true, expiresAt: true, invitedById: true },
      })
    : null;
  const previousExpiry = invite?.expiresAt;
  if (!invite || !previousExpiry) throw badInput('User with this email already exists');
  if (previousExpiry > now) throw badInput('Invite already sent to this email');

  // Expired and unused: renew it, only if nobody else renewed or used it first.
  const renewed = await prisma.userInvite.updateMany({
    where: { id: invite.id, status: 'pending', expiresAt: previousExpiry },
    data: { expiresAt, invitedById: inviterId },
  });
  if (renewed.count !== 1) throw badInput('Invite already sent to this email');

  return {
    userId: existingUser.id,
    inviteId: invite.id,
    undo: () =>
      prisma.userInvite.updateMany({
        where: { id: invite.id, status: 'pending', expiresAt },
        data: { expiresAt: previousExpiry, invitedById: invite.invitedById },
      }),
  };
}

function isApprovedInviteStatus(inviteStatus: string): boolean {
  const normalized = inviteStatus.trim().toLowerCase();
  return normalized === 'approved' || normalized === '4';
}

function isDeclinedInviteStatus(inviteStatus: string): boolean {
  const normalized = inviteStatus.trim().toLowerCase();
  return normalized === 'declined' || normalized === '2';
}

export const userInviteResolver = {
  Query: {
    userInviteRequests: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<Common.UserInviteRequest[]> => {
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

      // Requested and declined access requests, newest first. Legacy user records
      // have no createdAt, so this selects and sorts on `joined` only.
      const users = await context.prisma.user.findMany({
        where: { status: { in: [INVITE_STATUS_REQUESTED, INVITE_STATUS_DECLINED] } },
        orderBy: { joined: 'desc' },
        select: { id: true, email: true, status: true, joined: true },
      });

      return users.map((u) => ({
        _id: u.id,
        email: u.email,
        status: String(u.status),
        joined: u.joined ?? null,
      }));
    },

    verifyInviteSignupToken: async (
      _parent: unknown,
      args: { token: string },
      context: GraphQLContext
    ): Promise<{ _id: string; email: string; username: string } | null> => {
      if (!args.token?.trim()) {
        throw new GraphQLError('Invite token is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const payload = verifyInviteSignupToken(args.token);
      const user = await context.prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          password: true,
          status: true,
          accountStatus: true,
        },
      });

      if (!user || user.accountStatus === 'disabled') {
        return null;
      }

      // Only approved, unfinished invites may be verified.
      if (user.password || user.status !== INVITE_STATUS_APPROVED) {
        return null;
      }

      // A used or expired member invite shows as invalid straight away.
      if (!(await isMemberInviteUsable(context.prisma, payload, user.email))) {
        return null;
      }

      return {
        _id: user.id,
        email: user.email,
        username: user.username,
      };
    },
  },

  Mutation: {
    /**
     * A member invites someone by email (#672). Unlike a public access request,
     * this skips the admin queue: the invitee gets a signup link bound to this
     * invite and address, usable once within 7 days. The link only goes in the
     * email; it is never logged or returned.
     */
    sendUserInvite: async (
      _parent: unknown,
      args: { email: string },
      context: GraphQLContext
    ): Promise<{ code: string; message: string }> => {
      const inviter = context.user;
      const inviterId = context.userId;
      if (!inviter || !inviterId) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      if (inviter.accountStatus !== 'active') {
        throw new GraphQLError('Only active members can send invites', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      const email = validEmail(args.email);
      await enforceRateLimit(context.prisma, inviterId, 'sendUserInvite', INVITES_PER_HOUR);

      const now = new Date();
      const unused = await context.prisma.userInvite.count({
        where: { invitedById: inviterId, status: 'pending', expiresAt: { gt: now } },
      });
      if (unused >= MAX_UNUSED_INVITES) {
        throw new GraphQLError(
          `You have ${MAX_UNUSED_INVITES} unused invites. You can send more once some are accepted or expire.`,
          { extensions: { code: 'TOO_MANY_REQUESTS' } }
        );
      }

      const expiresAt = new Date(now.getTime() + MEMBER_INVITE_TTL_SECONDS * 1000);
      const target = await prepareMemberInvite(context.prisma, email, inviterId, now, expiresAt);

      const token = generateInviteSignupToken(target.userId, MEMBER_INVITE_TTL_SECONDS, {
        inviteId: target.inviteId,
        email,
      });
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const sent = await trySend('sendUserInvite', {
        to: email,
        templateId: SENDGRID_TEMPLATE_IDS.INVITE_REQUEST_RECEIVED_CONFIRMATION,
        dynamicTemplateData: {
          inviter_name: inviter.name || inviter.username,
          invite_url: `${clientUrl}/auths/signup?token=${encodeURIComponent(token)}`,
        },
      });

      // Without the email nobody can use the invite, so take it back rather than
      // leave the address stuck behind "Invite already sent".
      if (!sent) {
        await target.undo().catch((err: unknown) => {
          logger.error('sendUserInvite could not take back an unsent invite', {
            inviteId: target.inviteId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
        throw new GraphQLError("We couldn't send the invite email. Please try again later.", {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      return { code: 'SUCCESS', message: 'Invitation sent successfully' };
    },

    /**
     * The investor contact form. Tells the team by email; unlike legacy, it no
     * longer creates a placeholder account, since anyone can submit it.
     */
    sendInvestorMail: async (
      _parent: unknown,
      args: { email: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      const email = validEmail(args.email);
      if (context.req?.ip) {
        await enforceRateLimit(
          context.prisma,
          `ip:${context.req.ip}`,
          'sendInvestorMail',
          CONTACTS_PER_IP_PER_HOUR
        );
      }
      await enforceRateLimit(
        context.prisma,
        `email:${email}`,
        'sendInvestorMail',
        CONTACTS_PER_EMAIL_PER_HOUR
      );

      const to = process.env.TO_INVESTOR_EMAIL;
      if (!to) {
        logger.warn('sendInvestorMail: TO_INVESTOR_EMAIL is not set');
        return true;
      }
      await sendQuietly('sendInvestorMail', {
        to,
        subject: 'New investor contact',
        text: `New investor contact: ${email}`,
      });
      return true;
    },

    requestUserAccess: async (
      _parent: unknown,
      args: { requestUserAccessInput: Common.RequestUserAccessInput },
      context: GraphQLContext
    ): Promise<Common.User> => {
      const email = args.requestUserAccessInput?.email?.trim().toLowerCase();
      if (!email) {
        throw new GraphQLError('Email is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const existingUser = await context.prisma.user.findFirst({
        where: { email },
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          accountStatus: true,
          status: true,
          password: true,
          avatar: true,
          bio: true,
          contributorBadge: true,
          upvotes: true,
          downvotes: true,
          followingIds: true,
          followerIds: true,
          reputation: true,
          isAdmin: true,
        },
      });

      let user = existingUser;

      if (existingUser) {
        // Active completed accounts cannot re-request access under the same email.
        if (existingUser.password && existingUser.accountStatus === 'active') {
          throw new GraphQLError('Email already exists', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Re-open a declined request as status 1. Do not touch approved invites
        // (status 4) — resetting those would invalidate the emailed signup link.
        if (!existingUser.password && existingUser.status === INVITE_STATUS_DECLINED) {
          user = await context.prisma.user.update({
            where: { id: existingUser.id },
            data: { status: INVITE_STATUS_REQUESTED },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              accountStatus: true,
              status: true,
              password: true,
              avatar: true,
              bio: true,
              contributorBadge: true,
              upvotes: true,
              downvotes: true,
              followingIds: true,
              followerIds: true,
              reputation: true,
              isAdmin: true,
            },
          });
        }
      } else {
        try {
          user = await context.prisma.user.create({
            data: {
              email,
              username: email,
              status: INVITE_STATUS_REQUESTED,
              password: null,
            },
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              accountStatus: true,
              status: true,
              password: true,
              avatar: true,
              bio: true,
              contributorBadge: true,
              upvotes: true,
              downvotes: true,
              followingIds: true,
              followerIds: true,
              reputation: true,
              isAdmin: true,
            },
          });
        } catch (err) {
          if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new GraphQLError('Email already exists', {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }
          throw err;
        }
      }

      if (!user) {
        throw new GraphQLError('Unable to create access request', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      try {
        const result = await sendGridEmail({
          to: email,
          templateId: SENDGRID_TEMPLATE_IDS.INVITE_REQUEST_RECEIVED_CONFIRMATION,
        });
        if (result.error) {
          logger.warn('requestUserAccess email failed', { error: result.error });
        }
      } catch (err) {
        // Do not fail the request if mail is misconfigured in local/dev.
        logger.warn('requestUserAccess email error', {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      return toPublicUser(user as PrismaUserRecord);
    },

    sendUserInviteApproval: async (
      _parent: unknown,
      args: { userId: string; inviteStatus: string },
      context: GraphQLContext
    ): Promise<{ code: string; message: string; inviteToken?: string }> => {
      if (!context.user?._id || context.user.admin !== true) {
        throw new GraphQLError('Admin authentication required', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (!args.userId || !isObjectId(args.userId)) {
        throw new GraphQLError('Valid userId is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const invitedUser = await context.prisma.user.findUnique({
        where: { id: args.userId },
        select: { id: true, email: true, username: true, password: true, status: true },
      });

      if (!invitedUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      const mailTo = invitedUser.email;

      if (isApprovedInviteStatus(args.inviteStatus)) {
        if (invitedUser.password) {
          throw new GraphQLError('User has already completed signup', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        // Select only id: Prisma reads the record back after the update, and
        // legacy accounts have no createdAt, which would fail that read.
        await context.prisma.user.update({
          where: { id: invitedUser.id },
          data: { status: INVITE_STATUS_APPROVED },
          select: { id: true },
        });

        const inviteToken = generateInviteSignupToken(invitedUser.id);
        const signupPath = `/auths/signup?token=${encodeURIComponent(inviteToken)}`;

        try {
          await sendGridEmail({
            to: mailTo,
            subject: 'Your invitation to Quote is approved',
            templateId: SENDGRID_TEMPLATE_IDS.INVITATION_APPROVE,
            dynamicTemplateData: {
              create_password_url: `${clientUrl}${signupPath}`,
            },
          });
        } catch (err) {
          logger.warn('sendUserInviteApproval email error', {
            error: err instanceof Error ? err.message : String(err),
          });
        }

        return {
          code: 'SUCCESS',
          message: `User sign-up invite sent successfully to ${mailTo}.`,
          // Exposed for tests / local ops when email is unavailable.
          inviteToken: process.env.NODE_ENV === 'test' ? inviteToken : undefined,
        };
      }

      if (isDeclinedInviteStatus(args.inviteStatus)) {
        await context.prisma.user.update({
          where: { id: invitedUser.id },
          data: { status: INVITE_STATUS_DECLINED },
          select: { id: true },
        });

        try {
          await sendGridEmail({
            to: mailTo,
            subject: 'Your invitation to Quote has been declined',
            templateId: SENDGRID_TEMPLATE_IDS.INVITATION_DECLINE,
          });
        } catch (err) {
          logger.warn('sendUserInviteApproval decline email error', {
            error: err instanceof Error ? err.message : String(err),
          });
        }

        return {
          code: 'SUCCESS',
          message: `User invite declined for ${mailTo}.`,
        };
      }

      return {
        code: 'SUCCESS',
        message: 'User Invite reset',
      };
    },

    completeSignup: async (
      _parent: unknown,
      args: {
        token: string;
        username: string;
        password: string;
        acceptedTermsVersion: string;
      },
      context: GraphQLContext
    ): Promise<Common.User> => {
      const username = args.username?.trim();
      const password = args.password;
      const token = args.token?.trim();

      if (!token || !username || !password) {
        throw new GraphQLError('token, username, and password are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!isCurrentTermsVersion(args.acceptedTermsVersion)) {
        throw new GraphQLError('You must accept the current Terms of Service to complete signup', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new GraphQLError('Invalid username', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (password.length < 8) {
        throw new GraphQLError('Password must be at least 8 characters', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const payload = verifyInviteSignupToken(token);

      const existing = await context.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, password: true, status: true, accountStatus: true, email: true },
      });

      if (!existing || existing.accountStatus === 'disabled') {
        throw new GraphQLError('Invite is invalid or the account is unavailable', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (existing.password) {
        throw new GraphQLError('Signup has already been completed for this invite', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (existing.status !== INVITE_STATUS_APPROVED) {
        throw new GraphQLError('Invite is not approved for signup', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // A member invite also needs its invite pending and unexpired, and the token,
      // the invite and the account to name the same address.
      const inviteId = payload.inviteId;
      if (inviteId && !(await isMemberInviteUsable(context.prisma, payload, existing.email))) {
        throw badInput(INVITE_LINK_UNUSABLE);
      }

      const usernameTaken = await context.prisma.user.findFirst({
        where: {
          username,
          NOT: { id: existing.id },
        },
        select: { id: true },
      });
      if (usernameTaken) {
        throw new GraphQLError('Username already exists!', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashedPassword = await generateHashPassword(password);

      // Claim the member invite in one conditional write, so of two requests at
      // once only one gets through.
      if (inviteId) {
        const claimed = await context.prisma.userInvite.updateMany({
          where: { id: inviteId, status: 'pending', expiresAt: { gt: new Date() } },
          data: { status: 'accepted' },
        });
        if (claimed.count !== 1) throw badInput(INVITE_LINK_UNUSABLE);
      }

      try {
        const updated = await context.prisma.user.update({
          where: { id: existing.id },
          data: {
            username,
            password: hashedPassword,
            accountStatus: 'active',
            termsAcceptances: {
              create: {
                termsVersion: CURRENT_TERMS_VERSION,
                termsHash: CURRENT_TERMS_HASH,
                source: 'invite_completion',
              },
            },
          },
          select: {
            ...PUBLIC_USER_SELECT,
            email: true,
            accountStatus: true,
          },
        });

        return toPublicUser(updated as PrismaUserRecord);
      } catch (err) {
        // Signup didn't finish, so the link stays usable.
        if (inviteId) {
          await context.prisma.userInvite
            .updateMany({
              where: { id: inviteId, status: 'accepted' },
              data: { status: 'pending' },
            })
            .catch((releaseErr: unknown) => {
              logger.error('completeSignup could not release a member invite', {
                inviteId,
                error: releaseErr instanceof Error ? releaseErr.message : String(releaseErr),
              });
            });
        }
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          throw new GraphQLError('Username already exists or terms already accepted', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw err;
      }
    },
  },
};
