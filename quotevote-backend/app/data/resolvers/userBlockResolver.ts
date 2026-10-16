import type { GraphQLContext, UserBlockStatusResult } from '~/types/graphql';
import { findBlockBetween, requireTargetUser } from '~/data/utils/userBlock';
import { toPairKey } from '~/data/utils/rosterMigration';

type Args = { userId: string };

const status = async (
  context: GraphQLContext,
  me: string,
  userId: string
): Promise<UserBlockStatusResult> => {
  const { aBlocksB, bBlocksA } = await findBlockBetween(context.prisma, me, userId);
  return { userId, blockedByMe: aBlocksB, blockedMe: bBlocksA };
};

export const userBlockResolver = {
  Query: {
    userBlockStatus: async (
      _parent: unknown,
      { userId }: Args,
      context: GraphQLContext
    ): Promise<UserBlockStatusResult> => {
      const me = await requireTargetUser(context, userId);
      return status(context, me, userId);
    },
  },
  Mutation: {
    blockUser: async (
      _parent: unknown,
      { userId }: Args,
      context: GraphQLContext
    ): Promise<UserBlockStatusResult> => {
      const me = await requireTargetUser(context, userId);
      await context.prisma.$transaction([
        context.prisma.userBlock.upsert({
          where: { blockerId_blockedUserId: { blockerId: me, blockedUserId: userId } },
          create: { blockerId: me, blockedUserId: userId },
          update: {},
        }),
        context.prisma.buddyRelationship.deleteMany({
          where: { pairKey: toPairKey(me, userId), status: 'pending' },
        }),
      ]);
      return status(context, me, userId);
    },
    unblockUser: async (
      _parent: unknown,
      { userId }: Args,
      context: GraphQLContext
    ): Promise<UserBlockStatusResult> => {
      const me = await requireTargetUser(context, userId);
      await context.prisma.userBlock.deleteMany({
        where: { blockerId: me, blockedUserId: userId },
      });
      return status(context, me, userId);
    },
  },
};
