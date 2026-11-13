/**
 * Member invites (#672) and admin approvals (#691): an invite link works only while
 * its UserInvite row is pending and unexpired, and only for the address it was sent to.
 */

import type { InviteSignupTokenPayload } from '~/data/utils/authentication';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function sameEmail(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Whether an invite-signup token's invite can still be used by this account.
 * Tokens without `inviteId` are admin approvals sent before #691, and pass as before.
 */
export async function isMemberInviteUsable(
  prisma: GraphQLContext['prisma'],
  payload: InviteSignupTokenPayload,
  accountEmail: string | null | undefined
): Promise<boolean> {
  if (!payload.inviteId) return true;
  if (!OBJECT_ID_PATTERN.test(payload.inviteId)) return false;

  const invite = await prisma.userInvite.findUnique({
    where: { id: payload.inviteId },
    select: { email: true, status: true, expiresAt: true },
  });
  if (!invite || invite.status !== 'pending') return false;
  if (!invite.expiresAt || invite.expiresAt <= new Date()) return false;

  return sameEmail(payload.email, invite.email) && sameEmail(invite.email, accountEmail);
}
