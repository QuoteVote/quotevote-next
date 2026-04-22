/**
 * Shared GraphQL enum types used by the domain schema.
 * Values mirror the `Common.PresenceStatus` / `Common.RosterStatus` string unions.
 */

import { GraphQLEnumType } from 'graphql';

export const PresenceStatusEnum = new GraphQLEnumType({
  name: 'PresenceStatus',
  values: {
    online: { value: 'online' },
    away: { value: 'away' },
    dnd: { value: 'dnd' },
    invisible: { value: 'invisible' },
    offline: { value: 'offline' },
  },
});

export const RosterStatusEnum = new GraphQLEnumType({
  name: 'RosterStatus',
  values: {
    pending: { value: 'pending' },
    accepted: { value: 'accepted' },
    blocked: { value: 'blocked' },
  },
});
