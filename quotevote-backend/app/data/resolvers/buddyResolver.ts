import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import type {
  GraphQLContext,
  BuddyMutationResult,
  BuddyRelationshipResult,
  BuddyUserResult,
  BuddyWithPresenceResult,
} from '~/types/graphql';
import { isObjectId } from '~/data/resolvers/utils/common';
import { PRESENCE_RECORD_SELECT, toPublicPresence } from '~/data/resolvers/heartbeatResolver';
import { findBlockBetween, requireTargetUser } from '~/data/utils/userBlock';
import { toPairKey } from '~/data/utils/rosterMigration';

const err = (message: string, code: string): GraphQLError =>
  new GraphQLError(message, { extensions: { code } });

// Never select email: buddy data is visible to other users.
const USER_SELECT = { id: true, name: true, username: true, avatar: true } as const;
const INCLUDE = {
  requester: { select: USER_SELECT },
  recipient: { select: USER_SELECT },
} as const;

type PrismaUser = { id: string; name: string | null; username: string | null; avatar: unknown };

const toBuddyUser = (u: PrismaUser): BuddyUserResult => ({
  _id: u.id,
  name: u.name,
  username: u.username,
  avatar: u.avatar,
});

type RelRow = {
  id: string;
  status: 'pending' | 'accepted';
  createdAt: Date;
  acceptedAt: Date | null;
  requester: PrismaUser;
  recipient: PrismaUser;
};

const toRelationship = (r: RelRow): BuddyRelationshipResult => ({
  _id: r.id,
  status: r.status,
  requester: toBuddyUser(r.requester),
  recipient: toBuddyUser(r.recipient),
  createdAt: r.createdAt,
  acceptedAt: r.acceptedAt,
});

const requireMe = (context: GraphQLContext): string => {
  if (!context.userId) throw err('Authentication required', 'UNAUTHENTICATED');
  return context.userId;
};

const requireRequestId = (context: GraphQLContext, requestId: string): string => {
  const me = requireMe(context);
  if (!isObjectId(requestId)) throw err('Invalid request id', 'BAD_USER_INPUT');
  return me;
};

/** Return the set of user ids (from `others`) that have a block with `me` in either direction. */
async function blockedAmong(
  context: GraphQLContext,
  me: string,
  others: string[]
): Promise<Set<string>> {
  if (others.length === 0) return new Set();
  const rows = await context.prisma.userBlock.findMany({
    where: {
      OR: [
        { blockerId: me, blockedUserId: { in: others } },
        { blockedUserId: me, blockerId: { in: others } },
      ],
    },
    select: { blockerId: true, blockedUserId: true },
  });
  return new Set(rows.map((r) => (r.blockerId === me ? r.blockedUserId : r.blockerId)));
}

export const buddyResolver = {
  Query: {
    getBuddyList: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<BuddyWithPresenceResult[]> => {
      const me = requireMe(context);
      const rows = await context.prisma.buddyRelationship.findMany({
        where: {
          status: 'accepted',
          OR: [{ requesterId: me }, { recipientId: me }],
        },
        select: { requesterId: true, recipientId: true },
      });
      const all = rows.map((r) => (r.requesterId === me ? r.recipientId : r.requesterId));
      const blocked = await blockedAmong(context, me, all);
      const ids = all.filter((id) => !blocked.has(id));
      if (ids.length === 0) return [];

      const [users, presences] = await Promise.all([
        context.prisma.user.findMany({ where: { id: { in: ids } }, select: USER_SELECT }),
        context.prisma.presence.findMany({
          where: { userId: { in: ids } },
          select: PRESENCE_RECORD_SELECT,
        }),
      ]);
      const presenceMap = new Map(presences.map((p) => [p.userId, p]));
      return users.map((u) => {
        const p = presenceMap.get(u.id);
        // Invisible users look offline to their buddies, with no status message.
        const presence = p
          ? toPublicPresence(
              p.status === 'invisible' ? { ...p, status: 'offline', statusMessage: null } : p
            )
          : null;
        return { user: toBuddyUser(u), presence };
      });
    },
    buddyRequests: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<BuddyRelationshipResult[]> => {
      const me = requireMe(context);
      const rows = await context.prisma.buddyRelationship.findMany({
        where: { status: 'pending', OR: [{ requesterId: me }, { recipientId: me }] },
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
      });
      const blocked = await blockedAmong(
        context,
        me,
        rows.map((r) => (r.requesterId === me ? r.recipientId : r.requesterId))
      );
      return rows
        .filter((r) => !blocked.has(r.requesterId === me ? r.recipientId : r.requesterId))
        .map(toRelationship);
    },
  },
  Mutation: {
    addBuddy: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ): Promise<BuddyRelationshipResult> => {
      const me = await requireTargetUser(context, userId);
      const { aBlocksB, bBlocksA } = await findBlockBetween(context.prisma, me, userId);
      if (aBlocksB || bBlocksA) {
        throw err('Cannot send buddy request: a block exists between these users', 'FORBIDDEN');
      }
      try {
        const row = await context.prisma.buddyRelationship.create({
          data: {
            requesterId: me,
            recipientId: userId,
            pairKey: toPairKey(me, userId),
            status: 'pending',
          },
          include: INCLUDE,
        });
        return toRelationship(row);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw err('Buddy relationship or request already exists', 'CONFLICT');
        }
        throw e;
      }
    },
    acceptBuddy: async (
      _parent: unknown,
      { requestId }: { requestId: string },
      context: GraphQLContext
    ): Promise<BuddyRelationshipResult> => {
      const me = requireRequestId(context, requestId);
      const { count } = await context.prisma.buddyRelationship.updateMany({
        where: { id: requestId, recipientId: me, status: 'pending' },
        data: { status: 'accepted', acceptedAt: new Date() },
      });
      if (count === 0) throw err('Buddy request not found', 'NOT_FOUND');
      const row = await context.prisma.buddyRelationship.findUnique({
        where: { id: requestId },
        include: INCLUDE,
      });
      if (!row) throw err('Buddy request not found', 'NOT_FOUND');
      return toRelationship(row);
    },
    declineBuddy: async (
      _parent: unknown,
      { requestId }: { requestId: string },
      context: GraphQLContext
    ): Promise<BuddyMutationResult> => {
      const me = requireRequestId(context, requestId);
      const { count } = await context.prisma.buddyRelationship.deleteMany({
        where: { id: requestId, recipientId: me, status: 'pending' },
      });
      if (count === 0) throw err('Buddy request not found', 'NOT_FOUND');
      return { _id: requestId, success: true };
    },
    removeBuddy: async (
      _parent: unknown,
      { userId }: { userId: string },
      context: GraphQLContext
    ): Promise<BuddyMutationResult> => {
      const me = await requireTargetUser(context, userId);
      const { count } = await context.prisma.buddyRelationship.deleteMany({
        where: { pairKey: toPairKey(me, userId) },
      });
      if (count === 0) throw err('Buddy not found', 'NOT_FOUND');
      return { _id: userId, success: true };
    },
  },
};
