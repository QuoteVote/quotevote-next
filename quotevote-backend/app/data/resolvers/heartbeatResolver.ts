import { GraphQLError } from 'graphql';
import Presence from '../models/Presence';
import { pubsub } from '../utils/pubsub';
import { SUBSCRIPTION_EVENTS } from '../../types/graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';

const ALLOWED_STATUSES: ReadonlySet<Common.PresenceStatus> = new Set([
  'online',
  'away',
  'dnd',
  'offline',
  'invisible',
]);

const STATUS_MESSAGE_MAX_LENGTH = 200;

type UpdatePresenceArgs = {
  presence: {
    status: string;
    statusMessage?: string | null;
  };
};

function toPublicPresence(doc: {
  _id: { toString(): string };
  userId: { toString(): string };
  status: Common.PresenceStatus;
  statusMessage?: string | null;
  lastHeartbeat?: Date | string | number;
  lastSeen?: Date | string | number | null;
}): Common.Presence {
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    status: doc.status,
    statusMessage: doc.statusMessage ?? undefined,
    lastHeartbeat: doc.lastHeartbeat,
    lastSeen: doc.lastSeen ?? undefined,
  };
}

export const heartbeatResolver = {
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

      const presence = await Presence.updateHeartbeat(user._id.toString());

      return {
        success: true,
        timestamp: new Date(presence.lastHeartbeat).toISOString(),
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
        throw new GraphQLError(
          'status must be one of: online, away, dnd, offline, invisible',
          { extensions: { code: 'BAD_USER_INPUT' } }
        );
      }

      const rawMessage = args.presence.statusMessage ?? '';
      const statusMessage =
        typeof rawMessage === 'string' ? rawMessage.trim().slice(0, STATUS_MESSAGE_MAX_LENGTH) : '';

      const userId = context.user._id.toString();
      const now = new Date();

      const preferredStatus = status === 'offline' ? 'online' : status;
      const updated = await Presence.findOneAndUpdate(
        { userId },
        {
          $set: {
            status,
            statusMessage,
            preferredStatus,
            preferredStatusMessage: statusMessage,
            lastHeartbeat: now,
            lastSeen: now,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (!updated) {
        throw new GraphQLError('Failed to update presence', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

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
