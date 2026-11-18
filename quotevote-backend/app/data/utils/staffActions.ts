/**
 * Staff log (#616). Each staff mutation records what it did in one line, after the
 * change itself has gone through:
 *
 *   await recordStaffAction(context, 'invite_approved', invitedUser.id);
 *
 * Recording never fails the mutation: the change already happened, so a log write
 * error is reported to the server log instead.
 */

import { logger } from '~/data/utils/logger';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

export async function recordStaffAction(
  context: Pick<GraphQLContext, 'prisma' | 'user'>,
  action: Common.StaffActionKind,
  targetId: string | null,
  detail?: string
): Promise<void> {
  const actorId = context.user?._id?.toString();
  if (!actorId) return;
  try {
    await context.prisma.staffAction.create({
      data: { actorId, action, targetId, detail: detail ?? null },
      select: { id: true },
    });
  } catch (err) {
    logger.error('Could not record a staff action', {
      action,
      actorId,
      targetId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
