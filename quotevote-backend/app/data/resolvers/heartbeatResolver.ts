import { GraphQLError } from 'graphql';
import type { Prisma } from '@prisma/client';
import { pubsub } from '../utils/pubsub';
import { SUBSCRIPTION_EVENTS } from '../../types/graphql';
import { isObjectId } from '~/data/resolvers/utils/common';
import { findBlockBetween } from '~/data/utils/userBlock';
import type { GraphQLContext, PresenceView } from '~/types/graphql';
import type * as Common from '~/types/common';

const ALLOWED_STATUSES: ReadonlySet<Common.PresenceStatus> = new Set([
  'online',
  'away',
  'dnd',
  'offline',
  'invisible',
]);

const STATUS_MESSAGE_MAX_LENGTH = 200;

/** A heartbeat older than this reads as offline, the same window `cleanupStalePresence` uses. */
const STALE_HEARTBEAT_MS = 120000;

/**
 * Presence records written by the legacy API have no `createdAt`, so reading the whole
 * record fails. Read (and return from writes) only these fields.
 */
export const PRESENCE_RECORD_SELECT = {
  id: true,
  userId: true,
  status: true,
  statusMessage: true,
  preferredStatus: true,
  preferredStatusMessage: true,
  lastHeartbeat: true,
  lastSeen: true,
} as const satisfies Prisma.PresenceSelect;

/** What `getPresence` returns when there is nothing to show, as in legacy. */
function offlinePresence(userId: string): PresenceView {
  return { userId, status: 'offline', statusMessage: '' };
}

type UpdatePresenceArgs = {
  presence: {
    status: string;
    statusMessage?: string | null;
  };
};

export function toPublicPresence(doc: {
  id: string;
  userId: string;
  status: Common.PresenceStatus;
  statusMessage?: string | null;
  lastHeartbeat?: Date | string | number | null;
  lastSeen?: Date | string | number | null;
}): Common.Presence {
  return {
    _id: doc.id,
    userId: doc.userId,
    status: doc.status,
    statusMessage: doc.statusMessage ?? undefined,
    lastHeartbeat: doc.lastHeartbeat ?? undefined,
    lastSeen: doc.lastSeen ?? undefined,
  };
}

export const heartbeatResolver = {
  Query: {
    getPresence: async (
      _parent: unknown,
      args: { userId: string },
      context: GraphQLContext
    ): Promise<PresenceView> => {
      const userId = args.userId?.trim() ?? '';
      if (!isObjectId(userId)) return offlinePresence(userId);

      const viewerId = context.userId;
      const isSelf = viewerId?.toLowerCase() === userId.toLowerCase();

      // Hide presence in both directions when either user blocks the other.
      if (viewerId && !isSelf) {
        const { aBlocksB, bBlocksA } = await findBlockBetween(context.prisma, viewerId, userId);
        if (aBlocksB || bBlocksA) return offlinePresence(userId);
      }

      const presence = await context.prisma.presence.findUnique({
        where: { userId },
        select: PRESENCE_RECORD_SELECT,
      });
      if (!presence) return offlinePresence(userId);

      const stale =
        !presence.lastHeartbeat ||
        Date.now() - new Date(presence.lastHeartbeat).getTime() > STALE_HEARTBEAT_MS;
      // Invisible members look offline to everyone else, as in the buddy list.
      const hidden = !isSelf && presence.status === 'invisible';
      if (stale || hidden || presence.status === 'offline') {
        return { ...toPublicPresence(presence), status: 'offline', statusMessage: '' };
      }
      return toPublicPresence(presence);
    },
  },

  Mutation: {
    heartbeat: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext
    ): Promise<{
      success: boolean;
      timestamp: string;
      status: string;
      statusMessage: string;
    }> => {
      const { user } = context;
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const userId = user._id.toString();
      const now = new Date();
      const existing = await context.prisma.presence.findUnique({
        where: { userId },
        select: PRESENCE_RECORD_SELECT,
      });

      const presence = existing
        ? await context.prisma.presence.update({
            where: { userId },
            select: PRESENCE_RECORD_SELECT,
            data: {
              lastHeartbeat: now,
              lastSeen: now,
              ...(existing.status === 'offline'
                ? {
                    status:
                      existing.preferredStatus && existing.preferredStatus !== 'offline'
                        ? existing.preferredStatus
                        : 'online',
                    ...(typeof existing.preferredStatusMessage === 'string'
                      ? { statusMessage: existing.preferredStatusMessage }
                      : {}),
                  }
                : {}),
            },
          })
        : await context.prisma.presence.upsert({
            where: { userId },
            select: PRESENCE_RECORD_SELECT,
            create: {
              userId,
              status: 'online',
              preferredStatus: 'online',
              preferredStatusMessage: '',
              lastHeartbeat: now,
              lastSeen: now,
            },
            update: {
              lastHeartbeat: now,
              lastSeen: now,
            },
          });

      return {
        success: true,
        timestamp: (presence.lastHeartbeat ?? now).toISOString(),
        status: presence.status,
        statusMessage: presence.statusMessage ?? '',
      };
    },

    updatePresence: async (
      _parent: unknown,
      args: UpdatePresenceArgs,
      context: GraphQLContext
    ): Promise<Common.Presence> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const status = args.presence?.status?.trim();
      if (!status || !ALLOWED_STATUSES.has(status as Common.PresenceStatus)) {
        throw new GraphQLError('status must be one of: online, away, dnd, offline, invisible', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const rawMessage = args.presence.statusMessage ?? '';
      const statusMessage =
        typeof rawMessage === 'string' ? rawMessage.trim().slice(0, STATUS_MESSAGE_MAX_LENGTH) : '';

      const userId = context.user._id.toString();
      const now = new Date();

      const normalizedStatus = status as Common.PresenceStatus;
      const preferredStatus: Common.PresenceStatus =
        normalizedStatus === 'offline' ? 'online' : normalizedStatus;
      const updated = await context.prisma.presence.upsert({
        where: { userId },
        select: PRESENCE_RECORD_SELECT,
        create: {
          userId,
          status: normalizedStatus,
          statusMessage,
          preferredStatus,
          preferredStatusMessage: statusMessage,
          lastHeartbeat: now,
          lastSeen: now,
        },
        update: {
          status: normalizedStatus,
          statusMessage,
          preferredStatus,
          preferredStatusMessage: statusMessage,
          lastHeartbeat: now,
          lastSeen: now,
        },
      });

      await pubsub.publish(SUBSCRIPTION_EVENTS.PRESENCE_UPDATED, {
        presence: {
          userId,
          status: updated.status,
          statusMessage: updated.statusMessage ?? '',
          lastSeen: updated.lastSeen,
        },
      });

      return toPublicPresence(updated);
    },
  },
};
