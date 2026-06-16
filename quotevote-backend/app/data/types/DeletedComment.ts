import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';

interface DeletedIdPayload {
  _id?: string;
}

export const DeletedCommentType: GraphQLObjectType<DeletedIdPayload, GraphQLContext> =
  new GraphQLObjectType<DeletedIdPayload, GraphQLContext>({
    name: 'DeletedComment',
    description: 'Response payload for a soft-deleted Comment mutation.',
    fields: (): GraphQLFieldConfigMap<DeletedIdPayload, GraphQLContext> => ({
      _id: { type: GraphQLString },
    }),
  });

export const DeletedComment = DeletedCommentType;
