/**
 * Staff role management and the staff log (#616 part 2).
 *
 * - `setUserRoles`: an admin grants or removes roles. An admin can't remove their
 *   own admin role, and the last admin can't be removed.
 * - `staffActions`: the log of staff decisions, newest first, for admins.
 * - `User.isModerator` / `User.isInviteApprover`: shown to the user themselves
 *   and to admins only, so who holds a staff role isn't public.
 */

import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { hasRole, requireRole } from '~/data/utils/requireRole';
import { recordStaffAction } from '~/data/utils/staffActions';
import { loadStaffRoles } from '~/data/utils/staffRoleLoader';
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PrismaUserRecord,
} from '~/data/utils/userPrismaMapper';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;
const STAFF_ACTIONS_DEFAULT_LIMIT = 50;
const STAFF_ACTIONS_MAX_LIMIT = 100;

const STAFF_ROLES: readonly Common.StaffRole[] = ['admin', 'moderator', 'inviteApprover'];

/** A role change that clashes with another is retried this many times in all. */
const ROLE_CHANGE_ATTEMPTS = 3;

const isWriteConflict = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';

const pause = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** The Prisma field behind each role. */
const ROLE_FIELD = {
  admin: 'isAdmin',
  moderator: 'isModerator',
  inviteApprover: 'isInviteApprover',
} as const satisfies Record<Common.StaffRole, keyof Prisma.UserSelect>;

type RoleField = (typeof ROLE_FIELD)[Common.StaffRole];

/** Public profile plus roles. No createdAt, which legacy accounts lack. */
const USER_WITH_ROLES_SELECT = {
  ...PUBLIC_USER_SELECT,
  accountStatus: true,
  isAdmin: true,
  isModerator: true,
  isInviteApprover: true,
} as const satisfies Prisma.UserSelect;

const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

function isStaffRole(value: string): value is Common.StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

/** The role flags as `role -> held`, read from a Prisma user record. */
function rolesOf(
  record: Partial<Record<RoleField, boolean | null>>
): Record<Common.StaffRole, boolean> {
  return {
    admin: record.isAdmin === true,
    moderator: record.isModerator === true,
    inviteApprover: record.isInviteApprover === true,
  };
}

/**
 * A role flag on `User`, or null when the viewer may not see it. The viewer's own
 * roles come from `context.user`, loaded from the database for this request; an
 * admin sees anyone else's through the batched loader.
 */
async function visibleRole(
  parent: Common.User,
  context: GraphQLContext,
  field: 'isModerator' | 'isInviteApprover'
): Promise<boolean | null> {
  const viewer = context.user;
  if (!viewer?._id || !parent?._id) return null;
  if (String(viewer._id) === String(parent._id)) return viewer[field] === true;
  if (!hasRole(viewer, 'admin')) return null;

  // Batched per request, so a list of users costs one query for both fields.
  const roles = await loadStaffRoles(context, String(parent._id));
  return roles ? roles[field] : null;
}

