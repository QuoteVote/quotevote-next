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

export const UserInviteType: GraphQLObjectType<Common.UserInvite, GraphQLContext> =
  new GraphQLObjectType<Common.UserInvite, GraphQLContext>({
    name: 'UserInvite',
    description: 'Outstanding invite record for a prospective user.',
    fields: (): GraphQLFieldConfigMap<Common.UserInvite, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      email: { type: new GraphQLNonNull(GraphQLString) },
      // Access requests: the legacy code as a string ("1" requested, "2" declined,
      // "4" accepted), as production serves it. Sent invites: pending, accepted,
      // declined or expired.
      status: { type: GraphQLString },
      _userId: {
        type: GraphQLString,
        resolve: (invite) => (invite as Common.UserInvite & { _userId?: string })._userId,
      },
      joined: { type: DateScalar, resolve: (invite) => invite.created },
      // The schema is built from these types' SDL, so fields read straight off the
      // resolver's objects: userInviteRequests and getUserInvites set `joined`.
      expiresAt: { type: DateScalar },
      signedUp: {
        type: GraphQLBoolean,
        description: 'Access requests only: whether an accepted request has finished signup.',
      },
    }),
  });

export const UserInvite = UserInviteType;
