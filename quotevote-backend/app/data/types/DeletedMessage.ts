import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';

interface DeletedIdPayload {
  _id?: string;
}

export const DeletedMessageType: GraphQLObjectType<DeletedIdPayload, GraphQLContext> =
  new GraphQLObjectType<DeletedIdPayload, GraphQLContext>({
    name: 'DeletedMessage',
    description: 'Response payload for a soft-deleted Message mutation.',
    fields: (): GraphQLFieldConfigMap<DeletedIdPayload, GraphQLContext> => ({
      _id: { type: GraphQLString },
    }),
  });

export const DeletedMessage = DeletedMessageType;