export const staffResolver = {
  Query: {
    staffActions: async (
      _parent: unknown,
      args: { limit?: number | null; offset?: number | null },
      context: GraphQLContext
    ): Promise<Common.StaffAction[]> => {
      requireRole(context, 'admin');

      const limit = Math.min(
        Math.max(args.limit ?? STAFF_ACTIONS_DEFAULT_LIMIT, 1),
        STAFF_ACTIONS_MAX_LIMIT
      );
      const offset = Math.max(args.offset ?? 0, 0);

      const rows = await context.prisma.staffAction.findMany({
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          actorId: true,
          action: true,
          targetId: true,
          detail: true,
          createdAt: true,
        },
      });

      // One lookup for every actor and target on the page.
      const userIds = [
        ...new Set(rows.flatMap((r) => [r.actorId, r.targetId]).filter((id): id is string => !!id)),
      ];
      const users = userIds.length
        ? await context.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: PUBLIC_USER_SELECT,
          })
        : [];
      const byId = new Map(users.map((u) => [u.id, toPublicUser(u as PrismaUserRecord)]));

      return rows.map((r) => ({
        _id: r.id,
        action: r.action,
        actorId: r.actorId,
        actor: byId.get(r.actorId) ?? null,
        targetId: r.targetId ?? null,
        target: (r.targetId && byId.get(r.targetId)) || null,
        detail: r.detail ?? null,
        createdAt: r.createdAt,
      }));
    },
  },

  Mutation: {
    setUserRoles: async (
      _parent: unknown,
      args: { userId: string; roles: string[] },
      context: GraphQLContext
    ): Promise<Common.User> => {
      const actorId = requireRole(context, 'admin');

      if (!args.userId || !OBJECT_ID_PATTERN.test(args.userId)) {
        throw badInput('Invalid userId');
      }
      const requested = args.roles ?? [];
      const unknown = requested.find((role) => !isStaffRole(role));
      if (unknown !== undefined) throw badInput(`Unknown role: ${unknown}`);
      const wanted = new Set(requested as Common.StaffRole[]);

      const target = await context.prisma.user.findUnique({
        where: { id: args.userId },
        select: {
          id: true,
          password: true,
          isAdmin: true,
          isModerator: true,
          isInviteApprover: true,
        },
      });
      if (!target) {
        throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
      }
      if (!target.password) {
        throw badInput('Roles can only be given to accounts that finished signup');
      }

      const current = rolesOf(target);
      const changes = STAFF_ROLES.filter((role) => current[role] !== wanted.has(role));
      const removingAdmin = current.admin && !wanted.has('admin');

      if (removingAdmin && target.id === actorId) {
        throw new GraphQLError("You can't remove your own admin role", {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      if (changes.length > 0) {
        const data = Object.fromEntries(
          changes.map((role) => [ROLE_FIELD[role], wanted.has(role)])
        ) as Prisma.UserUpdateInput;

        // Two clashing changes can abort each other, so a clash is retried after a
        // short, random pause; usually one then goes through and the other is refused.
        for (let attempt = 1; ; attempt += 1) {
          try {
            await context.prisma.$transaction(async (tx) => {
              // Writing the acting admin's record as well means two role changes that
              // involve the same admins conflict, so one is refused instead of both
              // landing (for example, two admins removing each other at once).
              const actor = await tx.user.updateMany({
                where: { id: actorId, isAdmin: true },
                data: { updatedAt: new Date() },
              });
              if (actor.count !== 1) {
                throw new GraphQLError('Admin access required', {
                  extensions: { code: 'FORBIDDEN' },
                });
              }

              await tx.user.update({ where: { id: target.id }, data, select: { id: true } });

              if (removingAdmin && (await tx.user.count({ where: { isAdmin: true } })) === 0) {
                throw badInput("The last admin can't be removed");
              }
            });
            break;
          } catch (err) {
            if (!isWriteConflict(err)) throw err;
            if (attempt >= ROLE_CHANGE_ATTEMPTS) {
              throw new GraphQLError(
                'Roles were changed by someone else at the same time. Please try again.',
                { extensions: { code: 'CONFLICT' } }
              );
            }
            await pause(10 + Math.random() * 40 * attempt);
          }
        }

        for (const role of changes) {
          await recordStaffAction(
            context,
            wanted.has(role) ? 'role_granted' : 'role_revoked',
            target.id,
            role
          );
        }
      }

      const updated = await context.prisma.user.findUnique({
        where: { id: target.id },
        select: USER_WITH_ROLES_SELECT,
      });
      return toPublicUser(updated as PrismaUserRecord);
    },
  },

  User: {
    isModerator: (parent: Common.User, _args: unknown, context: GraphQLContext) =>
      visibleRole(parent, context, 'isModerator'),
    isInviteApprover: (parent: Common.User, _args: unknown, context: GraphQLContext) =>
      visibleRole(parent, context, 'isInviteApprover'),
  },
};
