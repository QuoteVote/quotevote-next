import {
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
      status: { type: GraphQLString },
      _userId: {
        type: GraphQLString,
        resolve: (invite) => (invite as Common.UserInvite & { _userId?: string })._userId,
      },
      joined: { type: DateScalar, resolve: (invite) => invite.created },
    }),
  });

export const UserInvite = UserInviteType;
