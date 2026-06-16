import {
  GraphQLBoolean,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { DateScalar } from './scalars';
import { PresenceStatusEnum } from './enums';
import { UserType } from './User';

interface PresenceShape extends Common.Presence {
  user?: Common.User;
}

export const PresenceType: GraphQLObjectType<PresenceShape, GraphQLContext> = new GraphQLObjectType<
  PresenceShape,
  GraphQLContext
>({
  name: 'Presence',
  description: 'User presence status (online / away / dnd / offline / invisible).',
  fields: (): GraphQLFieldConfigMap<PresenceShape, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(PresenceStatusEnum) },
    statusMessage: { type: GraphQLString },
    lastHeartbeat: { type: new GraphQLNonNull(DateScalar) },
    lastSeen: { type: DateScalar },
    user: { type: UserType },
  }),
});

interface PresenceUpdateShape {
  userId: string;
  status: Common.PresenceStatus;
  statusMessage?: string;
  lastSeen?: Date | string | number;
}

export const PresenceUpdateType: GraphQLObjectType<PresenceUpdateShape, GraphQLContext> =
  new GraphQLObjectType<PresenceUpdateShape, GraphQLContext>({
    name: 'PresenceUpdate',
    description: 'Presence change payload delivered over subscriptions.',
    fields: (): GraphQLFieldConfigMap<PresenceUpdateShape, GraphQLContext> => ({
      userId: { type: new GraphQLNonNull(GraphQLString) },
      status: { type: new GraphQLNonNull(PresenceStatusEnum) },
      statusMessage: { type: GraphQLString },
      lastSeen: { type: DateScalar },
    }),
  });

interface HeartbeatResponseShape {
  success: boolean;
  timestamp: Date | string | number;
}

export const HeartbeatResponseType: GraphQLObjectType<HeartbeatResponseShape, GraphQLContext> =
  new GraphQLObjectType<HeartbeatResponseShape, GraphQLContext>({
    name: 'HeartbeatResponse',
    description: 'Response from a presence heartbeat mutation.',
    fields: (): GraphQLFieldConfigMap<HeartbeatResponseShape, GraphQLContext> => ({
      success: { type: new GraphQLNonNull(GraphQLBoolean) },
      timestamp: { type: new GraphQLNonNull(DateScalar) },
    }),
  });

export const Presence = PresenceType;
