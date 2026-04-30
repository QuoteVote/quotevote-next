import { GraphQLError } from 'graphql';
import Presence from '../models/Presence';
import type { GraphQLContext } from '~/types/graphql';

export const heartbeatResolver = {
  Mutation: {
    heartbeat: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ): Promise<{ success: boolean; timestamp: string }> => {
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
      };
    },
  },
};
