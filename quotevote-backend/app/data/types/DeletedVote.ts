import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';

interface DeletedIdPayload {
  _id?: string;
}

export const DeletedVoteType: GraphQLObjectType<DeletedIdPayload, GraphQLContext> =
  new GraphQLObjectType<DeletedIdPayload, GraphQLContext>({
    name: 'DeletedVote',
    description: 'Response payload for a soft-deleted Vote mutation.',
    fields: (): GraphQLFieldConfigMap<DeletedIdPayload, GraphQLContext> => ({
      _id: { type: GraphQLString },
    }),
  });

export const DeletedVote = DeletedVoteType;
