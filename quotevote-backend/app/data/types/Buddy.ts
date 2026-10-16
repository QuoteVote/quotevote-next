import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  type GraphQLFieldConfigMap,
} from 'graphql';
import type {
  GraphQLContext,
  BuddyMutationResult,
  BuddyRelationshipResult,
  BuddyUserResult,
} from '~/types/graphql';
import { DateScalar, JSONScalar } from './scalars';

export const BuddyStatusEnum = new GraphQLEnumType({
  name: 'BuddyStatus',
  values: { pending: { value: 'pending' }, accepted: { value: 'accepted' } },
});

export const BuddyUserType: GraphQLObjectType<BuddyUserResult, GraphQLContext> =
  new GraphQLObjectType<BuddyUserResult, GraphQLContext>({
    name: 'BuddyUser',
    description: 'Public subset of a user shown in buddy lists and requests.',
    fields: (): GraphQLFieldConfigMap<BuddyUserResult, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      name: { type: GraphQLString },
      username: { type: GraphQLString },
      avatar: { type: JSONScalar },
    }),
  });

export const BuddyRelationshipType: GraphQLObjectType<BuddyRelationshipResult, GraphQLContext> =
  new GraphQLObjectType<BuddyRelationshipResult, GraphQLContext>({
    name: 'BuddyRelationship',
    description: 'A buddy request or accepted buddy pair.',
    fields: (): GraphQLFieldConfigMap<BuddyRelationshipResult, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      status: { type: new GraphQLNonNull(BuddyStatusEnum) },
      requester: { type: new GraphQLNonNull(BuddyUserType) },
      recipient: { type: new GraphQLNonNull(BuddyUserType) },
      createdAt: { type: new GraphQLNonNull(DateScalar) },
      acceptedAt: { type: DateScalar },
    }),
  });

export const BuddyMutationResultType: GraphQLObjectType<BuddyMutationResult, GraphQLContext> =
  new GraphQLObjectType<BuddyMutationResult, GraphQLContext>({
    name: 'BuddyMutationResult',
    description: 'Result of declining a request or removing a buddy.',
    fields: (): GraphQLFieldConfigMap<BuddyMutationResult, GraphQLContext> => ({
      _id: { type: new GraphQLNonNull(GraphQLString) },
      success: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
  });
