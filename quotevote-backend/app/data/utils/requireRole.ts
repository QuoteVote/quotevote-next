/**
 * Staff roles (#616). Every staff resolver checks its role here, against the user
 * loaded from the database for this request, never a claim in the token. A user
 * may hold several roles, and admins pass every check.
 */

import { GraphQLError } from 'graphql';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const HOLDS_ROLE: Record<Common.StaffRole, (user: Common.User) => boolean> = {
  admin: (user) => user.admin === true,
  moderator: (user) => user.isModerator === true,
  inviteApprover: (user) => user.isInviteApprover === true,
};

const ROLE_LABEL: Record<Common.StaffRole, string> = {
  admin: 'Admin',
  moderator: 'Moderator',
  inviteApprover: 'Invite approver',
};

/** Whether this user may act as `role`. Admins may act as any role. */
export function hasRole(user: Common.User | null | undefined, role: Common.StaffRole): boolean {
  if (!user) return false;
  return user.admin === true || HOLDS_ROLE[role](user);
}

/**
 * Throws UNAUTHENTICATED without a signed-in user and FORBIDDEN without the role.
 * Returns the caller's id.
 */
export function requireRole(context: Pick<GraphQLContext, 'user'>, role: Common.StaffRole): string {
  const user = context.user;
  if (!user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (!hasRole(user, role)) {
    throw new GraphQLError(`${ROLE_LABEL[role]} access required`, {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user._id.toString();
}
