import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import { isObjectId } from '~/data/resolvers/utils/common';

type Prisma = GraphQLContext['prisma'];

/** Look up block rows in both directions with a single query. */
export async function findBlockBetween(
  prisma: Prisma,
  rawA: string,
  rawB: string
): Promise<{ aBlocksB: boolean; bBlocksA: boolean }> {
  // Prisma returns lowercase hex, so normalise caller input before comparing.
  const [a, b] = [rawA.toLowerCase(), rawB.toLowerCase()];
  const rows = await prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: a, blockedUserId: b },
        { blockerId: b, blockedUserId: a },
      ],
    },
    select: { blockerId: true },
  });
  return {
    aBlocksB: rows.some((r) => r.blockerId === a),
    bBlocksA: rows.some((r) => r.blockerId === b),
  };
}

/**
 * Throw FORBIDDEN if either user blocks the other.
 *
 * Future call sites:
 * - `createMessage` into an existing USER room (check the other participant)
 * - `createUserMessageRoom` for a new DM (check the recipient)
 *
 * The message is the same for both directions, so the caller cannot learn who blocked whom.
 */
export async function assertNoBlockBetween(
  prisma: Prisma,
  userA: string,
  userB: string
): Promise<void> {
  const { aBlocksB, bBlocksA } = await findBlockBetween(prisma, userA, userB);
  if (aBlocksB || bBlocksA) {
    throw new GraphQLError('Cannot send message: a block exists between these users', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT' } });

/**
 * Validate a target user id for social actions (block, buddy).
 * Returns the authenticated caller id.
 */
export async function requireTargetUser(context: GraphQLContext, userId: string): Promise<string> {
  const me = context.userId;
  if (!me) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (!isObjectId(userId)) throw badInput('Invalid user id');
  if (userId.toLowerCase() === me.toLowerCase()) throw badInput('Cannot target yourself');
  const target = await context.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) throw badInput('User not found');
  return me;
}
