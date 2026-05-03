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
import { RosterStatusEnum } from './enums';
import { UserType } from './User';
import { PresenceType } from './Presence';

interface RosterShape extends Common.Roster {
  buddy?: Common.User;
  presence?: Common.Presence;
}

export const RosterType: GraphQLObjectType<RosterShape, GraphQLContext> = new GraphQLObjectType<
  RosterShape,
  GraphQLContext
>({
  name: 'Roster',
  description: 'Buddy-list entry linking two users with a relationship status.',
  fields: (): GraphQLFieldConfigMap<RosterShape, GraphQLContext> => ({
    _id: { type: new GraphQLNonNull(GraphQLString) },
    userId: { type: new GraphQLNonNull(GraphQLString) },
    buddyId: { type: new GraphQLNonNull(GraphQLString) },
    status: { type: new GraphQLNonNull(RosterStatusEnum) },
    initiatedBy: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (r) => r.initiatedBy ?? r.userId,
    },
    buddy: { type: UserType },
    presence: { type: PresenceType },
    created: { type: new GraphQLNonNull(DateScalar) },
    updated: {
      type: new GraphQLNonNull(DateScalar),
      resolve: (r) => r.updated ?? r.created,
    },
  }),
});

interface BuddyWithPresenceShape {
  user: Common.User;
  presence?: Common.Presence;
  roster: Common.Roster;
}

export const BuddyWithPresenceType: GraphQLObjectType<BuddyWithPresenceShape, GraphQLContext> =
  new GraphQLObjectType<BuddyWithPresenceShape, GraphQLContext>({
    name: 'BuddyWithPresence',
    description: 'Buddy user joined with their current presence + roster entry.',
    fields: (): GraphQLFieldConfigMap<BuddyWithPresenceShape, GraphQLContext> => ({
      user: { type: new GraphQLNonNull(UserType) },
      presence: { type: PresenceType },
      roster: { type: new GraphQLNonNull(RosterType) },
    }),
  });

interface DeletedRosterShape {
  _id: string;
  success: boolean;
}

export const DeletedRosterType: GraphQLObjectType<DeletedRosterShape, GraphQLContext> =
  new GraphQLObjectType<DeletedRosterShape, GraphQLContext>({
    name: 'DeletedRoster',
    description: 'Response payload for a removed roster entry.',
    fields: (): GraphQLFieldConfigMap<DeletedRosterShape, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      success: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
  });

export const Roster = RosterType;
