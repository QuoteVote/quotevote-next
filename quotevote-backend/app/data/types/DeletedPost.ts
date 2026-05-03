import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';

interface DeletedIdPayload {
  _id?: string;
}

export const DeletedPostType: GraphQLObjectType<DeletedIdPayload, GraphQLContext> =
  new GraphQLObjectType<DeletedIdPayload, GraphQLContext>({
    name: 'DeletedPost',
    description: 'Response payload for a soft-deleted Post mutation.',
    fields: (): GraphQLFieldConfigMap<DeletedIdPayload, GraphQLContext> => ({
      _id: { type: GraphQLString },
    }),
  });

export const DeletedPost = DeletedPostType;
